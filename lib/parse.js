// import { cloneDeep } from 'lodash-es';

import defaultCreateParseError, { getParseErrorMessage, SchemaParseError } from './createParseError.js';
import SchemaError from './SchemaError.js';

import isObject from './isObject.js';
import validateOneOf from './validateOneOf.js';
import validateOneOfType from './validateOneOfType.js';
import testWhen from './testWhen.js';
import TYPES from './types.js';
import appendPathIndex from './appendPathIndex.js';
import appendPathKey from './appendPathKey.js';
import expandSchemaReference from './expandSchemaReference.js';
import parseDateIsoString from './parseDateIsoString.js';
import parseDateUsingFormat from './parseDateUsingFormat.js';

/**
 * Creates a function that parses a JSON object using a schema.
 * @param  {object} schema
 * @param  {object} [options.schemas] — A map of named schemas.
 * @param  {string} [options.structure] — Pass "flat" when the data being parsed has a "flat" structure: when it's not "recursive" and nested objects and arrays are stringified.
 * @param  {boolean} [options.parseDatesOnly] — Pass `true` to only parse "date ISO strings" into `Date` objects.
 * @param  {boolean} [options.dateFormat] — If stringified dates are in a format other than "date ISO string", pass a `dateFormat` option. Currently, only `"yyyy-mm-dd"` format is supported.
 * @param  {boolean} [options.inPlace] — Pass `true` to modify the passed data object "in-place" instead of creating a copy of it.
 * @return {function} A parsing function that accepts a JSON object and returns a copy of that object with parsed property values.
 */
export default function schemaParser(schema, {
  schemas,
  parseProperty,
  createParseError = defaultCreateParseError,
  structure,
  dateFormat,
  parseDatesOnly = false,
  inPlace = false
} = {}) {
  const context = {
    schemas,
    structure,
    parseDatesOnly,
    dateFormat,
    createParseError({ message, errors, type, path, value }) {
      const detailedMessage = getParseErrorMessage({ message, type, path, value });
      return createParseError({
        message: detailedMessage,
        errors: errors || [message],
        type,
        path,
        value
      });
    }
  };

  /**
   * Parses a JSON object using a schema.
   * @return {object} A copy of the JSON object with parsed property values.
   */
  return (data) => {
    if (isObject(data)) {
      if (!inPlace) {
        if (structure === 'flat') {
          data = { ...data };
        } else {
          // It is a common case to parse a passed object "in place"
          // because the code would usually discard the non-parsed object anyway.
          // So this library doesn't `cloneDeep()` by default.
          // data = cloneDeep(data);
          throw new Error('When parsing objects not having a "flat" structure, pass `inPlace: true` option to mutate the original object. If the original object shouldn\'t be mutated, `cloneDeep()` it first.');
        }
      }
    }

    if (typeof schema.description === 'string') {
      return parseSchemaProperty(
        undefined,
        undefined,
        data,
        schema,
        context,
        parseProperty
      );
    }

    // Expand `schema?: string` property (named schema reference).
    schema = expandSchemaReference(schema, { path: undefined }, context)

    return parseObject(
      undefined,
      undefined,
      data,
      schema,
      context,
      parseProperty
    )
  };
}

