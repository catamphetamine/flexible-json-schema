import { lazy, mixed } from '../core.js';
import validateOneOfType from '../validateOneOfType.js';
import testWhen from '../testWhen.js';
import isObject from '../isObject.js';
import SchemaError from '../SchemaError.js';

export default function defineOneOfTypeProperty(oneOfType, {
  key,
  path,
  description,
  required,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  validateOneOfType(oneOfType, { path });

  return lazy((value) => {
    if (value === undefined || value === null) {
      // `mixed().oneOf([])`:
      // * Won't allow anything besides `undefined` or `null`.
      // * Will support `undefined` and `null` if `required: false` is applied to it.
      // * Won't support `undefined` or `null` if `required: true` is applied to it.
      return markAsRequiredOrOptional(mixed().oneOf([]));
    }

    // Find matching types.
    const typeVariations = oneOfType.filter((typeVariation) => {
      const { is, when } = typeVariation
      if (isOfNativeType(value, is, { path, context })) {
        if (is === 'object' && when) {
          return testWhen(when, value);
        }
        if (is === 'object[]' && when) {
          return testWhen(when, value[0]);
        }
        return true;
      }
    })

    if (typeVariations.length > 1) {
      throw context.createValidationError({
        message: 'Value matches multiple `oneOfType` types',
        type: 'ambiguous',
        path,
        value
      });
    }

    if (typeVariations.length === 0) {
      // None of the possible types matched.
      throw context.createValidationError({
        message: 'Value doesn\'t match any of the possible types',
        type: 'unsupported',
        path,
        value
      });
    }

    const { is, when, ...typeDefinition } = typeVariations[0];

    return compileSchemaEntry(
      { ...typeDefinition, required },
      { key, path, description, context }
    );
  })
}

function isOfNativeType(value, nativeType, { path, context }) {
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
      if (!isOfNativeType(element, nativeType, { path: `${path}[${i}]`, context })) {
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
      throw new SchemaError(`Unknown native type: "${nativeType}"`, { path });
  }
}
