// import { cloneDeep } from 'lodash-es';

import defaultCreateParseError, { getParseErrorMessage, SchemaParseError } from './createParseError.js';
import SchemaError from './SchemaError.js';

import isObject from './isObject.js';
import appendPathKey from './appendPathKey.js';
import normalizeSchema from './schema/normalizeSchema.js';

import parseObjectProperty from './parse/object.js';

import SCHEMA_ENTRY_TYPES from './schemaEntryTypes.js';

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
      return parseSchemaProperty({
        key: undefined,
        path: undefined,
        schemaPath: undefined,
        schemaEntry: schema,
        value: data,
        context,
        parseProperty
      });
    }

    schema = normalizeSchema(schema, { context });

    return parseObjectProperty({
      key: undefined,
      path: undefined,
      schemaPath: undefined,
      schemaEntry: schema,
      value: data,
      context,
      parseProperty,
      parseSchemaProperty,
      rootValue: true,
      inlineObjectSchema: true
    });
  };
}

function parseSchemaProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  value,
  context,
  parseProperty
}) {
  if (value === undefined || value === null) {
    return value;
  }

  if (!isObject(schemaEntry)) {
    throw new SchemaError(`Unsupported schema entry. Must be an object:\n${JSON.stringify(schemaEntry, null, 2)}`, {
      path: schemaPath
    });
  }

  if (!path) {
    schemaEntry = normalizeSchema(schemaEntry, { context })
  }

  for (const schemaEntryType of SCHEMA_ENTRY_TYPES) {
    if (schemaEntryType.test(schemaEntry)) {
      return schemaEntryType.parse({
        key,
        path,
        schemaPath,
        schemaEntry,
        value,
        context,
        parseProperty,
        parseSchemaProperty
      });
    }
  }

  throw new SchemaError(`Unsupported schema entry:\n${JSON.stringify(schemaEntry, null, 2)}`, {
    path: schemaPath
  });
}

