import expandSchemaReference from './expandSchemaReference.js'
import applySchemaExtension from './applySchemaExtension.js'

export default function normalizeSchema(schemaEntry, { path, context }) {
  // Expand `schema?: string` property (named schema reference).
  schemaEntry = expandSchemaReference(schemaEntry, { path, context })

  // Apply `extends?: string` property (schema reference extension).
  schemaEntry = applySchemaExtension(schemaEntry, { path, context })

  return schemaEntry
}
