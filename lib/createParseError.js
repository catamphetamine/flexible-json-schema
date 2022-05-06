/**
 * Creates a with-schema parsing error.
 * @param  {string} options.message
 * @param  {string[]} options.errors — the list of error messages.
 * @param  {string} [options.type] — The error type.
 * @param  {string} options.path — property path inside the validated object.
 * @param  {any} [options.value] — property value.
 * @return {Error}
 */
export default function createParseError({ message, errors, type, path, value }) {
  return new SchemaParseError(message, {
    errors,
    type,
    path,
    value
  });
}

export class SchemaParseError extends Error {
  constructor(message, { errors, type, path, value }) {
    super(message);
    this.errors = errors;
    this.type = type;
    this.path = path;
    this.value = value;
  }
}

export function getParseErrorMessage({ message, type, path, value }) {
  return `Schema: Parse.${path ? ' Path: "' + path + '".' : ''} Value: ${JSON.stringify(value)}.${type ? ' Error Type: ' + type + '.' : ''} ${message}`;
}
