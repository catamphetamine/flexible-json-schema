import { object } from '../core.js';
import appendPathKey from '../appendPathKey.js';
import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import getNativeType from '../getNativeType.js';

export default function defineObjectProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry,
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

  if (!isObject(schema)) {
    throw new SchemaError(`Expected a property descriptor object, got a ${getNativeType(schema)}:\n${JSON.stringify(schema, null, 2)}`, {
      path: schemaPath
    });
  }

  // Special case (a hack): `property: {}` means "property is an object".
  // This is used when the `property` itself is validated separately
  // via its own schema. Example: `{ token: { type: 'string' }, profile: {} }`
  // where `profile` has already been validated separately.
  // Don't use this feature to bypass schema validation out of laziness.
  // This is currently also used on Authentication Events because
  // they could contain any properties.
  if (Object.keys(schema).length === 0) {
    if (!inlineObjectSchema && schemaEntry.empty) {
      // The schema represents an empty object:
      // will be validated below.
    } else {
      // The schema represents "any" object:
      // no need to validate anything, so return now.
      return markAsRequiredOrOptional(object());
    }
  }

  // Validate that `empty: true` flag could only be passed for an empty object {} schema.
  if (!inlineObjectSchema && schemaEntry.empty) {
    if (Object.keys(schema).length > 0) {
      throw new SchemaError(`Expected an empty object {} schema for an \`empty: true\` entry, got:\n${JSON.stringify(schema, null, 2)}`, {
        path: schemaPath
      });
    }
  }

  // Process nested properties recursively.
  const shape = {};
  for (const key of Object.keys(schema)) {
    shape[key] = compileSchemaEntry(schema[key], {
      key,
      path: appendPathKey(path, key),
      schemaPath: appendPathKey(schemaPath, key),
      context
    });
  }

  let property = object().shape(shape);

  if (context.strict) {
    property = property.noUnknown();
  }

  return markAsRequiredOrOptional(property);
}
