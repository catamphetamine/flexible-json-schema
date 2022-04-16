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
//       $present: true
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
export default function conditionalRequired(required, property) {
  if (!isObject(required.when)) {
    throw new Error('Conditional "required" must be an object having a "when" sub-object');
  }
  const dependencies = Object.keys(required.when);
  return mixed().when(
    dependencies,
    (...dependencyValues) => {
      const schema_ = dependencyValues.pop();
      let i = 0;
      while (i < dependencies.length) {
        const dependencyName = dependencies[i];
        const dependencyValue = dependencyValues[i];
        const condition = required.when[dependencyName];
        if (isObject(condition)) {
          const conditions = condition;
          for (const rule of Object.keys(conditions)) {
            const condition = conditions[rule];
            if (rule === '$present') {
              if (!onPresentCondition(condition, property, dependencyValue)) {
                return property;
              }
            } else {
              throw new Error(`Currently, only "$present" "required" condition is supported. Encountered: ${rule}`);
            }
          }
        } else {
          // throw new Error(`Conditional "require" "when" conditions for "${dependencyName}" was expected to be an object describing the conditions. Encountered: ${JSON.stringify(conditions)}`);
          if (dependencyValue !== condition) {
            return property;
          }
        }
        i++;
      }
      return property.required();
    }
  );
}

function onPresentCondition(condition, property, dependencyValue) {
  const isPresent = dependencyValue !== undefined && dependencyValue !== null;
  if (condition === true) {
    if (isPresent)  {
      return true;
    }
  } else if (condition === false) {
    if (!isPresent)  {
      return true;
    }
  } else {
    throw new Error(`Unsupported "$present" condition value: ${condition}`);
  }
}
