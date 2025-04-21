import { lazy, mixed, object, ValidationError } from '../core.js';
import appendPathKey from '../appendPathKey.js';
import SchemaError from '../SchemaError.js';
import defineTypedProperty from './type.js';
import { getTypeDefinition } from './types/index.js';

export default function defineObjectOfProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  const { objectOf, keyOneOf, keyType } = schemaEntry;

  // There seem to be other workarounds for "objectOf".
  // https://github.com/jquense/yup/issues/524
  //
  // They say `lazy()` property declarations could be slow on large datasets.
  //
  return lazy((value) => {
    const isAbsent = value === undefined || value === null;

    // Validate `keyType`.
    if (!isAbsent) {
      if (keyType) {
        const keyTypeDefinition = getTypeDefinition(keyType, { context });

        if (!keyTypeDefinition) {
          throw new SchemaError(`Unsupported schema property type: "${keyType}"`, {
            path: schemaPath
          });
        }

        try {
          object().validateSync(value);
          for (const key of Object.keys(value)) {
            keyTypeDefinition.validateSync(key);
          }
        } catch (error) {
          if (error instanceof ValidationError) {
            throw context.createValidationError({
              message: `Unknown property "${key}"`,
              errors: error.errors,
              type: 'unknown',
              path: appendPathKey(path, key),
              value: value[key]
            });
          } else {
            throw error;
          }
        }
      }
    }

    const type = isAbsent
      // `mixed().oneOf([null])`:
      // * Won't allow anything besides `undefined` or `null`.
      // * Will support `undefined` or `null`, and applying `required: false` to it won't change its behavior.
      // * Won't support `undefined` or `null` if `required: true` is applied to it.
      ? mixed().oneOf([null])
      : object(
        Object.fromEntries(
          (keyOneOf || Object.keys(value)).map((key) => {
            return [
              key,
              typeof objectOf === 'string'
                ? defineTypedProperty({
                  key,
                  path: appendPathKey(path, key),
                  schemaPath: appendPathKey(schemaPath, 'objectOf'),
                  schemaEntry: {
                    type: objectOf,
                    description: schemaEntry.description
                  },
                  context,
                  // It will mark the property as required or optional later at the end of this function.
                  // For now, don't mark the property in any way.
                  markAsRequiredOrOptional: _ => _
                })
                : compileSchemaEntry(objectOf, {
                  key,
                  path: appendPathKey(path, key),
                  schemaPath: appendPathKey(schemaPath, 'objectOf'),
                  description: schemaEntry.description,
                  context
                })
            ];
          })
        )
      ).noUnknown();

    // `.lazy()` doesn't provide `.required()` or `.nullable()` methods.
    // Hence, types declared through `.lazy()` manage their own "required" status.
    return markAsRequiredOrOptional(type);
  });
}
