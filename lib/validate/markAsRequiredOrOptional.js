import isObject from '../isObject.js';
import dynamicTypeWhen from '../dynamicTypeWhen.js';
import appendPathKey from '../appendPathKey.js';

export default function markAsRequiredOrOptional(propertyYupSchema, required, { schemaPath }) {
  if (isObject(required)) {
    if (!isObject(required.when)) {
      throw new SchemaError('Conditional "required" must be an object having a "when" sub-object', {
        path: appendPathKey(schemaPath, 'required')
      });
    }
    return dynamicTypeWhen(required.when, {
      onTrue: () => markAsRequired(propertyYupSchema),
      onFalse: () => markAsOptional(propertyYupSchema)
    });
  }

  if (required === false) {
    return markAsOptional(propertyYupSchema);
  } else {
    return markAsRequired(propertyYupSchema);
  }
}

export function markAsRequired(propertyYupSchema) {
  // "Mark the schema as required, which will not allow `undefined`
  //  or `null` as a value."
  return propertyYupSchema.required();
}

function markAsOptional(propertyYupSchema) {
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
  return propertyYupSchema.nullable();
}
