import isObject from './isObject.js';

export default function getNativeType(value) {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (isObject(value)) {
    return 'object';
  }
  if (value instanceof Date) {
    return 'date';
  }
  return typeof value;
}
