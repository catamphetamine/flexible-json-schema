import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import walkSchemaTree from './walkSchemaTree.js';
import normalizeNestedSchemaDefinition from './normalizeNestedSchemaDefinition.js';

// Allowed usage of `extends` object:
//
// {
//   description: 'Dog extends Animal',
//   extends: {
//     sex: { ... },
//     age: { ... },
//     color: { ... }
//   },
//   schema: {
//     breed: { ... }
//   }
// }
//
export default function applySchemaExtension(schemaEntry, { path, context }) {
  const processChildrenRecursively = () => {
    // Proceed recursively for any sub-objects of `schemaEntry`.
    return walkSchemaTree(schemaEntry, {
      path,
      transformObject(object, { path }) {
        return applySchemaExtension(object, {
          path,
          context
        });
      }
    });
  };

  // If `extends` keyword is used.
  if (typeof schemaEntry.description === 'string' && schemaEntry.extends) {
    // Validate that `extends` is an object.
    // Schema reference strings have already been expanded in `expandSchemaReference()`.
    if (!isObject(schemaEntry.extends)) {
      throw new SchemaError(`Invalid \`extends\` usage: \`extends\` should be either a schema reference string or a schema object`, {
        path
      });
    }

    // Validate that `schema` is an object.
    // Schema reference strings have already been expanded in `expandSchemaReference()`.
    if (!isObject(schemaEntry.schema)) {
      throw new SchemaError(`Invalid \`extends\` usage: \`extends\` can only be used alongside a \`schema\``, {
        path
      });
    }

    // Both `extends` and `schema` could be:
    // * "Inline" schema definitions — `{ a: { description: ... }, b: ... }`.
    // * Nested schema definitions — `{ schema: { description: ..., schema: ... } }`.
    // * Nested schema definitions with `extends` — `{ schema: { description: ..., extends: ..., schema: ... } }`.
    //
    // Therefore, children should be processed first to handle the third case.
    //
    schemaEntry = processChildrenRecursively();

    let { schema, extends: extendsSchema, ...rest } = schemaEntry;

    // If there're any nested schema definitions as a result of applying `extends`,
    // those nested schema definition structures should be simplified in order to
    // apply `extends` at this level correctly.
    schema = normalizeNestedSchemaDefinition(schema);
    extendsSchema = normalizeNestedSchemaDefinition(extendsSchema);

    // Validate `schema` top-level structure.
    if (typeof schema.description === 'string') {
      if (!isObject(schema.schema)) {
        throw new SchemaError(`Invalid \`extends\` usage: Expected \`schema\` definition to describe an object, not a primitive`, {
          path
        });
      }
    }

    // Validate `extends` top-level structure.
    if (typeof extendsSchema.description === 'string') {
      if (!isObject(extendsSchema.schema)) {
        throw new SchemaError(`Invalid \`extends\` usage: Can only \`extend\` objects, not primitives`, {
          path
        });
      }
    }

    // Merge `schema` with `extends` based on the two possible types of schema
    // definition structures, which produces four possible combinations (cases).
    if (typeof schema.description === 'string') {
      if (typeof extendsSchema.description === 'string') {
        schema.schema = {
          ...extendsSchema.schema,
          ...schema.schema
        };
      } else {
        schema.schema = {
          ...extendsSchema,
          ...schema.schema
        };
      }
    } else {
      if (typeof extendsSchema.description === 'string') {
        schema = {
          ...extendsSchema.schema,
          ...schema
        };
      } else {
        schema = {
          ...extendsSchema,
          ...schema
        };
      }
    }

    // Since children have already been processed, don't recurse into them.
    return { schema, ...rest };
  }

  // Proceed recursively for any sub-objects of `schemaEntry`.
  return processChildrenRecursively();
}
