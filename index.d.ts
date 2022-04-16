type PropertyType = string;

type ValuePropertyDescriptor = {
  type: PropertyType;
  description: string;
  required?: boolean;
}

type NestedObjectPropertyDescriptor<Schema> = {
  shape: Schema;
  description: string;
  required?: boolean;
}

type InlineNestedObjectPropertyDescriptor<Schema> = {
  [property: string]: Schema;
}

type PropertyDescriptor<Schema> = ValuePropertyDescriptor | NestedObjectPropertyDescriptor<Schema> | InlineNestedObjectPropertyDescriptor<Schema>;

export type Schema = {
  [property?: string]: PropertyDescriptor<Schema>;
}

type Schemas = {
  [name: string]: Schema;
}

export type DateFormat = 'yyyy-mm-dd';

export interface SchemaError {
  message: string;
  path: string;
}

export interface SchemaValidationError {
  message: string;
  errors?: string[];
  type?: string;
  path: string;
  value: any;
}

interface CreateValidationErrorArgs {
  message: string;
  errors?: string[];
  type?: string;
  path: string;
  value: any;
}

export type CreateValidationError = (CreateValidationErrorArgs) => SchemaValidationError;

export interface SchemaValidationOptions {
  schemas: Schemas;
  allowEmptyStrings?: boolean;
  allowEmptyArrays?: boolean;
  returnAllErrors?: boolean;
  convertDates?: boolean;
  dateStrings?: boolean;
  dateFormat?: DateFormat;
  createValidationError?: CreateValidationError;
  context?: object;
}

export type ValidationFunction = (data: object) => object;

declare function schemaValidation(
  schema: Schema,
  options?: SchemaValidationOptions
): ValidationFunction;

export default schemaValidation;
