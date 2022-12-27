import SchemaError from '../SchemaError.js';
import isObject from '../isObject.js';
import appendPathKey from '../appendPathKey.js';
import applySchemaExtension from './applySchemaExtension.js';

// Expands `schema?: string` or `extends?: string` properties (named schema references).
export default function expandSchemaReference(schemaEntry, { path, context }) {
  // Expand `extends?: string` schema reference.
  if (typeof schemaEntry.extends === 'string') {
    if (!(typeof schemaEntry.description === 'string')) {
      throw new SchemaError(`"description" is missing`, {
        path
      });
    }
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

    const extendsSchemaEntry = expandSchemaReference({
      description: schemaEntry.extends,
      schema: schemaEntry.extends
    }, {
      path: appendPathKey(path, 'extends'),
      context
    });
    if (!isObject(extendsSchemaEntry.schema)) {
      throw new SchemaError(`\`extends\` can only reference a schema of an object, not a schema of a value`, {
        path
      });
    }
    schemaEntry = {
      ...schemaEntry,
      extends: extendsSchemaEntry
    };
  }

  // Expand `schema?: string` schema reference.
  if (typeof schemaEntry.schema === 'string') {
    const { schema: schemaName, ...rest } = schemaEntry;
    let schema = context.schemas && context.schemas[schemaName];
    if (!schema) {
      throw new SchemaError(`Unknown schema reference: ${schemaEntry.schema}`, {
        path
      });
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
