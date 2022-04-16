// import { cloneDeep } from 'lodash-es';

import parseDateIsoString from './parseDateIsoString.js';
import parseDateUsingFormat from './parseDateUsingFormat.js';
import createParseError, { SchemaParseError } from './createParseError.js';
import SchemaError from './SchemaError.js';

import isObject from './isObject.js';

import TYPES from './types.js';

export { SchemaParseError } from './createParseError.js';

/**
 * Creates a function that parses a JSON object using a schema.
 * @param  {object} schema
 * @param  {string} [options.structure] — Pass "flat" when the data being parsed has a "flat" structure: when it's not "recursive" and nested objects and arrays are stringified.
 * @param  {boolean} [options.parseDatesOnly] — Pass `true` to only parse "date ISO strings" into `Date` objects.
 * @param  {boolean} [options.dateFormat] — If stringified dates are in a format other than "date ISO string", pass a `dateFormat` option. Currently, only `"yyyy-mm-dd"` format is supported.
 * @param  {boolean} [options.inPlace] — Pass `true` to modify the passed data object "in-place" instead of creating a copy of it.
 * @return {function} A parsing function that accepts a JSON object and returns a copy of that object with parsed property values.
 */
export default function schemaParser(schema, {
  parseProperty,
  createParseError,
  structure,
  dateFormat,
  parseDatesOnly,
  inPlace,
  context: customContext
} = {}) {
  const context = {
    structure,
    parseDatesOnly,
    dateFormat,
    customContext
  };

  /**
   * Parses a JSON object using a schema.
   * @return {object} A copy of the JSON object with parsed property values.
   */
  return (data) => {
    if (!inPlace) {
      if (structure === 'flat') {
        data = { ...data };
      } else {
        // data = cloneDeep(data);
        throw new Error('When parsing non-`structure: flat` objects, either pass `inPlace: true` option or clone the data object before parsing it because it will be mutated.');
      }
    }

    try {
      for (const key in data) {
        if (data[key] === '') {
          data[key] = undefined;
        }
        if (data[key] === undefined) {
          continue;
        }
        if (schema[key]) {
          data[key] = parseSchemaProperty(
            key,
            key,
            data[key],
            schema[key],
            context,
            parseProperty
          );
        } else {
          throw createParseError({
            message: `Unknown property "${key}"`,
            path: key,
            value: data[key]
          });
        }
      }
    } catch (error) {
      if (createParseError) {
        if (error instanceof SchemaParseError) {
          throw createParseError({
            message: error.message,
            path: error.path,
            value: error.value
          });
        }
      }
      throw error;
    }
    return data;
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
  const {
    oneOf,
    arrayOf,
    objectOf,
    type,
    schema
  } = schemaEntry;
  const onNestedObjectSchema = (schema) => {
    let childrenContext = context;
    // `"flat"` structure parses root-level nested object values from strings.
    if (context.structure === 'flat') {
      value = JSON.parse(value);
      childrenContext = {
        ...context,
        structure: undefined
      }
    }
    // Special case (a hack): `property: {}` means "property is an object".
    // This is used when the `property` itself is validated separately
    // via its own schema. Example: `{ token: { type: 'string' }, profile: {} }`
    // where `profile` has already been validated separately.
    // Don't use this feature to bypass schema validation out of laziness.
    if (Object.keys(schema).length === 0) {
      // Matches any object.
      // Don't parse any properties.
    } else {
      // Nested object schema.
      for (const key in value) {
        if (schema[key]) {
          value[key] = parseSchemaProperty(
            key,
            `${path}.${key}`,
            value[key],
            schema[key],
            childrenContext,
            parseProperty
          );
        } else {
          throw createParseError({
            message: `Unknown property "${key}"`,
            path: `${path}.${key}`,
            value: value[key]
          });
        }
      }
    }
    return value;
  };
  if (oneOf) {
    if (!context.parseDatesOnly) {
      if (typeof oneOf[0] !== 'string') {
        throw new SchemaError('Currently, only `oneOf` lists consisting of string values are supported when parsing using schema.', {
          key,
          path
        });
      }
    }
    return parseSimpleProperty({
      key,
      path,
      value,
      type: 'string',
      context,
      parseProperty
    });
    // if (!oneOf.includes(value)) {
    //   throw createParseError({
    //     message: `${value} must be one of: ${oneOf.join(', ')}`,
    //     path: key,
    //     value
    //   });
    // }
    // return value;
  } else if (arrayOf) {
    if (context.structure === 'flat') {
      // Example: `{ array: '["a","b"]' }`.
      value = JSON.parse(value);
      if (!context.parseDatesOnly) {
        if (!value.every(_ => typeof _ === 'string')) {
          throw createParseError({
            message: `All elements of an array that is parsed from a "flat"-structured data object must be strings:\n${JSON.stringify(value, null, 2)}`,
            path,
            value
          });
        }
      }
    }
    return value.map((value, i) => {
      return typeof arrayOf === 'string'
        ? parseSimpleProperty({
          key,
          path: `${path}[${i}]`,
          value,
          type: arrayOf,
          context,
          parseProperty
        })
        : (() => {
          if (!context.parseDatesOnly) {
            if (context.structure === 'flat') {
              if (arrayOf.oneOf) {
                // Parsing "flat"-structure data objects using an `arrayOf: { oneOf }` schema is supported.
              } else {
                // Otherwise, not tested.
                throw new SchemaError('Parsing arrays of non-basic types from a "flat-structure" data object is not implemented', {
                  key,
                  path
                });
              }
            }
          }
          return parseSchemaProperty(
            key,
            `${path}.${key}[${i}]`,
            value,
            arrayOf,
            context,
            parseProperty
          );
        })();
    });
  } else if (objectOf) {
    if (context.parseDatesOnly) {
      for (const key of Object.keys(value)) {
        parseSchemaProperty(
          key,
          `${path}.${key}`,
          value[key],
          objectOf,
          context,
          parseProperty
        );
      }
      return value;
    }
    throw new SchemaError('Parsing "objectOf" schema properties is not implemented', {
      key,
      path
    });
  } else if (type && typeof type === 'string') {
    return parseSimpleProperty({
      key,
      path,
      value,
      type,
      context,
      parseProperty
    });
  } else if (isObject(schema)) {
    return onNestedObjectSchema(schema);
  } else if (isObject(schemaEntry)) {
    return onNestedObjectSchema(schemaEntry);
  } else {
    throw new SchemaError(`Unsupported schema entry:\n${JSON.stringify(schemaEntry, null, 2)}`, {
      key,
      path
    });
  }
}

function parseSimpleProperty({
  key,
  path,
  value,
  type,
  context,
  parseProperty
}) {
  if (!TYPES[type]) {
    throw new Error(`Unsupported schema property type: ${type}`);
  }

  // Only parse dates from strings to `Date` instances.
  if (context.parseDatesOnly) {
    if (type === 'date') {
      if (value !== null) {
        return _parseDate({
          key,
          path,
          value,
          context
        });
      }
    }
    return value;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw createParseError({
      message: `Expected "${key}" property value to be a string, got "${typeof value}"'`,
      path,
      value
    });
  }

  return parseSimplePropertyFromString({
    key,
    path,
    value,
    type,
    context,
    parseProperty
  });
}

function parseSimplePropertyFromString({
  key,
  path,
  value,
  type,
  context,
  parseProperty
}) {
  const nonParsedValue = value;

  // Parse any value from string.
  switch (type) {
    case 'integer':
    case 'nonNegativeInteger':
    case 'positiveInteger':
      value = parseInt(value, 10);
      if (
        (String(value) !== nonParsedValue)
        ||
        (type === 'id' || type === 'positiveInteger' ? value <= 0 : false)
        ||
        (type === 'nonNegativeInteger' ? value < 0 : false)
      ) {
        throw createParseError({
          message: `"${key}" must be ${type === 'id' || type === 'positiveInteger' ? 'a positive integer number' : 'an integer number'}`,
          path,
          value: nonParsedValue
        });
      }
      break;

    case 'number':
    case 'nonNegativeNumber':
    case 'positiveNumber':
      value = parseFloat(value);
      // It's unlikely that float imprecision would introduce any issues here.
      if (String(value) !== nonParsedValue) {
        throw createParseError({
          message: `"${key}" must be ${type === 'positiveNumber' ? 'a positive number' : 'a number'}`,
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
          throw createParseError({
            message: `"${key}" must either be "1" or "✓" for TRUE or "0" for FALSE but it is "${nonParsedValue}"`,
            path,
            value: nonParsedValue
          });
      }
      break;

    case 'date':
      value = _parseDate({
        key,
        path,
        value,
        context
      });
      break;

    default:
      if (parseProperty) {
        value = parseProperty({
          key,
          path,
          type,
          value,
          parsePropertyValue: ({ key, path, type, value }) => parseSimpleProperty({
            key,
            path,
            type,
            value,
            context
          }),
          context: context.customContext,
          createParseError
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
  key,
  path,
  value,
  context
}) {
  if (context.dateFormat) {
    const date = parseDateUsingFormat(value, context.dateFormat);
    if (date) {
      return date;
    }
    throw createParseError({
      message: `"${key}" must be a date in "${context.dateFormat}" format`,
      path,
      value
    });
  } else {
    const date = parseDateIsoString(value);
    if (date) {
      return date;
    }
    throw createParseError({
      message: `"${key}" must be a date`,
      path,
      value
    });
  }
}
