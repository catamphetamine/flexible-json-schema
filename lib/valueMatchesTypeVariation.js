import isOfNativeType from './isOfNativeType.js';
import testWhen from './testWhen.js';
import appendPathKey from './appendPathKey.js';

export default function valueMatchesTypeVariation(value, typeVariation, { schemaPath, context }) {
  const { is, when } = typeVariation
  if (isOfNativeType(value, is, {
    schemaPath: appendPathKey(schemaPath, 'is'),
    context
  })) {
    if (is === 'object' && when) {
      return testWhen(when, value, { schemaPath, context });
    }
    if (is === 'object[]' && when) {
      return testWhen(when, value[0], { schemaPath, context });
    }
    return true;
  }
}
