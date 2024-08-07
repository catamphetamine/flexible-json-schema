type Type_ =
  'string' |
  'number' |
  'integer' |
  'positiveNumber' |
  'positiveInteger' |
  'nonNegativeNumber' |
  'nonNegativeInteger' |
  'boolean' |
  'date' |
  'email' |
  'url' |
  'relativeUrl' |
  'any';

// Developers can define their own "custom" types
// so the list of property types is not enumerated here.
type CustomType = string;

type Type = Type_ | null | CustomType;

type WhenRules = {
  $exists: string;
}

type WhenValue = string | number | boolean | WhenRules;

type When = {
  [property: string]: WhenValue;
}

type ConditionalRequired = {
  when: When;
}

type Required = boolean | ConditionalRequired;

type Nullable = boolean;

type Value = {
  type: Type;
  description: string;
  required?: Required;
  nullable?: Nullable;
}

type ValueWithSchemaReference = {
  schema: string;
  description: string;
  required?: Required;
}

type Of<Schema> = Type | (Schema & {
  // `description` is optional for `arrayOf` / `objectOf` type definitions:
  // if not present, it's inherited from the `arrayOf` / `objectOf` `description`.
  description?: string;
})

type ArrayOf<Schema> = {
  arrayOf: Of<Schema>;
  description: string;
  required?: Required;
}

type ObjectOf<Schema> = {
  objectOf: Of<Schema>;
  description: string;
  required?: Required;
}

type OneOfTypeIsNonObject =
  'string' |
  'number' |
  'boolean' |
  'date' |
  'string[]' |
  'number[]' |
  'boolean[]' |
  'date[]' |
  'any[]';

type OneOfTypeIsObject =
  'object' |
  'object[]';

type OneOfTypeNonObject = {
  is: OneOfTypeIsNonObject;
}

type OneOfTypeObject = {
  is: OneOfTypeIsObject;
  when?: When;
}

type OneOfTypeVariation<Schema> = (OneOfTypeNonObject | OneOfTypeObject) & Schema & {
  // `description` is optional for `oneOfType` type variations:
  // if not present, it's inherited from the `oneOfType` `description`.
  description?: string;
}

type OneOfType<Schema> = {
  oneOfType: OneOfTypeVariation<Schema>[];
  description: string;
  required?: Required;
}

// `oneOf` only supports "basic" values (no arrays, no objects, etc).
type OneOfValueType = string | number | boolean;

type OneOf = {
  oneOf: OneOfValueType[];
  description: string;
  required?: Required;
}

type Object<Schema> = {
  schema: string | Schema;
  description: string;
  required?: Required;
}

type ObjectShape<Schema> = {
  [property: string]: Schema;
}

export type Schema =
  Value |
  ValueWithSchemaReference |
  ArrayOf<Schema> |
  ObjectOf<Schema> |
  OneOfType<Schema> |
  OneOf |
  Object<Schema> |
  ObjectShape<Schema>;
