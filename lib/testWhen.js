import { testValue } from './dynamicTypeWhen.js'

export default function testWhen(when, value, { schemaPath, context }) {
  for (const propertyName of Object.keys(when)) {
    const propertyValue = value[propertyName];
    const expectedValue = when[propertyName];
    if (!testValue(propertyValue, expectedValue, { schemaPath, context })) {
      return false;
    }
  }
  return true;
}
