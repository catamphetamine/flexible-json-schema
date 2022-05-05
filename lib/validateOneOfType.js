import SchemaError from './SchemaError.js';

export default function validateOneOfType(oneOfType, { path }) {
  if (!Array.isArray(oneOfType)) {
    throw new SchemaError('`oneOfType` must be an array', { path });
  }
}
