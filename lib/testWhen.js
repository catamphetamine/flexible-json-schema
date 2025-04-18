import { testValue } from './dynamicTypeWhen.js'

export default function testWhen(when, value, { schemaPath, context }) {
  for (const propertyName of Object.keys(when)) {
    // Match "$or" conditions.
    if (propertyName === '$or') {
      if (matchOr(when['$or'], value, { schemaPath, context })) {
        continue;
      } else {
        return false;
      }
    }
    // Match property value.
    const propertyValue = value[propertyName];
    const expectedValue = when[propertyName];
    if (!testValue(propertyValue, expectedValue, { schemaPath, context })) {
      return false;
    }
  }
  return true;
}

function matchOr(options, value, { schemaPath, context }) {
  for (const or of options) {
    if (testWhen(or, value, { schemaPath, context })) {
      return true;
    }
  }
  return false;
}
