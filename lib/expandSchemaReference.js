import SchemaError from './SchemaError.js';

// Expands `schema?: string` property (named schema reference).
export default function expandSchemaReference(schemaEntry, { path, context }) {
  if (typeof schemaEntry.schema === 'string') {
    const schema = context.schemas && context.schemas[schemaEntry.schema];
    if (!schema) {
      throw new SchemaError(`Unknown schema reference: ${schemaEntry.schema}`, {
        path
      });
    }
    if (typeof schema.description === 'string') {
      return {
        ...schema,
        ...schemaEntry,
        schema: schema.schema
      }
    } else {
      return {
        ...schemaEntry,
        schema
      };
    }
  }
  return schemaEntry;
}
