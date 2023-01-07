import validateOneOfType from '../validateOneOfType.js';
import appendPathIndex from '../appendPathIndex.js';
import isObject_ from '../isObject.js';
import testWhen from '../testWhen.js';
import valueMatchesTypeVariation from '../valueMatchesTypeVariation.js';

export default function parseOneOfTypeProperty(
  key,
  path,
  schemaPath,
  value,
  oneOfType,
  context,
  parseProperty,
  parseSchemaProperty
) {
  validateOneOfType(oneOfType, { schemaPath });

  let isArray
  let isObject

  if (context.structure === 'flat') {
    // Determine if the `value` is an array.
    const array = parseFlatStructureArray({
      path,
      value,
      oneOfType,
      context
    });

    if (array) {
      return array;
    }

    // Determine if the `value` is an object.
    const object = parseFlatStructureObject({
      path,
      value,
      oneOfType,
      context
    });

    if (object) {
      return object;
    }

    // No longer a "flat" structure.
    context = {
      ...context,
      parsedFlatStructure: true,
      structure: undefined
    }
  } else {
    // Determine if the `value` is an array.
    isArray = Array.isArray(value);

    // Determine if the `value` is an object.
    isObject = isObject_(value);
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
      // If a `structure: "flat"` object or array has been `JSON.parsed()`
      // then the parsed values are no longer just strings
      // so the matching `typeVariations` could be further narrowed down.
      if (context.parsedFlatStructure) {
        typeVariations = typeVariations.filter((typeVariation) => {
          return valueMatchesTypeVariation(value, typeVariation, { schemaPath, context });
        });
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
      appendPathIndex(schemaPath, oneOfType.indexOf(typeVariations[0])),
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

function parseFlatStructureArray({
  path,
  value,
  oneOfType,
  context
}) {
  // Select array type variations.
  const arrayTypeVariations = oneOfType.filter(_ => _.is.slice(-2) === '[]');

  // If there're any array type variations.
  if (arrayTypeVariations.length > 0) {
    // To find out whether the input string is a stringified JSON array,
    // it could first examine if that string starts with a "[".
    //
    // Suppose it does. The next step would be seeing if the input string
    // could be parsed as a generic string type variation.
    //
    // If it can, it means that the library has no way of discerning between
    // a generic string and a stringified JSON array, because, for example,
    // "[1,2,3]" input string could fit both `is: "string"` and `is: "number[]"`,
    // in which case those two one-of-type branches would "clash" (conflict).
    //
    // The only case when the library can tell that a generic string can only be a
    // stringified JSON array is when such generic string is limited by `oneOf` list
    // of possible values and none of those values start with a "[".
    //
    if (value[0] === '[') {
      if (doStringTypeVariationsConflictWithStringifiedArrayTypeVariation(oneOfType.filter(_ => _.is === 'string'))) {
        throw context.createParseError({
          message: 'Ambiguous `oneOfType` `structure: "flat"` value: could be a stringified JSON array or a generic string',
          type: 'ambiguous',
          path,
          value
        });
      }

      // Parse the `value`.
      // Example: `'["a","b"]'`.
      try {
        return JSON.parse(value);
      } catch (error) {
        throw context.createParseError({
          message: 'Invalid stringified JSON array: ' + error.message,
          type: 'invalid',
          path,
          value
        });
      }
    }
  }
}

function parseFlatStructureObject({
  path,
  value,
  oneOfType,
  context
}) {
  // Select object type variations.
  const objectTypeVariations = oneOfType.filter(_ => _.is === 'object');

  // If there're any object type variations.
  if (objectTypeVariations.length > 0) {
    // To find out whether the input string is a stringified JSON object,
    // it could first examine if that string starts with a "{".
    //
    // Suppose it does. The next step would be seeing if the input string
    // could be parsed as a generic string type variation.
    //
    // If it can, it means that the library has no way of discerning between
    // a generic string and a stringified JSON object, because, for example,
    // "{\"a\":1}" input string could fit both `is: "string"` and `is: "object"`,
    // in which case those two one-of-type branches would "clash" (conflict).
    //
    // The only case when the library can tell that a generic string can only be a
    // stringified JSON object is when such generic string is limited by `oneOf` list
    // of possible values and none of those values start with a "{".
    //
    if (value[0] === '{') {
      if (doStringTypeVariationsConflictWithStringifiedObjectTypeVariation(oneOfType.filter(_ => _.is === 'string'))) {
        throw context.createParseError({
          message: 'Ambiguous `oneOfType` `structure: "flat"` value: could be a stringified JSON object or a generic string',
          type: 'ambiguous',
          path,
          value
        });
      }

      // Parse the `value`.
      // Example: `'{"a":"b"}'`.
      try {
        return JSON.parse(value);
      } catch (error) {
        throw context.createParseError({
          message: 'Invalid stringified JSON object: ' + error.message,
          type: 'invalid',
          path,
          value
        });
      }
    }
  }
}

function doStringTypeVariationsConflictWithStringifiedArrayTypeVariation(stringTypeVariations) {
  for (const stringTypeVariation of stringTypeVariations) {
    if (stringTypeVariation.oneOf) {
      // See if any of the `oneOf` values start with a "[".
      for (const possibleValue of stringTypeVariation.oneOf) {
        if (possibleValue[0] === '[') {
          return true
        }
      }
    } else {
      // If a string type variation isn't limited by `oneOf`,
      // then it could start with a "[", and, therefore,
      // would conflict with a stringified JSON array type variation.
      return true
    }
  }
}

function doStringTypeVariationsConflictWithStringifiedObjectTypeVariation(stringTypeVariations) {
  for (const stringTypeVariation of stringTypeVariations) {
    if (stringTypeVariation.oneOf) {
      // See if any of the `oneOf` values start with a "{".
      for (const possibleValue of stringTypeVariation.oneOf) {
        if (possibleValue[0] === '{') {
          return true
        }
      }
    } else {
      // If a string type variation isn't limited by `oneOf`,
      // then it could start with a "{", and, therefore,
      // would conflict with a stringified JSON object type variation.
      return true
    }
  }
}
