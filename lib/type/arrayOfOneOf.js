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

  // Allow an empty array by default.
  if (options && options.notEmpty) {
    arrayType = arrayType.min(1);
  }

  return arrayType;
}
