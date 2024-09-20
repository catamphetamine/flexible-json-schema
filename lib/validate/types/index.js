import {
  mixed,
  string,
  boolean,
  number,
  date
} from '../../core.js';

import { DATE_ISO_STRING_PATTERN, DATE_ISO_STRING_REGEXP } from '../../date/parseDateIsoString.js';
import { YEAR_MONTH_DAY_DATE_PATTERN, YEAR_MONTH_DAY_DATE_REGEXP } from '../../date/parseDateUsingFormat.js';

import { EMAIL_REGEXP } from './isValidEmail.js';
import { URL_REGEXP } from './isValidUrl.js';
import { RELATIVE_URL_REGEXP } from './isValidRelativeUrl.js';

// Because `string().required()` is called later on the `string()` type,
// empty strings won't pass because `yup` considers empty strings "missing".
// https://github.com/jquense/yup#stringrequiredmessage-string--function-schema
// So, if a `type: "string"` property is declared as `required`,
// then an empty-string value won't pass validation for that property.
export const defaultStringType = string();
export const nonEmptyStringType = string().min(1);

const defaultDateType = date();
const dateStringType = string().length(DATE_ISO_STRING_PATTERN.length).matches(DATE_ISO_STRING_REGEXP);
const dateStringTypeYearMonthDay = string().length(YEAR_MONTH_DAY_DATE_PATTERN.length).matches(YEAR_MONTH_DAY_DATE_REGEXP);

const BASE_TYPES = {
  'any': mixed(),
  'number': number(),
  'integer': number().integer(),
  'positiveNumber': number().positive(),
  'positiveInteger': number().positive().integer(),
  'nonNegativeNumber': number().min(0),
  'nonNegativeInteger': number().min(0).integer(),
  'boolean': boolean(),
  'string': defaultStringType,
  'date': defaultDateType,
  'dateString': dateStringType
};

const UTILITY_TYPES = {
  // `yup` doesn't know how to properly validate optional properties.
  // https://github.com/jquense/yup/issues/1055
  // return varchar().email();
  'email': string().matches(EMAIL_REGEXP, {
    excludeEmptyString: true
  }),
  'url': string().matches(URL_REGEXP, {
    excludeEmptyString: true
  }),
  'relativeUrl': string().matches(RELATIVE_URL_REGEXP, {
    excludeEmptyString: true
  })
};

const types = {
  ...BASE_TYPES,
  ...UTILITY_TYPES
};

export default types;

/**
 * Adds or overrides value types.
 * @param  {object} customTypes
 */
export function useCustomTypes(customTypes) {
  for (const key of Object.keys(customTypes)) {
    types[key] = customTypes[key];
  }
}

export function getDateStringTypeForFormat(format) {
  switch (format) {
    case YEAR_MONTH_DAY_DATE_PATTERN:
      return dateStringTypeYearMonthDay;
    default:
      if (format) {
        throw new Error(`Unsupported date format: ${format}`);
      }
      return dateStringType;
  }
}

/*
export function getDateStringRegExpForFormat(format) {
  switch (format) {
    case YEAR_MONTH_DAY_DATE_PATTERN:
      return YEAR_MONTH_DAY_DATE_REGEXP;
    default:
      if (format) {
        throw new Error(`Unsupported date format: ${format}`);
      }
      return DATE_ISO_STRING_REGEXP;
  }
}
*/
