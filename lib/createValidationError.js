/**
 * Creates a schema validation error.
 * @param  {string} options.message — error message.
 * @param  {string[]} options.errors — the list of error messages.
 * @param  {string} [options.type] — `"required"` if property is required, `"unknown"` if property is unknown.
 * @param  {string} options.path — property path inside the validated object.
 * @param  {any} [options.value] — property value.
 * @return {Error}
 */
export default function createValidationError({
  message,
  errors,
  type,
  path,
  value
}) {
  return new SchemaValidationError(getValidationErrorMessage(message), {
    type,
    path,
    value,
    errors
  });
}

export class SchemaValidationError extends Error {
  constructor(message, { type, path, value, errors }) {
    super(`Schema: Validation. Path: "${path}". Value: ${JSON.stringify(value)}. ${message}`);
    this.type = type;
    this.path = path;
    this.value = value;
    this.errors = errors;
  }
}

export function getValidationErrorType(type, message) {
  if (type === 'required') {
    return 'required';
  }
  if (type === 'noUnknown') {
    return 'unknown';
  }
}

function getValidationErrorMessage(message) {
  // Fixes "oneOf" error message including an empty string for the `null` option.
  // `null` being present there is a workaround for stupid `yup`:
  // https://github.com/jquense/yup/issues/104
  if (message.includes('must be one of the following values: ,')) {
    message = message.replace('must be one of the following values: ,', 'must be one of the following values:');
  }
  return message;
}
