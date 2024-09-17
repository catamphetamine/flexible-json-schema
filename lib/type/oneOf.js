import { string, number, boolean, date } from '../core.js';

import getNativeType from '../getNativeType.js';

export default function oneOf(arg1, arg2, arg3) {
  let yupType;
  let values;
  let options;

  if (Array.isArray(arg2)) {
    yupType = arg1;
    values = arg2;
    options = arg3;
  } else {
    values = arg1;
    options = arg2;
  }

  if (!yupType) {
    yupType = getYupTypeFromValues(values);;
  }

  // Allow `null` value by default.
  if (!(options && options.required)) {
    values = values.concat(null);
  }

  // Create a `yup` type definition.
  return yupType.oneOf(values);
}

function getYupTypeConstructorForNativeType(nativeType) {
  switch (nativeType) {
    case 'string':
      return string;
    case 'number':
      return number;
    case 'boolean':
      return boolean;
    case 'date':
      return date;
    case 'array':
      throw new Error('Can\'t create a `oneOf` type from a list of arrays: it can only be a list of "primitive" type values');
    case 'object':
      throw new Error('Can\'t create a `oneOf` type from a list of objects: it can only be a list of "primitive" type values');
    default:
      throw new Error(`Can't create a \`oneOf\` type from a list of values of type: ${nativeType}`);
  }
}

export function getYupTypeFromValues(values) {
  // Validate that `values` doesn't include a `null`.
  if (values.indexOf(null) >= 0) {
    throw new Error(`A list of "one of" values shouldn't include \`null\` values`);
  }

  // Validate that `values` are "homogenous" in terms of their "native" type.
  const valueTypes = uniq(values.map(getNativeType));

  if (valueTypes.length > 1) {
    throw new Error(`Can't construct a "one of" type based on the provided list of values. The values have different types: ${valueTypes.join(', ')}`);
  }

  // Get `yup` type constructor for the native value type.
  const typeConstructor = getYupTypeConstructorForNativeType(valueTypes[0]);

  return typeConstructor();
}

// `uniq()` function implementation.
// https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
function isUniqueValue(value, index, array) {
  return array.indexOf(value) === index;
}
function uniq(array) {
  return array.filter(isUniqueValue);
}
