import isObject from '../isObject.js';
import dynamicTypeWhen from '../dynamicTypeWhen.js';

export default function markAsRequiredOrOptional(property, required, { path }) {
  if (isObject(required)) {
    if (!isObject(required.when)) {
      throw new SchemaError('Conditional "required" must be an object having a "when" sub-object', {
        path
      });
    }
    return dynamicTypeWhen(required.when, {
      onTrue: () => property.required(),
      onFalse: () => property
    });
  }

  if (required === false) {
    return markAsOptional(property);
  } else {
    return markAsRequired(property);
  }
}

export function markAsRequired(property) {
  // "Mark the schema as required, which will not allow `undefined`
  //  or `null` as a value."
  return property.required();
}

function markAsOptional(property) {
  // `property.nullable()` allows a property to have a `null` value
  // aside from the values it has been declared to support.
  //
  // For example, just `string()` would only accept strings or `undefined`,
  // and passing a `null` value would throw an "unsupported value" error.
  //
  // The description of the `nullable()` method from the official docs:
  //
  // "Indicates that `null` is a valid value for the schema.
  //  Without `nullable()` `null` is treated as a different type
  //  and will fail `isType()` checks."
  //
  // For example, `Sequelize` ORM ignores updates of `undefined` fields.
  // It only resets fields when their value is explicitly specified as `null`.
  // So, passing `null` values to erase some fields is a common case.
  //
  return property.nullable();
}
