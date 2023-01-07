import isObject from './isObject.js';
import SchemaError from './SchemaError.js';
// import appendPathIndex from './appendPathIndex.js';

export default function isOfNativeType(value, nativeType, { schemaPath, context }) {
  const isArrayNativeType = nativeType.slice(-2) === '[]';
  const isArray = Array.isArray(value);

  if ((isArrayNativeType && !isArray) || (!isArrayNativeType && isArray)) {
    return false;
  }

  // Recurse into an array.
  if (isArrayNativeType) {
    if (nativeType === 'any[]') {
      return true;
    }

    // Remove the `[]` postfix.
    nativeType = nativeType.slice(0, -2);

    let i = 0;
    for (const element of value) {
      if (!isOfNativeType(element, nativeType, {
        // path: appendPathIndex(path, i),
        schemaPath,
        context
      })) {
        return false;
      }
      i++;
    }
    return true;
  }

  switch (nativeType) {
    // case 'any':
    //   return true;
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return isObject(value);
    case 'date':
      if (context.dateStrings) {
        return typeof value === 'string';
      }
      return value instanceof Date;
    default:
      throw new SchemaError(`Unknown native type: "${nativeType}"`, {
        path: schemaPath
      });
  }
}
