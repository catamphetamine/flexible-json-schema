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
  // For "required"-type of validation errors, `type` value was "required" in `yup@0.32.x`.
  //
  // In `yup@1.4.x`, they changed it, and `type` could be either "nullable" or "optionality"
  // for "required"-type of validation errors:
  //
  // https://github.com/jquense/yup/blob/5a22c16dbba610050e85f123d389ddacaa92a0ad/src/schema.ts#L679-L689
  // https://github.com/jquense/yup/blob/5a22c16dbba610050e85f123d389ddacaa92a0ad/src/schema.ts#L691-L701
  //
  // * `type: "nullable"` is present when:
  //   * `.nonNullable()` validation didn't pass for a `null` value of the property.
  //     * `.nonNullable()` validation is used when a `flexible-json-schema` property
  //       is marked as `required: true` (which is the default) or `nullable: false`.
  // * `type: "optionality"` is present when:
  //   * `.defined()` validation didn't pass for an `undefined` value of the property.
  //     * `.defined()` validation is used when a `flexible-json-schema` property
  //       is marked as `required: true` (which is the default).
  //
  // if (type === 'required') {
  //   return 'required';
  // }
  if (type === 'nullable' || type === 'optionality') {
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
