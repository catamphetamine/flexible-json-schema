import expandSchemaReference from './expandSchemaReference.js'
import applySchemaExtension from './applySchemaExtension.js'

export default function normalizeSchema(schemaEntry, { context }) {
  // Expand `schema?: string` property (named schema reference).
  schemaEntry = expandSchemaReference(schemaEntry, { context })

  // Apply `extends?: string` property (schema reference extension).
  schemaEntry = applySchemaExtension(schemaEntry, { context })

  return schemaEntry
}
