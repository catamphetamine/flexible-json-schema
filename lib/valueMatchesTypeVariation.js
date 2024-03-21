import isOfNativeType from './isOfNativeType.js';
import testWhen from './testWhen.js';
import appendPathKey from './appendPathKey.js';
import SchemaError from './SchemaError.js';

export default function valueMatchesTypeVariation(value, typeVariation, { schemaPath, context }) {
  const { is, when } = typeVariation
  if (isOfNativeType(value, is, {
    schemaPath: appendPathKey(schemaPath, 'is'),
    context
  })) {
    if (!when) {
      return true;
    }
    // When `value` is an object, it tests that object.
    if (is === 'object' && when) {
      return testWhen(when, value, { schemaPath, context });
    }
    // When `value` is an array of objects, it tests each element of the array.
    if (is === 'object[]' && when) {
      for (const element of value) {
        if (!testWhen(when, element, { schemaPath, context })) {
          return false;
        }
      }
      return true;
    }
    // `when` conditions only apply to `object` or `object[]` values.
    // For other types of values, `when` conditions are not supported.
    throw new SchemaError(`\`when\` conditions are not supported for \`is\` type: "${is}"`, {
      path: schemaPath
    });
  }
}
