// import TYPES from '../validate/types/index.js';
// import SchemaError from '../SchemaError.js';

import getNativeType from '../getNativeType.js';

import parseDateIsoString from '../date/parseDateIsoString.js';
import parseDateUsingFormat from '../date/parseDateUsingFormat.js';

export default function parseTypedProperty(
  key,
  path,
  value,
  type,
  context,
  parseProperty
) {
  // if (!TYPES[type]) {
  //   throw new SchemaError(`Unsupported schema property type: "${type}"`, {
  //     path: schemaPath
  //   });
  // }

  if (value === null) {
    return null;
  }

  // If only parse dates from strings to `Date` instances.
  if (context.parseDatesOnly) {
    if (type === 'date') {
      return parseDate({
        path,
        value,
        context
      });
    }
    return value;
  }

  // If the `value`, or its parent, was `JSON.parse()`-d
  // then there's no need to convert anything from strings
  // because the values of such `JSON.parse()`-d structures
  // should already be of their appropriate "native" type.
  // The only exception is "date" type because there's no
  // representation for it in JSON data format.
  if (context.parsedFlatStructure) {
    if (type === 'date') {
      return parseDate({
        path,
        value,
        context
      });
    }
    return value;
  }

  return parseTypedProperty_(
    key,
    path,
    value,
    type,
    context,
    parseProperty
  );
}

function parseTypedProperty_(
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
      validateString(value, path, context);
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
      validateString(value, path, context);
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
      validateString(value, path, context);
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
      validateString(value, path, context);
      value = parseDate({
        path,
        value,
        context
      });
      break;

    case 'string':
      validateString(value, path, context);
      break;

    default:
      if (parseProperty) {
        value = parseProperty({
          path,
          type,
          value,
          parsePropertyValue: ({ path, type, value }) => parseTypedProperty(
            key,
            path,
            value,
            type,
            context,
            undefined
          ),
          // context: context.customContext,
          createParseError: context.createParseError
        });
      } else {
        // By default, it leaves all other property values as is.
        // Examples: "string", "phone", "email", "url", etc.
        // It could also be a "custom" type describing an object or an array,
        // so `value` is not necessarily a string.
      }
  }

  return value;
}

function validateString(value, path, context) {
  if (typeof value !== 'string') {
    throw context.createParseError({
      message: `Expected value to be a string, got a ${getNativeType(value)}'`,
      type: 'unsupported',
      path,
      value
    });
  }
}

function parseDate({
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
