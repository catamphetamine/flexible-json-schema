import { mixed } from './core.js';

import isObject from './isObject.js';
import valueMatchesTypeVariation from './valueMatchesTypeVariation.js';

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
export default function dynamicTypeWhen(when, { onTrue, onFalse }, { schemaPath, context }) {
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
    (propertyValues) => {
      for (const condition of conditionSets) {
        if (testCondition(condition, propertyNames, propertyValues, { schemaPath, context })) {
          return onTrue();
        }
      }
      return onFalse();
    }
  );
}

export function testValue(propertyValue, expectedValueCondition, { schemaPath, context }) {
  if (isObject(expectedValueCondition)) {
    const conditionKeys = expectedValueCondition;
    for (const conditionKey of Object.keys(conditionKeys)) {
      const conditionValue = conditionKeys[conditionKey];
      if (conditionKey[0] === '$') {
        switch (conditionKey) {
          case '$exists':
            if (!testIfExists(propertyValue, conditionValue)) {
              return false;
            }
            break;
          case '$notEqual':
            if (!(propertyValue !== conditionValue)) {
              return false;
            }
            break;
          case '$oneOf':
            if (!testIfOneOf(propertyValue, conditionValue)) {
              return false;
            }
            break;
          case '$notOneOf':
            if (testIfOneOf(propertyValue, conditionValue)) {
              return false;
            }
            break;
          case '$is':
            if (!valueMatchesTypeVariation(propertyValue, { is: conditionValue }, { schemaPath, context })) {
              return false;
            }
            break;
          default:
            throw new Error(`Unsupported "when" operator encountered: ${conditionKey}`);
        }
      } else {
        return isObject(propertyValue) &&
          propertyValue.hasOwnProperty(conditionKey) &&
          testValue(propertyValue[conditionKey], conditionValue, { schemaPath, context });
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

function testCondition(condition, propertyNames, propertyValues, { schemaPath, context }) {
  let i = 0;
  while (i < propertyNames.length) {
    const propertyName = propertyNames[i];
    if (condition.hasOwnProperty(propertyName)) {
      const propertyValue = propertyValues[i];
      const expectedValueCondition = condition[propertyName];
      if (!testValue(propertyValue, expectedValueCondition, { schemaPath, context })) {
        return false;
      }
    }
    i++;
  }
  return true;
}
