import appendPathIndex from '../appendPathIndex.js';
import getNativeType from '../getNativeType.js';
import parseTypedProperty from './type.js';

export default function parseArrayOfProperty(
  key,
  path,
  schemaPath,
  value,
  arrayOf,
  context,
  parseProperty,
  parseSchemaProperty
) {
  if (context.structure === 'flat') {
    // Example: `{ array: '["a","b"]' }`.
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
      parsedFlatStructure: true,
      structure: undefined
    };
  }

  if (!Array.isArray(value)) {
    throw context.createParseError({
      message: `Expected an array, got a ${getNativeType(value)}`,
      type: 'unsupported',
      path,
      value
    });
  }

  return value.map((value, i) => {
    return typeof arrayOf === 'string'
      ? parseTypedProperty(
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
        schemaPath,
        value,
        arrayOf,
        context,
        parseProperty
      );
  });
}
