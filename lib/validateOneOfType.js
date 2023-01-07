import SchemaError from './SchemaError.js';

export default function validateOneOfType(oneOfType, { schemaPath }) {
  if (!Array.isArray(oneOfType)) {
    throw new SchemaError('`oneOfType` must be an array', {
      path: schemaPath
    });
  }
}
