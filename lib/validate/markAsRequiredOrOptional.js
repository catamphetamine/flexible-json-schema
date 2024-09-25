import isObject from '../isObject.js';
import dynamicTypeWhen from '../dynamicTypeWhen.js';
import appendPathKey from '../appendPathKey.js';

export default function markAsRequiredOrOptional(
  propertyYupSchema,
  required,
  nullable,
  { schemaPath, context }
) {
  // Apply `required` value.
  propertyYupSchema = markAsRequiredOrNot(propertyYupSchema, required, { schemaPath, context })

  // Apply `nullable` value, if specified.
  if (typeof nullable === 'boolean') {
    propertyYupSchema = markAsNullableOrNot(propertyYupSchema, nullable)
  }

  return propertyYupSchema
}

function markAsRequiredOrNot(
  propertyYupSchema,
  required,
  { schemaPath, context }
) {
  if (isObject(required)) {
    if (!isObject(required.when)) {
      throw new SchemaError('Conditional "required" must be an object having a "when" sub-object', {
        path: appendPathKey(schemaPath, 'required')
      });
    }
    return dynamicTypeWhen(required.when, {
      onTrue: () => markAsRequired(propertyYupSchema),
      onFalse: () => markAsNotRequired(propertyYupSchema)
    }, { schemaPath, context });
  }

  if (required === false) {
    return markAsNotRequired(propertyYupSchema);
  } else {
    return markAsRequired(propertyYupSchema);
  }
}

function markAsNullableOrNot(
  propertyYupSchema,
  nullable
) {
  if (nullable) {
    return markAsNullable(propertyYupSchema);
  } else {
    return markAsNotNullable(propertyYupSchema);
  }
}

function markAsRequired(propertyYupSchema) {
  // "Mark the schema as required, which will not allow `undefined`
  //  or `null` as a value."
  //
  // Internally, in `yup`, calling `.required()` is the same as
  // `.nonNullable().defined()`.
  //
  // https://github.com/jquense/yup/blob/5a22c16dbba610050e85f123d389ddacaa92a0ad/src/schema.ts#L717-L721
  //
  return propertyYupSchema.required();
}

function markAsNotRequired(propertyYupSchema) {
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
  // Internally, in `yup`, calling `.notRequired()` is the same as
  // `.nullable().optional()`.
  //
  // https://github.com/jquense/yup/blob/5a22c16dbba610050e85f123d389ddacaa92a0ad/src/schema.ts#L722-L724
  //
  return propertyYupSchema.notRequired();
}

// Currently unused.
function markAsCanBeUndefined(propertyYupSchema) {
  // "Mark the schema as optional, which will allow `undefined` as a value."
  return propertyYupSchema.optional();
}

// Currently unused.
function markAsCanNotBeUndefined(propertyYupSchema) {
  // "Mark the schema as defined, which will not allow `undefined` as a value."
  return propertyYupSchema.defined();
}

function markAsNullable(propertyYupSchema) {
  // "Mark the schema as nullable, which will allow `null` as a value."
  return propertyYupSchema.nullable();
}

function markAsNotNullable(propertyYupSchema) {
  // "Mark the schema as non-nullable, which will not allow `null` as a value."
  return propertyYupSchema.nonNullable();
}