function parseSchemaProperty(
  key,
  path,
  value,
  schemaEntry,
  context,
  parseProperty
) {
  if (value === undefined || value === null) {
    return value;
  }

  // Expand `schema` reference (by name).
  schemaEntry = expandSchemaReference(schemaEntry, { path }, context)

  const {
    oneOf,
    arrayOf,
    objectOf,
    oneOfType,
    type,
    schema
  } = schemaEntry;

  const onNestedObjectSchema = (schema) => {
    // This `if` block shouldn't be part of `parseObject()` function,
    // because `parseObject()` function is also used in the main parse function
    // when initially starting to parse an object, and in that case the object
    // is not strinigified in case of `structure: "flat"`.
    if (context.structure === 'flat') {
      // Example: `{ object: '{"a":"b"}' }`.
      value = JSON.parse(value);
      context = {
        ...context,
        structure: undefined
      };
    }

    // Special case (a hack): `property: {}` means "property is an object".
    // This is used when the `property` itself is validated separately
    // via its own schema. Example: `{ token: { type: 'string' }, profile: {} }`
    // where `profile` has already been validated separately.
    // Don't use this feature to bypass schema validation out of laziness.
    if (Object.keys(schema).length === 0) {
      // Matches any object.
      // Don't parse any properties.
      return value;
    }

    return parseObject(
      key,
      path,
      value,
      schema,
      context,
      parseProperty
    )
  };

  if (oneOf) {
    validateOneOf(oneOf, { path });
    return parseSimpleProperty(
      key,
      path,
      value,
      typeof oneOf[0],
      context,
      parseProperty
    );
    // Doesn't validate the parsed value because this is parsing, not validation.
    // if (!oneOf.includes(value)) {
    //   throw context.createParseError({
    //     message: `${value} must be one of: ${oneOf.join(', ')}`,
    //     path,
    //     value
    //   });
    // }
    // return value;
  } else if (arrayOf) {
    if (context.structure === 'flat') {
      // Example: `{ array: '["a","b"]' }`.
      value = JSON.parse(value);
      context = {
        ...context,
        structure: undefined
      };
    }
    return value.map((value, i) => {
      return typeof arrayOf === 'string'
        ? parseSimpleProperty(
          appendPathIndex(key, i),
          appendPathIndex(path, i),
          value,
          arrayOf,
          context,
          parseProperty
        )
        : parseSchemaProperty(
          appendPathIndex(key, i),
          appendPathIndex(path, i),
          value,
          arrayOf,
          context,
          parseProperty
        );
    });
  } else if (objectOf) {
    if (context.structure === 'flat') {
      // Example: `{ object: '{"a":"b"}' }`.
      value = JSON.parse(value);
      context = {
        ...context,
        structure: undefined
      };
    }
    for (const key of Object.keys(value)) {
      value[key] = parseSchemaProperty(
        key,
        appendPathKey(path, key),
        value[key],
        objectOf,
        context,
        parseProperty
      );
    }
    return value;
  } else if (oneOfType) {
    validateOneOfType(oneOfType, { path });

    const parseOneOfTypeProperty = (value, testWhenValue, typeVariations) => {
      // Find matching types.
      if (isObject(testWhenValue)) {
        typeVariations = typeVariations.filter(_ => _.is === 'object')
          .filter((typeVariation) => {
            if (typeVariation.when) {
              return testWhen(typeVariation.when, testWhenValue);
            }
            return true;
          })
          .filter(_ => _);
      } else {
        typeVariations = typeVariations.filter(_ => _.is !== 'object');
        if (typeVariations.length > 1) {
          // If there's more than one possibly-matching type variation
          // then it would throw: "More than one type variation fits the value".
          // But, if only dates are being parsed, then only `is: "date"` variations
          // are of any relevance: if there're no matching `is: "date"` variations
          // then it won't matter whether there's any ambiguity since no date would
          // be parsed anyway.
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

      if (context.structure === 'flat') {
        if (is === 'object' || is.slice(-2) === '[]') {
          // Example: `{ object: '{"a":"b"}' }`.
          // Example: `{ array: '["a","b"]' }`.
          value = JSON.parse(value);
          context = {
            ...context,
            structure: undefined
          };
        }
      }

      return parseSchemaProperty(
        key,
        path,
        value,
        typeDefinition,
        context,
        parseProperty
      );
    }

    if (Array.isArray(value)) {
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

      let typeVariations = oneOfType
        .filter(_ => _.is.slice(-2) === '[]')
        .map((typeVariation) => ({
          ...typeVariation,
          // Remove the `[]` postfix.
          is: typeVariation.is.slice(0, -2)
        }));

      if (itemType) {
        typeVariations = typeVariations.filter(_ => _.is !== 'any');
      } else {
        typeVariations = typeVariations.filter(_ => _.is === 'any');
      }

      const testWhenValue = itemType ? value[0] : undefined;
      return parseOneOfTypeProperty(value, testWhenValue, typeVariations);
    } else {
      const typeVariations = oneOfType.filter(_ => _.is.slice(-2) !== '[]');
      return parseOneOfTypeProperty(value, value, typeVariations);
    }
  } else if (type && typeof type === 'string') {
    return parseSimpleProperty(
      key,
      path,
      value,
      type,
      context,
      parseProperty
    );
  } else if (isObject(schema)) {
    return onNestedObjectSchema(schema);
  } else if (isObject(schemaEntry)) {
    return onNestedObjectSchema(schemaEntry);
  } else {
    throw new SchemaError(`Unsupported schema entry:\n${JSON.stringify(schemaEntry, null, 2)}`, {
      path
    });
  }
}

function parseObject(
  key,
  path,
  value,
  schema,
  context,
  parseProperty
) {
  // Nested object schema.
  for (const key in value) {
    if (schema[key]) {
      value[key] = parseSchemaProperty(
        key,
        appendPathKey(path, key),
        value[key],
        schema[key],
        context,
        parseProperty
      );
    } else {
      throw context.createParseError({
        message: `Unknown property "${key}"`,
        type: 'unknown',
        path: appendPathKey(path, key),
        value: value[key]
      });
    }
  }
  return value;
}

function parseSimpleProperty(
  key,
  path,
  value,
  type,
  context,
  parseProperty
) {
  if (!TYPES[type]) {
    throw new Error(`Unsupported schema property type: ${type}`);
  }

  if (value === null) {
    return null;
  }

  if (context.parseDatesOnly) {
    if (type !== 'date') {
      return value;
    }
  }

  if (typeof value !== 'string') {
    throw context.createParseError({
      message: `Expected value to be a string, got a ${typeof value}'`,
      type: 'unsupported',
      path,
      value
    });
  }

  // Only parse dates from strings to `Date` instances.
  if (context.parseDatesOnly) {
    if (type === 'date') {
      return _parseDate({
        path,
        value,
        context
      });
    }
  }

  return parseSimplePropertyFromString(
    key,
    path,
    value,
    type,
    context,
    parseProperty
  );
}

function parseSimplePropertyFromString(
  key,
  path,
  value,
  type,
  context,
  parseProperty
) {
  const nonParsedValue = value;

  // Parse any value from string.
  switch (type) {
    case 'integer':
    case 'nonNegativeInteger':
    case 'positiveInteger':
      value = Number(value);
      if (
        isNaN(value)
        ||
        (type === 'positiveInteger' ? value <= 0 : false)
        ||
        (type === 'nonNegativeInteger' ? value < 0 : false)
      ) {
        let expectedType;
        switch (type) {
          case 'positiveInteger':
            expectedType = 'a positive integer number';
            break;
          case 'nonNegativeInteger':
            expectedType = 'a non-negative integer number';
            break;
          case 'integer':
            expectedType = 'an integer number';
            break;
          default:
            throw new Error(`Parse: Unsupported type "${type}" when parsing integer numbers`)
        }
        throw context.createParseError({
          message: `Expected ${expectedType}`,
          type: 'invalid',
          path,
          value: nonParsedValue
        });
      }
      break;

    case 'number':
    case 'nonNegativeNumber':
    case 'positiveNumber':
      value = Number(value);
      if (
        isNaN(value)
        ||
        (type === 'positiveNumber' ? value <= 0 : false)
        ||
        (type === 'nonNegativeNumber' ? value < 0 : false)
      ) {
        let expectedType;
        switch (type) {
          case 'positiveNumber':
            expectedType = 'a positive number';
            break;
          case 'nonNegativeNumber':
            expectedType = 'a non-negative number';
            break;
          case 'number':
            expectedType = 'a number';
            break;
          default:
            throw new Error(`Parse: Unsupported type "${type}" when parsing numbers`)
        }
        throw context.createParseError({
          message: `Expected ${expectedType}`,
          type: 'invalid',
          path,
          value: nonParsedValue
        });
      }
      break;

    case 'boolean':
      // "✓" is used in URL query parameters.
      // "1" or "0" are used in SFTP CSV file uploads.
      // https://github.com/Acadeum/Tickets/issues/552
      switch (value) {
        case '✓':
        case '1':
          value = true;
          break;
        case '0':
          value = false;
          break;
        default:
          throw context.createParseError({
            message: `Expected "boolean" value to be either "1" or "✓" for TRUE or "0" for FALSE but received "${nonParsedValue}"`,
            type: 'invalid',
            path,
            value: nonParsedValue
          });
      }
      break;

    case 'date':
      value = _parseDate({
        path,
        value,
        context
      });
      break;

    default:
      if (parseProperty) {
        value = parseProperty({
          path,
          type,
          value,
          parsePropertyValue: ({ path, type, value }) => parseSimpleProperty(
            key,
            path,
            type,
            value,
            context,
            undefined
          ),
          // context: context.customContext,
          createParseError: context.createParseError
        });
      } else {
        // By default, it assumes a string.
        // Examples: "string", "phone", "email", "url", etc.
        // Don't add any special handling for such "other" cases
        // because the custom `parseProperty()` function
        // also simply returns `value` for any "other" cases.
      }
  }

  return value;
}

function _parseDate({
  path,
  value,
  context
}) {
  if (context.dateFormat) {
    const date = parseDateUsingFormat(value, context.dateFormat);
    if (date) {
      return date;
    }
    throw context.createParseError({
      message: `Expected a date in "${context.dateFormat}" format`,
      type: 'invalid',
      path,
      value
    });
  } else {
    const date = parseDateIsoString(value);
    if (date) {
      return date;
    }
    throw context.createParseError({
      message: `Expected a date`,
      type: 'invalid',
      path,
      value
    });
  }
}
