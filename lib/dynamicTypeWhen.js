import { mixed } from './core.js';

import isObject from './isObject.js';

// Conditional `required` syntax example:
//
// oneField: {
//   type: 'number'
// },
// otherField: {
//   type: 'string',
//   required: {
//   when: {
//     oneField: {
//       $exists: true
//     }
//   }
// }
//
// Uses `yup`'s `.when()` function:
// https://github.com/jquense/yup/issues/74
// https://github.com/jquense/yup#mixedwhenkeys-string--arraystring-builder-object--value-schema-schema-schema
//
// otherField: property = property.when(
//   ['oneField'],
//   (oneField, property) => {
//     return oneField === undefined ? property : property.required();
//   }
// )
//
// `when` concept could also be used in `oneOfType` concept:
//
// conditionalField: {
//   oneOfType: [
//     {
//       when: { ... },
//       type: 'string'
//     },
//     {
//       when: { ... },
//       type: 'number'
//     }
//   ]
// }
//
export default function dynamicTypeWhen(when, { onTrue, onFalse }) {
  const propertyNames = Object.keys(when);
  return mixed().when(
    propertyNames,
    (...propertyValues) => {
      const schema_ = propertyValues.pop();
      let i = 0;
      while (i < propertyNames.length) {
        const propertyName = propertyNames[i];
        const propertyValue = propertyValues[i];
        const expectedValue = when[propertyName];
        if (!testValue(propertyValue, expectedValue)) {
          return onFalse();
        }
        i++;
      }
      return onTrue();
    }
  );
}

export function testValue(propertyValue, expectedValue) {
  if (isObject(expectedValue)) {
    const rules = expectedValue;
    for (const rule of Object.keys(rules)) {
      const ruleValue = rules[rule];
      if (rule === '$exists') {
        if (!testIfExists(propertyValue, ruleValue)) {
          return false;
        }
      } else if (rule === '$notEqual') {
        if (!(propertyValue !== ruleValue)) {
          return false;
        }
      } else if (rule === '$oneOf') {
        if (!testIfOneOf(propertyValue, ruleValue)) {
          return false;
        }
      } else {
        throw new Error(`Currently, only "$exists" "where" condition is supported. Encountered: ${rule}`);
      }
    }
  } else {
    if (!(propertyValue === expectedValue)) {
      return false;
    }
  }
  return true;
}

function testIfExists(propertyValue, expectedToExist) {
  const exists = propertyValue !== undefined && propertyValue !== null;
  if (expectedToExist === true) {
    if (exists)  {
      return true;
    }
  } else if (expectedToExist === false) {
    if (!exists)  {
      return true;
    }
  } else {
    throw new Error(`Unsupported "$exists" condition value: ${expectedToExist}`);
  }
}

function testIfOneOf(propertyValue, oneOf) {
  if (!Array.isArray(oneOf)) {
    throw new Error(`Unsupported "$oneOf" condition value: ${oneOf}`);
  }
  return oneOf.indexOf(propertyValue) >= 0
}
