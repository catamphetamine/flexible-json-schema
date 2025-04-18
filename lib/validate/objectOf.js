import { lazy, mixed, object } from '../core.js';
import appendPathKey from '../appendPathKey.js';
import defineTypedProperty from './type.js';

export default function defineObjectOfProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  const { objectOf, keyOneOf } = schemaEntry;

  // There seem to be other workarounds for "objectOf".
  // https://github.com/jquense/yup/issues/524
  //
  // They say `lazy()` property declarations could be slow on large datasets.
  //
  return lazy((value) => {
    const type = value === undefined || value === null
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
