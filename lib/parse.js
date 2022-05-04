// import { cloneDeep } from 'lodash-es';

import parseDateIsoString from './parseDateIsoString.js';
import parseDateUsingFormat from './parseDateUsingFormat.js';
import defaultCreateParseError from './createParseError.js';
import SchemaError from './SchemaError.js';

import isObject from './isObject.js';
import testWhen from './testWhen.js';
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
  createParseError = defaultCreateParseError,
  structure,
  dateFormat,
  parseDatesOnly = false,
  inPlace = false,
  // context: customContext
} = {}) {
  const context = {
    structure,
    parseDatesOnly,
    dateFormat,
    createParseError
    // customContext
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
    oneOfType,
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
          throw context.createParseError({
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
    let type;
    if (context.parseDatesOnly) {
      // Parsing with `parseDatesOnly: true` flag ignores `oneOf`-type values.
      // The rationale is that a JSON schema can't specify `Date` objects
      // as part of a `oneOf` value list, so it can't be a date anyway.
      // Theoretically, it could employ a workaround like storing date values
      // in "date ISO string" format and then specifying some additional flag
      // like `oneOfDates: true`, but currently there's no need for such feature.
      type = 'string';
    } else {
      type = typeof oneOf[0];
      switch (type) {
        case 'string':
        case 'number':
        case 'boolean':
          break;
        default:
          throw new SchemaError('Currently, only `oneOf` lists consisting of either string or number or boolean values are supported when parsing using schema.', {
            path
          });
      }
    }
    return parseSimpleProperty({
      key,
      path,
      value,
      type,
      context,
      parseProperty
    });
    // Doesn't validate the parsed value because this is parsing, not validation.
    // if (!oneOf.includes(value)) {
    //   throw context.createParseError({
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
          throw context.createParseError({
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
      path
    });
  } else if (oneOfType) {
    if (!Array.isArray(oneOfType)) {
      throw new SchemaError('`oneOfType` must be an array', { path });
    }

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
      }

      if (typeVariations.length > 1) {
        throw context.createParseError({
          message: 'More than one type variation fits the value',
          path,
          value
        });
      }

      if (typeVariations.length === 0) {
        throw context.createParseError({
          message: 'No type variation fits the value',
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

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return value;
      }
      const typeVariations = oneOfType.filter(_ => _.is.slice(-2) === '[]')
        .map((typeVariation) => ({
          ...typeVariation,
          // Remove the `[]` postfix.
          is: typeVariation.is.slice(0, -2)
        }));
      return parseOneOfTypeProperty(value, value[0], typeVariations);
    } else {
      const typeVariations = oneOfType.filter(_ => _.is.slice(-2) !== '[]');
      return parseOneOfTypeProperty(value, value, typeVariations);
    }
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
  // key,
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
          parsePropertyValue: ({ path, type, value }) => parseSimpleProperty({
            path,
            type,
            value,
            context
          }),
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
      path,
      value
    });
  }
}
