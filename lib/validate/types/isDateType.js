import SchemaError from '../../SchemaError.js';
import TYPES from './index.js';

export default function isDateType(type, { context, schemaPath }) {
  // `null` is a special property.
  if (type === null) {
    return false
  }

  const typeDefinitions = context.customTypes ? { ...TYPES, ...context.customTypes } : TYPES;

  const typeDefinition = typeDefinitions[type];

  if (!typeDefinition) {
    throw new SchemaError(`Unsupported schema property type: "${type}"`, {
      path: schemaPath
    });
  }

  // `yup` seems to set a `type: "date"` property on types created via `date()`.
  return typeDefinition.type === 'date';
}
