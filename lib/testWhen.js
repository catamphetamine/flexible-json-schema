import { testValue } from './dynamicTypeWhen.js'

export default function testWhen(when, value) {
  for (const propertyName of Object.keys(when)) {
    const propertyValue = value[propertyName];
    const expectedValue = when[propertyName];
    if (!testValue(propertyValue, expectedValue)) {
      return false;
    }
  }
  return true;
}
