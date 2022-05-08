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
}
