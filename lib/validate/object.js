import { object } from '../core.js';
import appendPathKey from '../appendPathKey.js';

export default function defineObjectProperty(schemaEntry, {
  key,
  path,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  // Special case (a hack): `property: {}` means "property is an object".
  // This is used when the `property` itself is validated separately
  // via its own schema. Example: `{ token: { type: 'string' }, profile: {} }`
  // where `profile` has already been validated separately.
  // Don't use this feature to bypass schema validation out of laziness.
  // This is currently also used on Authentication Events because
  // they could contain any properties.
  if (Object.keys(schemaEntry).length === 0) {
    // Matches any object.
    return object();
  }

  // Nested object schema.
  const shape = {};
  for (const key of Object.keys(schemaEntry)) {
    shape[key] = compileSchemaEntry(schemaEntry[key], {
      key,
      path: appendPathKey(path, key),
      context
    });
  }

  let property = object().shape(shape);

  if (context.strict) {
    property = property.noUnknown();
  }

  return markAsRequiredOrOptional(property);
}
