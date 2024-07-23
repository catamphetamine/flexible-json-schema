import { mixed } from '../core.js';
import validateOneOf from '../validateOneOf.js';
import appendPathKey from '../appendPathKey.js';

export default function defineOneOfProperty({
  schemaPath,
  schemaEntry,
  markAsRequiredOrOptional
}) {
  const { oneOf } = schemaEntry;

  schemaPath = appendPathKey(schemaPath, 'oneOf');

  validateOneOf(oneOf, { schemaPath });

  return markAsRequiredOrOptional(
    // `yup` doesn't even know how to handle `oneOf` `null`s properly.
    // https://github.com/jquense/yup/issues/104
    // Added `null` option to the list just so that `null` values are supported.
    //
    // It works in a weird manner: adding `null` to the list of options
    // allows `null` to pass the `.oneOf()` check specifically
    // but still requires appending `.nullable()` at the end
    // for `null` to pass the original `mixed()` type definition itself.
    //
    // So if the field is declared as `required: true` then adding `null`
    // to the list of options still won't allow `null`s or `undefined`s to pass.
    //
    mixed().oneOf([null, ...oneOf])
  );
}
