import { array } from '../core.js';
import appendPathIndex from '../appendPathIndex.js';
import defineTypedProperty from './type.js';

export default function defineArrayOfProperty(arrayOf, {
  key,
  path,
  schemaEntry,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  let property = array().of(
    typeof arrayOf === 'string'
      ? defineTypedProperty(arrayOf, {
        key: appendPathIndex(key, undefined),
        path: appendPathIndex(path, undefined),
        schemaEntry,
        context,
        markAsRequiredOrOptional: _ => _
      })
      : compileSchemaEntry(arrayOf, {
        key: appendPathIndex(key, undefined),
        path: appendPathIndex(path, undefined),
        description: schemaEntry.description,
        context
      })
  );
  if (schemaEntry.nonEmpty) {
    // Can not be an empty array.
    property = property.min(1);
  } else if (schemaEntry.nonEmpty === false) {
    // Can be an empty array.
  } else {
    // Default behavior:
    // Aligns with the global setting.
    if (!context.allowEmptyArrays) {
      property = property.min(1);
    }
  }
  return markAsRequiredOrOptional(property);
}
