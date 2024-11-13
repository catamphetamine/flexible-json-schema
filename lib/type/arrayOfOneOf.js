import { array, string, number, boolean, date } from '../core.js';

import { getYupTypeFromValues } from './oneOf.js';

export default function arrayOfOneOf(arg1, arg2, arg3) {
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
    yupType = getYupTypeFromValues(values);
  }

  let arrayType = array().of(yupType.oneOf(values));

  if (options && (options.nonEmpty === true || options.allowEmpty === false)) {
    // Can not be an empty array.
    arrayType = arrayType.min(1);
  } else if (options && (options.nonEmpty === false || options.allowEmpty === true)) {
    // Can be an empty array.
  } else {
    // Default behavior:
    // Could align with the global setting if `context` was available.
    // if (!context.allowEmptyArrays) {
    //   arrayType = arrayType.min(1);
    // }
  }

  return arrayType;
}
