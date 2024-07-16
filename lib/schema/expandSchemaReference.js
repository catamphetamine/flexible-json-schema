import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import appendPathKey from '../appendPathKey.js';
import walkSchemaTree from './walkSchemaTree.js';

// Expands `schema?: string` or `extends?: string` properties (named schema references).
export default function expandSchemaReference(schemaEntry, { path, context }) {
  // If `extends?: string` schema reference is used
  // then expand it into a schema definition object.
  //
  // Allowed usage of `extends` reference string:
  //
  // {
  //   description: 'Dog extends Animal',
  //   extends: 'Animal',
  //   schema: {
  //     breed: { ... }
  //   }
  // }
  //
  if (typeof schemaEntry.extends === 'string') {
    // Validate that `description` property is present.
    if (!(typeof schemaEntry.description === 'string')) {
      // Here, it used to throw an error if there's no `description`, but now it doesn't.
      //
      // The reason is that it has been decided that not requiring a `description`
      // when extending a `schema` reference is more convenient for the user.
      // So instead it just creates a "stub" `description` for the schema entry.
      // Why did I decide that `description` should be optional in such cases?
      // I dunno. In any case, that's the current behavior.
      //
      // throw new SchemaError(`"description" is missing`, {
      //   path
      // });
      //
      // Add a "stub" `description`.
      schemaEntry = {
        ...schemaEntry,
        description: `Extends "${schemaEntry.extends}"`
      };
    }

    // Replace `extends` reference string with a schema definition object.
    schemaEntry = {
      ...schemaEntry,
      extends: getSchemaByName(schemaEntry.extends, { path, context })
    };
  }

  // If `schema?: string` schema reference is used
  // then expand it into a schema definition object.
  if (typeof schemaEntry.schema === 'string') {
    // Replace `schema` reference string with a `schema` definition object.
    schemaEntry = {
      ...schemaEntry,
      schema: getSchemaByName(schemaEntry.schema, { path, context })
    };
  }

  // Proceed recursively for any sub-objects of `schemaEntry`.
  return walkSchemaTree(schemaEntry, {
    path,
    transformObject(object, { path }) {
      return expandSchemaReference(object, {
        path,
        context
      });
    }
  });
}

// Gets `schema` by name.
function getSchemaByName(schemaName, { path, context }) {
  const schema = context.schemas && context.schemas[schemaName];
  if (!schema) {
    throw new SchemaError(`Unknown schema reference: ${schemaName}`, {
      path: appendPathKey(path, 'schema')
    });
  }
  return schema;
}
