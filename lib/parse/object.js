import isObject from '../isObject.js';
import getNativeType from '../getNativeType.js';
import appendPathKey from '../appendPathKey.js';

export default function parseObjectProperty(
  key,
  path,
  value,
  schema,
  context,
  parseProperty,
  parseSchemaProperty,
  options
) {
  if (!(options && options.root)) {
    if (context.structure === 'flat') {
      // Example: `{ object: '{"a":"b"}' }`.
      value = JSON.parse(value);
      context = {
        ...context,
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
