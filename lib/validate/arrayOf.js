import { array } from '../core.js';
import appendPathIndex from '../appendPathIndex.js';
import appendPathKey from '../appendPathKey.js';
import defineTypedProperty from './type.js';

export default function defineArrayOfProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  const { arrayOf } = schemaEntry;

  let property = array().of(
    typeof arrayOf === 'string'
      ? defineTypedProperty({
        key: appendPathIndex(key, undefined),
        path: appendPathIndex(path, undefined),
        schemaPath: appendPathKey(schemaPath, 'arrayOf'),
        schemaEntry: {
          type: arrayOf,
          description: schemaEntry.description
        },
        context,
        // It will mark the property as required or optional later at the end of this function.
        // For now, don't mark the property in any way.
        markAsRequiredOrOptional: _ => _
      })
      : compileSchemaEntry(arrayOf, {
        key: appendPathIndex(key, undefined),
        path: appendPathIndex(path, undefined),
        schemaPath: appendPathKey(schemaPath, 'arrayOf'),
        description: schemaEntry.description,
        context
      })
  );

  if (schemaEntry.nonEmpty === true || schemaEntry.allowEmpty === false) {
    // Can not be an empty array.
    property = property.min(1);
  } else if (schemaEntry.nonEmpty === false || schemaEntry.allowEmpty === true) {
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
