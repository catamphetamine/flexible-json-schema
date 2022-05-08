import TYPES, {
  defaultStringType,
  nonEmptyStringType,
  defaultDateType,
  getDateStringTypeForFormat
} from './types/index.js';

import SchemaError from '../SchemaError.js';

export default function defineTypedProperty(type, {
  key,
  path,
  schemaEntry,
  context,
  markAsRequiredOrOptional
}) {
  let typeDefinition = TYPES[type];

  if (!typeDefinition) {
    throw new SchemaError(`Unsupported schema property type: "${type}"`, {
      path
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
  else if (typeDefinition === defaultDateType) {
    if (context.dateStrings) {
      typeDefinition = getDateStringTypeForFormat(context.dateFormat);
    }
  }

  return markAsRequiredOrOptional(typeDefinition);
}
