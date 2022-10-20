import appendPathKey from '../appendPathKey.js';

export default function parseObjectOfProperty(
  key,
  path,
  value,
  objectOf,
  context,
  parseProperty,
  parseSchemaProperty
) {
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

    value[key] = parseSchemaProperty(
      key,
      appendPathKey(path, key),
      value[key],
      valueSchema,
      context,
      parseProperty
    );
  }

  return value;
}
