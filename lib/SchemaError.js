/**
 * This error indicates that the schema definition isn't valid.
 */
export default class SchemaError extends Error {
  constructor(message, { path }) {
    super(`Schema Error.${path ? ' Path: "' + path + '".' : ' Root Level.'} ${message}`);
    this.path = path;
  }
}
