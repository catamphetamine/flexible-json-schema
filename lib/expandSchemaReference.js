import SchemaError from './SchemaError.js';

// Expands `schema?: string` property (named schema reference).
export default function expandSchemaReference(schemaEntry, { path, context }) {
  if (typeof schemaEntry.schema === 'string') {
    const { schema: schemaName, ...rest } = schemaEntry;
    const schema = context.schemas && context.schemas[schemaName];
    if (!schema) {
      throw new SchemaError(`Unknown schema reference: ${schemaEntry.schema}`, {
        path
      });
    }
    if (typeof schema.description === 'string') {
      return expandSchemaReference({
        ...schema,
        ...rest
      }, { path, context })
    } else {
      return {
        ...rest,
        schema
      };
    }
  }

  return schemaEntry;
}
