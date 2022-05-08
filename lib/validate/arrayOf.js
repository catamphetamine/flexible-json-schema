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
  if (!context.allowEmptyArrays) {
    property = property.min(1);
  }
  return markAsRequiredOrOptional(property);
}
