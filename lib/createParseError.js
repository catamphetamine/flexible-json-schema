/**
 * Creates a with-schema parsing error.
 * @param  {string} options.message
 * @param  {string} options.path — property path inside the validated object.
 * @param  {any} [options.value] — property value.
 * @return {Error}
 */
export default function createError({ message, path, value }) {
  return new SchemaParseError(message, {
    path,
    value
  });
}

export class SchemaParseError extends Error {
  constructor(message, { path, value }) {
    super(`Schema: Parse. Path: "${path}". Value: ${JSON.stringify(value)}. ${message}`);
    this.path = path;
    this.value = value;
  }
}
