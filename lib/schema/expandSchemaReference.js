import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import appendPathKey from '../appendPathKey.js';
import applySchemaExtension from './applySchemaExtension.js';

// Expands `schema?: string` or `extends?: string` properties (named schema references).
export default function expandSchemaReference(schemaEntry, { path, context }) {
  // Expand `extends?: string` schema reference.
  if (typeof schemaEntry.extends === 'string') {
    if (!(typeof schemaEntry.description === 'string')) {
      // It has been decided that not requiring a `description`
      // when extending a schema is more convenient for the user.
      // throw new SchemaError(`"description" is missing`, {
      //   path
      // });
      // Add a "stub" `description`.
      schemaEntry = {
        ...schemaEntry,
        description: `Extends "${schemaEntry.extends}"`
      };
    }

    // Validate `extends` keyword usage.
    if (
      typeof schemaEntry.schema === 'string' ||
      (isObject(schemaEntry.schema) && !(typeof schemaEntry.schema.description === 'string'))
    ) {
      // Is allowed usage of `extends`:
      // {
      //   schema: 'a',
      //   extends: 'b'
      // }
      // or
      // {
      //   schema: {
      //     a: {
      //       type: 'string',
      //       description: 'string'
      //     }
      //   },
      //   extends: 'b'
      // }
    } else {
      throw new SchemaError(`\`extends\` can only be used along with a \`schema\` object or a \`schema\` reference`, {
        path
      });
    }

    // Expand `extends: string` into:
    // `extends: { description: string, schema: object }`.
    const extendsSchemaEntry = expandSchemaReference({
      description: schemaEntry.extends,
      schema: schemaEntry.extends
    }, {
      path: appendPathKey(path, 'extends'),
      context
    });

    // Validate `extends` usage.
    if (!isObject(extendsSchemaEntry.schema)) {
      throw new SchemaError(`\`extends\` can only reference a schema of an object, not a schema of a value: ${extendsSchemaEntry.schema}`, {
        path: appendPathKey(path, 'extends.schema')
      });
    }

    // Replace `extends: string` with:
    // `extends: { description: string, schema: object }`.
    //
    // // Also add `$$extendsSchemaRefs` property.
    //
    schemaEntry = {
      ...schemaEntry,
      extends: extendsSchemaEntry
      // $$extendsSchemaRefs: [
      //   ...(schemaEntry.$$extendsSchemaRefs || []),
      //   schemaEntry.extends
      // ]
    };
  }

  // Expand `schema?: string` schema reference.
  if (typeof schemaEntry.schema === 'string') {
    const { schema: schemaName, ...rest } = schemaEntry;

    // Get `schema` by name.
    let schema = context.schemas && context.schemas[schemaName];
    if (!schema) {
      throw new SchemaError(`Unknown schema reference: ${schemaEntry.schema}`, {
        path: appendPathKey(path, 'schema')
      });
    }

    // It has been decided that not requiring a `description`
    // when extending a schema is more convenient for the user.
    // Add a default `description`.
    if (typeof schema.extends === 'string') {
      if (!(typeof schema.description === 'string')) {
        schema = {
          ...schema,
          description: schemaName
        };
      }
    }

    // If `schema.description` property is present, then `schema` could be:
    //
    // * `{ type: '...', description: '...' }` or similar (`oneOf`, `arrayOf`, etc),
    //   in which case calling `expandSchemaReference()` won't have any effect.
    //
    // * `{ schema: '...', description: '...' }`, in which case calling
    //   `expandSchemaReference()` recursively should be done to expand any potential nested schemas.
    //
    if (typeof schema.description === 'string') {
      schema = expandSchemaReference(schema, { path, context });
      schema = applySchemaExtension(schema, { path, context });
      schemaEntry = {
        ...schema,
        // `rest` is supposed to contain a `description`.
        ...rest
      }
    } else {
      // Otherwise, if `schema` is not an object with a string
      // `description` property then it's an "inline" object schema:
      // `{ property1: { ... }, property2: { ... }, ... }`.
      //
      schemaEntry = {
        // `rest` is supposed to contain a `description`.
        ...rest,
        schema
      };
    }
  }

  // Proceed recursively for any sub-objects of `schemaEntry`.
  for (const key of Object.keys(schemaEntry)) {
    if (isObject(schemaEntry[key])) {
      schemaEntry[key] = expandSchemaReference(schemaEntry[key], {
        path: appendPathKey(path, key),
        context
      });
    }
  }

  return schemaEntry;
}
