import appendPathIndex from '../appendPathIndex.js';
import appendPathKey from '../appendPathKey.js';
import getNativeType from '../getNativeType.js';
import parseTypedProperty from './type.js';

export default function parseArrayOfProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  value,
  context,
  parseProperty,
  parseSchemaProperty
}) {
  const { arrayOf } = schemaEntry;

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
      ? parseTypedProperty({
        key: appendPathIndex(key, i),
        path: appendPathIndex(path, i),
        schemaPath: appendPathKey(schemaPath, 'arrayOf'),
        schemaEntry: {
          type: arrayOf,
          description: schemaEntry.description
        },
        value,
        context,
        parseProperty
      })
      : parseSchemaProperty({
        key: appendPathIndex(key, i),
        path: appendPathIndex(path, i),
        schemaPath: appendPathKey(schemaPath, 'arrayOf'),
        schemaEntry: arrayOf,
        value,
        context,
        parseProperty
      });
  });
}
