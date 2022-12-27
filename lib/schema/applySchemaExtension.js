import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import appendPathKey from '../appendPathKey.js';

export default function applySchemaExtension(schemaEntry, { path, context }) {
  if (typeof schemaEntry.description === 'string') {
    if (
      isObject(schemaEntry.extends) &&
      typeof schemaEntry.extends.description === 'string' &&
      isObject(schemaEntry.extends.schema)
    ) {
      const schema = schemaEntry.schema;
      // Check that `schema` is an "inline" object schema.
      if (
        isObject(schema) &&
        !(typeof schema.description === 'string')
      ) {
        schemaEntry = {
          ...schemaEntry,
          extends: undefined,
          schema: {
            // If `schemaEntry.extends` refers to a schema that itself uses `extends`
            // then apply that "child" extension first and then return to
            // extending the "parent".
            ...applySchemaExtension(schemaEntry.extends, { path, context }).schema,
            ...applySchemaExtension(schema, { path, context })
          }
        };
      } else {
        throw new SchemaError(`\`extends\` can only be used along with a \`schema\` object or a \`schema\` reference`, {
          path
        });
      }
    }
  }

  // Proceed recursively for any sub-objects of `schemaEntry`.
  for (const key of Object.keys(schemaEntry)) {
    if (isObject(schemaEntry[key])) {
      const afterApplyingSchemaExtension = applySchemaExtension(schemaEntry[key], {
        path: appendPathKey(path, key),
        context
      });
      if (afterApplyingSchemaExtension !== schemaEntry[key]) {
        schemaEntry = {
          ...schemaEntry,
          [key]: afterApplyingSchemaExtension
        };
      }
    }
  }

  return schemaEntry;
}
