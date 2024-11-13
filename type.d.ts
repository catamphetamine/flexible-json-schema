import {
  AnySchema,
  ArraySchema,
  StringSchema,
  NumberSchema,
  BooleanSchema,
  DateSchema
} from 'yup';

export function conditional<T extends AnySchema, Value extends any>(
  createType: (value: Value) => T
): T;

export function depends<T extends AnySchema, PropertyValues extends Array<V>, V extends any>(
  propertyNames: string[],
  baseType: T,
  createType: (propertyValues: PropertyValues, baseType: T) => T
): T;

export function filter<V, T extends AnySchema<V>>(type: T, test: (value: V) => boolean): T;

interface ArrayOfOneOfOptions {
  nonEmpty?: boolean;
  allowEmpty?: boolean;
}

// "TypeScript integration: how to use ArraySchema properly?"
// https://github.com/jquense/yup/issues/1839
export function arrayOfOneOf<
  ArrayType extends any[] | null | undefined,
  T extends AnySchema<V>,
  Values extends Array<V>,
  V extends any,
  ArraySchemaContext = unknown
>(
  type: T,
  values: Values,
  options?: ArrayOfOneOfOptions
): ArraySchema<ArrayType, ArraySchemaContext>;

interface OneOfOptions {
  required?: boolean;
}

export function oneOf(values: string[], options?: OneOfOptions): StringSchema;
export function oneOf(values: number[], options?: OneOfOptions): NumberSchema;
export function oneOf(values: boolean[], options?: OneOfOptions): BooleanSchema;
export function oneOf(values: Date[], options?: OneOfOptions): DateSchema;

export function oneOf<T extends AnySchema<V>, Values extends Array<V>, V extends any>(type: T, values: Values, options?: OneOfOptions): T;

interface RegExpOptions {
  nonEmpty?: boolean;
  allowEmpty?: boolean;
}

export function regexp(regularExpression: RegExp, options?: RegExpOptions): StringSchema;
export function regexp<T extends StringSchema>(type: T, regularExpression: RegExp, options?: RegExpOptions): T;
