import isObject from '../isObject.js';
import getNativeType from '../getNativeType.js';
import appendPathKey from '../appendPathKey.js';

export default function parseObjectProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  value,
  context,
  parseProperty,
  parseSchemaProperty,
  rootValue,
  inlineObjectSchema
}) {
  const schema = inlineObjectSchema ? schemaEntry : schemaEntry.schema;

  if (!inlineObjectSchema) {
    schemaPath = appendPathKey(schemaPath, 'schema');
  }

  // Validate that `schema` is an "inline" object schema.
  if (!inlineObjectSchema) {
    if (typeof schema.description === 'string') {
      throw new SchemaError(`Expected \`schema\` to be an "inline" schema definition but got:\n${JSON.stringify(schema, null, 2)}`, {
        path: schemaPath
      });
    }
  }

  if (!rootValue) {
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
  }

  if (!isObject(value)) {
    throw context.createParseError({
      message: `Expected an object, got a ${getNativeType(value)}`,
      type: 'unsupported',
      path,
      value
    });
  }

  // Special case (a hack): `property: {}` means "property is an object".
  // This is used when the `property` itself is validated separately
  // via its own schema. Example: `{ token: { type: 'string' }, profile: {} }`
  // where `profile` has already been validated separately.
  // Don't use this feature to bypass schema validation out of laziness.
  if (Object.keys(schema).length === 0) {
    // Matches any object.
    // Don't parse any properties.
    return value;
  }

  // Nested object schema.
  for (const key in value) {
    if (schema[key]) {
      value[key] = parseSchemaProperty({
        key,
        path: appendPathKey(path, key),
        schemaPath: appendPathKey(schemaPath, key),
        schemaEntry: schema[key],
        value: value[key],
        context,
        parseProperty
      });
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
