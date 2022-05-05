// Developers can define their own "custom" types
// so the list of property types is not enumerated here.
type PropertyType = string;

type WhenConditionRules = {
  $exists: string;
}

type WhenConditionValue = string | number | boolean | WhenConditionRules;

type WhenCondition = {
  [property: string]: WhenConditionValue;
}

type ConditionalRequired = {
  when: WhenCondition;
}

type Required = boolean | ConditionalRequired;

type ValuePropertyDescriptor = {
  type: PropertyType;
  description: string;
  required?: Required;
}

type Of<PropertyDescriptor> = PropertyType | (PropertyDescriptor & {
  // `description` is optional for `arrayOf` / `objectOf` type definitions:
  // if not present, it's inherited from the `arrayOf` / `objectOf` `description`.
  description?: string;
})

type ArrayOfPropertyDescriptor<PropertyDescriptor> = {
  arrayOf: Of<PropertyDescriptor>;
  description: string;
  required?: Required;
}

type ObjectOfPropertyDescriptor<PropertyDescriptor> = {
  objectOf: Of<PropertyDescriptor>;
  description: string;
  required?: Required;
}

type OneOfTypeNonObjectNativeType =
  'string' |
  'number' |
  'boolean' |
  'date' |
  'string[]' |
  'number[]' |
  'boolean[]' |
  'date[]';

type OneOfTypeObjectNativeType =
  'object' |
  'object[]';

type OneOfTypeNonObjectTypeVariation = {
  is: OneOfTypeNonObjectNativeType;
}

type OneOfTypeObjectTypeVariation = {
  is: OneOfTypeObjectNativeType;
  when?: WhenCondition;
}

type OneOfTypeTypeVariation<PropertyDescriptor> = (OneOfTypeNonObjectTypeVariation | OneOfTypeObjectTypeVariation) & PropertyDescriptor & {
  // `description` is optional for `oneOfType` type variations:
  // if not present, it's inherited from the `oneOfType` `description`.
  description?: string;
}

type OneOfTypePropertyDescriptor<PropertyDescriptor> = {
  oneOfType: OneOfTypeTypeVariation<PropertyDescriptor>[];
  description: string;
  required?: Required;
}

// `oneOf` only supports "basic" values (no arrays, no objects, etc).
type OneOfValueType = string | number | boolean;

type OneOfPropertyDescriptor = {
  oneOf: OneOfValueType[];
  description: string;
  required?: Required;
}

type NestedObjectPropertyDescriptor<Schema> = {
  shape: Schema;
  description: string;
  required?: Required;
}

type InlineNestedObjectPropertyDescriptor<Schema> = {
  [property: string]: Schema;
}

type PropertyDescriptor<Schema> =
  ValuePropertyDescriptor |
  ArrayOfPropertyDescriptor<PropertyDescriptor<Schema>> |
  ObjectOfPropertyDescriptor<PropertyDescriptor<Schema>> |
  OneOfTypePropertyDescriptor<PropertyDescriptor<Schema>> |
  OneOfPropertyDescriptor |
  NestedObjectPropertyDescriptor<Schema> |
  InlineNestedObjectPropertyDescriptor<Schema>;

type ObjectSchema = {
  [property?: string]: PropertyDescriptor<Schema>;
}

type ValueSchema = PropertyDescriptor;

export type Schema = ObjectSchema | ValueSchema;
