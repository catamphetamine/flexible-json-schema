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
  let conditionSets;
  if (when.$or) {
    conditionSets = when.$or;
  } else {
    conditionSets = [when];
  }
  const propertyNames = conditionSets.reduce((propertyNames, propertyConditions) => {
    for (const propertyName of Object.keys(propertyConditions)) {
      if (propertyNames.indexOf(propertyName) < 0) {
        propertyNames.push(propertyName);
      }
    }
    return propertyNames;
  }, []);
  return mixed().when(
    propertyNames,
    (...propertyValues) => {
      const options_ = propertyValues.pop();
      const yupSchema_ = propertyValues.pop();
      for (const condition of conditionSets) {
        if (testCondition(condition, propertyNames, propertyValues)) {
          return onTrue();
        }
      }
      return onFalse();
    }
  );
}

export function testValue(propertyValue, expectedValueCondition) {
  if (isObject(expectedValueCondition)) {
    const rules = expectedValueCondition;
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
    if (!(propertyValue === expectedValueCondition)) {
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

function testCondition(condition, propertyNames, propertyValues) {
  let i = 0;
  while (i < propertyNames.length) {
    const propertyName = propertyNames[i];
    if (condition.hasOwnProperty(propertyName)) {
      const propertyValue = propertyValues[i];
      const expectedValueCondition = condition[propertyName];
      if (!testValue(propertyValue, expectedValueCondition)) {
        return false;
      }
    }
    i++;
  }
  return true;
}
