import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import walkSchemaTree from './walkSchemaTree.js';
import normalizeNestedSchemaDefinition from './normalizeNestedSchemaDefinition.js';
import { isInlineObjectSchema } from '../schemaEntryTypes.js';

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
    if (!isObject(schemaEntry.schema) && !Array.isArray(schemaEntry.oneOfType)) {
      throw new SchemaError(`Invalid \`extends\` usage: \`extends\` can only be used alongside a \`schema\` or a \`oneOfType\``, {
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

    let {
      schema,
      extends: extendsSchema,
      oneOfType,
      ...rest
    } = schemaEntry;

    // Handle `{ extends: ..., oneOfType: [{ ... }, ...] }` case:
    // convert it to `{ oneOfType: [{ ..., extends: ... }, ... ] }`.
    if (oneOfType) {
      // Since children have already been processed, don't recurse into them.
      return {
        ...rest,
        oneOfType: oneOfType.map((variant) => {
          // Each variant should have shape: `{ description: "...", schema: ... }`.
          // If it's not then it's an "inline" schema definition, so convert it to a non-"inline" schema definition.
          if (typeof variant.description !== 'string') {
            if (isInlineObjectSchema(variant)) {
              variant = {
                description: "Inline object schema",
                schema: variant
              };
            }
          }

          // Each variant should have shape: `{ description: "...", schema: ... }`.
          if (typeof variant.description !== 'string' || !isObject(variant.schema)) {
            throw new SchemaError(`Invalid \`extends\` usage: when \`extends\` is used alongside \`oneOfType\`, each element of the \`oneOfType\` array should have a \`description\` and define a \`schema\` of an object. Got:\n${JSON.stringify(variant, null, 2)}`, {
              path
            });
          }

          // Since it will add its own `extends` property inside the variant,
          // validate that there isn't one there already.
          if (variant.extends) {
            throw new SchemaError(`Invalid \`extends\` usage: when \`extends\` is used alongside \`oneOfType\`, no element of the \`oneOfType\` array could have an \`extends\` property. Got:\n${JSON.stringify(variant, null, 2)}`, {
              path
            });
          }

          // Move the `extends` property inside the variant.
          return {
            ...variant,
            extends: extendsSchema
          };
        })
      }
    }

    // Handle `{ extends: ..., schema: ... }` case.
    // At this point, it's the only other case that is possible.

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
