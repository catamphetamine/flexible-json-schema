import TYPES, {
  defaultStringType,
  nonEmptyStringType,
  // defaultDateType,
  getDateStringTypeForFormat,
  isDateType
} from './types/index.js';

import { mixed } from '../core.js';

import SchemaError from '../SchemaError.js';

export default function defineTypedProperty({
  key,
  schemaPath,
  schemaEntry,
  context,
  markAsRequiredOrOptional
}) {
  const { type } = schemaEntry;

  if (type === null) {
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
      mixed().oneOf([null], 'must be null')
    );
  }

  const typeDefinitions = context.customTypes ? { ...TYPES, ...context.customTypes } : TYPES;

  let typeDefinition = typeDefinitions[type];

  if (!typeDefinition) {
    throw new SchemaError(`Unsupported schema property type: "${type}"`, {
      path: schemaPath
    });
  }

  // If the type is declared using a function approach,
  // then call that function.
  if (typeof typeDefinition === 'function') {
    return typeDefinition(markAsRequiredOrOptional, {
      // context: context.customContext,
      schemaEntry
    });
  }

  // Optionally allow empty strings.
  if (typeDefinition === defaultStringType) {
    if (!context.allowEmptyStrings) {
      typeDefinition = nonEmptyStringType;
    }
  }
  // Optionally allow dates to be stringified in a specific format.
  else if (isDateType(type, { context, schemaPath })) {
    if (context.dateStrings) {
      typeDefinition = getDateStringTypeForFormat(context.dateFormat);
    }
  }

  return markAsRequiredOrOptional(typeDefinition);
}
