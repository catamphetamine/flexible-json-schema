export default function parseObjectProperties(
  key,
  path,
  value,
  schema,
  context,
  parseProperty
) {
  // Nested object schema.
  for (const key in value) {
    if (schema[key]) {
      value[key] = parseSchemaProperty(
        key,
        appendPathKey(path, key),
        value[key],
        schema[key],
        context,
        parseProperty
      );
    } else {
      throw context.createParseError({
        message: `Unknown property "${key}"`,
        type: 'unknown',
        path: appendPathKey(path, key),
        value: value[key]
      });
    }
  }
  return value;
}
