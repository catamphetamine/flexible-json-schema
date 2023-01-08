import isObject from '../isObject.js';
import appendPathKey from '../appendPathKey.js';
import appendPathIndex from '../appendPathIndex.js';

/**
 * Walks schema tree and potentially transforms any object it finds along the way.
 * @param  {object} schemaEntry
 * @param  {string} options.path
 * @param  {function} options.transformObject — Can return a transformed object. Must not mutate the original object.
 * @return {object} Potentially transformed schema entry. Doesn't mutate the original schema entry.
 */
export default function walkSchemaTree(schemaEntry, { path, transformObject }) {
  for (const key of Object.keys(schemaEntry)) {
    if (isObject(schemaEntry[key])) {
      const transformedObject = transformObject(schemaEntry[key], {
        path: appendPathKey(path, key)
      });
      if (transformedObject !== schemaEntry[key]) {
        schemaEntry = {
          ...schemaEntry,
          [key]: transformedObject
        };
      }
    }
    else if (Array.isArray(schemaEntry[key])) {
      let i = 0;
      while (i < schemaEntry[key].length) {
        const item = schemaEntry[key][i];
        if (isObject(item)) {
          const transformedItem = walkSchemaTree(item, {
            path: appendPathIndex(path, i),
            transformObject
          });
          if (transformedItem !== item) {
            schemaEntry = {
              ...schemaEntry,
              [key]: schemaEntry[key].slice()
            };
            schemaEntry[key][i] = transformedItem;
          }
        }
        i++;
      }
    }
  }
  return schemaEntry;
}
