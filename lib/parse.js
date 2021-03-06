// import { cloneDeep } from 'lodash-es';

import defaultCreateParseError, { getParseErrorMessage, SchemaParseError } from './createParseError.js';
import SchemaError from './SchemaError.js';

import isObject from './isObject.js';
import expandSchemaReference from './expandSchemaReference.js';

import parseArrayOfProperty from './parse/arrayOf.js';
import parseObjectOfProperty from './parse/objectOf.js';
import parseOneOfProperty from './parse/oneOf.js';
import parseOneOfTypeProperty from './parse/oneOfType.js';
import parseObjectProperty from './parse/object.js';
import parseTypedProperty from './parse/type.js';

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
    schema = expandSchemaReference(schema, { path: undefined, context })

    return parseObjectProperty(
      undefined,
      undefined,
      data,
      schema,
      context,
      parseProperty,
      parseSchemaProperty,
      { root: true }
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
  schemaEntry = expandSchemaReference(schemaEntry, { path, context })

  const {
    oneOf,
    arrayOf,
    objectOf,
    oneOfType,
    type,
    schema
  } = schemaEntry;

  if (oneOf) {
    return parseOneOfProperty(
      key,
      path,
      value,
      oneOf,
      context,
      parseProperty
    );
  }

  if (arrayOf) {
    return parseArrayOfProperty(
      key,
      path,
      value,
      arrayOf,
      context,
      parseProperty,
      parseSchemaProperty
    );
  }

  if (objectOf) {
    return parseObjectOfProperty(
      key,
      path,
      value,
      objectOf,
      context,
      parseProperty,
      parseSchemaProperty
    );
  }

  if (oneOfType) {
    return parseOneOfTypeProperty(
      key,
      path,
      value,
      oneOfType,
      context,
      parseProperty,
      parseSchemaProperty
    );
  }

  if (type && typeof type === 'string') {
    return parseTypedProperty(
      key,
      path,
      value,
      type,
      context,
      parseProperty
    );
  }

  if (isObject(schema)) {
    return parseObjectProperty(
      key,
      path,
      value,
      schema,
      context,
      parseProperty,
      parseSchemaProperty
    )
  }

  if (isObject(schemaEntry)) {
    return parseObjectProperty(
      key,
      path,
      value,
      schemaEntry,
      context,
      parseProperty,
      parseSchemaProperty
    )
  }

  throw new SchemaError(`Unsupported schema entry:\n${JSON.stringify(schemaEntry, null, 2)}`, {
    path
  });
}

