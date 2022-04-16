/**
 * This error indicates that the schema definition isn't valid.
 */
export default class SchemaError extends Error {
  constructor(message, { path }) {
    super(`Schema error at "${path}": ${message}`);
    this.path = path;
  }
}
