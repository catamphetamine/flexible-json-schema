/**
 * This error indicates that the schema definition isn't valid.
 */
export default class SchemaError extends Error {
  constructor(message, { key, path }) {
    super(`Schema error at ${path ? '"' + path + '"' : 'key "' + key + '"'}: ${message}`);
    this.key = key;
    this.path = path;
  }
}
