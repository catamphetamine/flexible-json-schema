/**
 * Creates a schema validation error.
 * @param  {string} options.message — error message.
 * @param  {string[]} options.errors — the list of error messages.
 * @param  {string} [options.type] — The error type. Examples: `"required"` if property is required, `"unknown"` if property is unknown.
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
  return new SchemaValidationError(message, {
    type,
    path,
    value,
    errors
  });
}

export class SchemaValidationError extends Error {
  constructor(message, { errors, type, path, value }) {
    super(message);
    this.errors = errors;
    this.type = type;
    this.path = path;
    this.value = value;
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

export function getValidationErrorMessage({ message, type, path, value }) {
  // Fixes "oneOf" error message including an empty string for the `null` option.
  // `null` being present there is a workaround for stupid `yup`:
  // https://github.com/jquense/yup/issues/104
  if (message.includes('must be one of the following values: ,')) {
    message = message.replace('must be one of the following values: ,', 'must be one of the following values:');
  }
  return `Schema: Validation.${path ? ' Path: "' + path + '".' : ''} Value: ${JSON.stringify(value)}.${type ? ' Error Type: ' + type + '.' : ''} ${message}`;
}
