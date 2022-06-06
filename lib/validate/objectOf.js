import { lazy, mixed, object } from '../core.js';
import appendPathKey from '../appendPathKey.js';
import defineTypedProperty from './type.js';

export default function defineObjectOfProperty(objectOf, {
  key,
  path,
  schemaEntry,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  //
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
          Object.keys(value).map((key) => {
            return [
              key,
              typeof objectOf === 'string'
                ? defineTypedProperty(objectOf, {
                  key,
                  path: appendPathKey(path, key),
                  schemaEntry,
                  context,
                  markAsRequiredOrOptional: _ => _
                })
                : compileSchemaEntry(objectOf, {
                  key,
                  path: appendPathKey(path, key),
                  description: schemaEntry.description,
                  context
                })
            ];
          })
        )
      );

    // `.lazy()` doesn't provide `.required()` or `.nullable()` methods.
    // Hence, types declared through `.lazy()` manage their own "required" status.
    return markAsRequiredOrOptional(type);
  });
}
