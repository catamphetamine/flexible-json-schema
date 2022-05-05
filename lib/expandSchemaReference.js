import SchemaError from './SchemaError.js';

export default function expandSchemaReference(schemaEntry, { path }, context) {
  if (typeof schemaEntry.schema === 'string') {
    const schema = context.schemas && context.schemas[schemaEntry.schema];
    if (!schema) {
      throw new SchemaError(`Unknown schema reference: ${schemaEntry.schema}`, {
        path
      });
    }
    schemaEntry = {
      ...schemaEntry,
      schema
    };
  }
  return schemaEntry;
}
