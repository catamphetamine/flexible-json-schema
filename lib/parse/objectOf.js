import appendPathKey from '../appendPathKey.js';

export default function parseObjectOfProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  value,
  context,
  parseProperty,
  parseSchemaProperty
}) {
  const { objectOf } = schemaEntry;

  if (context.structure === 'flat') {
    // Example: `{ object: '{"a":"b"}' }`.
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
      parsedFlatStructure: true,
      structure: undefined
    };
  }

  for (const key of Object.keys(value)) {
    const valueSchema = typeof objectOf === 'string'
      ? {
        type: objectOf,
        description: 'A value of an object'
      }
      : objectOf;

    value[key] = parseSchemaProperty({
      key,
      path: appendPathKey(path, key),
      schemaPath: appendPathKey(schemaPath, 'objectOf'),
      schemaEntry: valueSchema,
      value: value[key],
      context,
      parseProperty
    });
  }

  return value;
}
