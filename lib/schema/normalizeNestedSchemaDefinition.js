import isObject from '../isObject.js';
import appendPathKey from '../appendPathKey.js';
import walkSchemaTree from './walkSchemaTree.js';

// Normalizes nested schema definition structures like:
//
// {
//   schema: {
//     description: '...',
//     schema: {
//       description: '...',
//       schema: {
//         property: { ... }
//       }
//     }
//   }
// }
//
// into simpler ones like:
//
// {
//   description: '...',
//   schema: {
//     property: { ... }
//   }
// }
//
export default function normalizeNestedSchemaDefinition(schemaEntry, { path } = {}) {
  if (isObject(schemaEntry.schema)) {
    if (typeof schemaEntry.schema.description === 'string') {
      // Merge the "rest" properties with the properties of the `schema` object.
      //
      // Example:
      // {
      //   description: '...',
      //   required: false,
      //   schema: {
      //     // This `description` property shouldn't overwrite
      //     // the `description` property at the parent level.
      //     description: '...',
      //     // This `required` property shouldn't overwrite
      //     // the `required` property at the parent level.
      //     required: undefined,
      //     ...
      //   }
      // }
      //
      const { schema, ...rest } = schemaEntry;
      schemaEntry = { ...schema, ...rest };
      // Re-run the function for the updated `schemaEntry`.
      return normalizeNestedSchemaDefinition(schemaEntry);
    }
  }

  // Proceed recursively for any sub-objects of `schemaEntry`.
  return walkSchemaTree(schemaEntry, {
    path,
    transformObject(object, { path }) {
      return normalizeNestedSchemaDefinition(object);
    }
  });
}
