import expandSchemaReference from './expandSchemaReference.js';
import applySchemaExtension from './applySchemaExtension.js';
import normalizeNestedSchemaDefinition from './normalizeNestedSchemaDefinition.js';

export default function normalizeSchema(schemaEntry, { context }) {
  // Expand `schema?: string` property (named schema reference).
  // Expand `extends?: string` property (`extends` schema reference).
  schemaEntry = expandSchemaReference(schemaEntry, { context });

  // Apply `extends?: object` property (schema extension).
  schemaEntry = applySchemaExtension(schemaEntry, { context });

  // Reduce nested structures like `schema.schema.schema` to just `schema`.
  // It can only be done after any `extends` statements have been applied.
  schemaEntry = normalizeNestedSchemaDefinition(schemaEntry);

  return schemaEntry;
}
