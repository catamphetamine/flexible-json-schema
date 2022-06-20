import validateOneOfType from '../validateOneOfType.js'
import isObject_ from '../isObject.js'
import testWhen from '../testWhen.js';

export default function parseOneOfTypeProperty(
  key,
  path,
  value,
  oneOfType,
  context,
  parseProperty,
  parseSchemaProperty
) {
  validateOneOfType(oneOfType, { path });

  // Determine if the `value` is an array.
  let isArray;
  if (context.structure === 'flat') {
    // Select only array type variations.
    const arrayTypeVariations = oneOfType
      .filter(_ => _.is.slice(-2) === '[]');

    isArray = value[0] === '[' &&
      arrayTypeVariations.length === oneOfType.length;

    // Parse the `value`.
    // Example: `'["a","b"]'`.
    try {
      value = JSON.parse(value);
    } catch (error) {
      throw context.createParseError({
        message: 'Invalid stringified JSON array: ' + error.message,
        type: 'invalid',
        path,
        value
      });
    }
    context = {
      ...context,
      structure: undefined
    };
  } else {
    isArray = Array.isArray(value);
  }

  // Determine if the `value` is an object.
  let isObject;
  if (!isArray) {
    if (context.structure === 'flat') {
      // Select only object type variations.
      const objectTypeVariations = oneOfType
        .filter(_ => _.is === 'object');

      isObject = value[0] === '{' &&
        objectTypeVariations.length === oneOfType.length;

      // Parse the `value`.
      // Example: `'{"a":"b"}'`.
      try {
        value = JSON.parse(value);
      } catch (error) {
        throw context.createParseError({
          message: 'Invalid stringified JSON object: ' + error.message,
          type: 'invalid',
          path,
          value
        });
      }
      context = {
        ...context,
        structure: undefined
      };
    } else {
      isObject = isObject_(value);
    }
  }

  const parseOneOfTypeProperty = (typeVariations, sampleValue) => {
    // If the `value` is an object or an array of objects,
    // then only select object type variations,
    // and optionally filter those by `when` conditions, if specified.
    if (isObject_(sampleValue)) {
      typeVariations = typeVariations.filter(_ => _.is === 'object')
        .filter((typeVariation) => {
          if (typeVariation.when) {
            return testWhen(typeVariation.when, sampleValue);
          }
          return true;
        })
        .filter(_ => _);
    }
    // If the `value` is not an object or an array of objects,
    // then only select non-object type variations.
    else {
      typeVariations = typeVariations.filter(_ => _.is !== 'object');
      // If there's more than one possibly-matching type variation
      // then it would throw: "More than one type variation fits the value".
      // But, if only dates are being parsed, then only `is: "date"` variations
      // are of any relevance: if there're no matching `is: "date"` variations
      // then it won't matter whether there's any ambiguity since no date would
      // be parsed anyway.
      if (typeVariations.length > 1) {
        if (context.parseDatesOnly) {
          const possibleTypeVariations = typeVariations;
          // Pick only `is: "date"` type variations.
          // If there's more than one, then it will still throw.
          typeVariations = typeVariations.filter(_ => _.is === 'date');
          // If there're no `is: "date"` type variations,
          // then simply choose any possible type variation
          // because it won't matter since no date will be parsed anyway.
          // This way it won't throw and will proceed.
          if (typeVariations.length === 0) {
            typeVariations = [possibleTypeVariations[0]];
          }
        }
      }
    }

    if (typeVariations.length > 1) {
      throw context.createParseError({
        message: 'More than one type variation fits the value',
        type: 'ambiguous',
        path,
        value
      });
    }

    if (typeVariations.length === 0) {
      throw context.createParseError({
        message: 'No type variation fits the value',
        type: 'unsupported',
        path,
        value
      });
    }

    const { is,  when, ...typeDefinition } = typeVariations[0];

    return parseSchemaProperty(
      key,
      path,
      value,
      typeDefinition,
      context,
      parseProperty
    );
  }

  if (isArray) {
    if (value.length === 0) {
      return value;
    }

    // See if all the items in the list are of the same type.
    let itemType = typeof value[0];
    for (const item of value) {
      if (typeof item !== itemType) {
        itemType = undefined;
      }
    }

    // Select only array type variations.
    let typeVariations = oneOfType
      .filter(_ => _.is.slice(-2) === '[]')
      .map((typeVariation) => ({
        ...typeVariation,
        // Remove the `[]` postfix.
        is: typeVariation.is.slice(0, -2)
      }));

    // If it's a uniform item type array then select only non-"any" type variations.
    // If it's a random item type array then select only "any" type variations.
    if (itemType) {
      typeVariations = typeVariations.filter(_ => _.is !== 'any');
    } else {
      typeVariations = typeVariations.filter(_ => _.is === 'any');
    }
    const sampleValue = itemType ? value[0] : undefined;
    return parseOneOfTypeProperty(typeVariations, sampleValue);
  } else {
    // Select only non-array type variations.
    const typeVariations = oneOfType.filter(_ => _.is.slice(-2) !== '[]')
    const sampleValue = value;
    return parseOneOfTypeProperty(typeVariations, sampleValue);
  }
}
