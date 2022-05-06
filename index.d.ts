import {
  Schema
} from './schema.d';

export type DateFormat = 'yyyy-mm-dd';

// What's returned from `yup` type constructors:
// * `number()`
// * `string().when()`
// * `lazy()`
// * etc
type YupType = any;

interface TypeConstructorParameters {
  schemaEntry: PropertyDescriptor<Schema>;
}

// Simply adds `.required()` or `.nullable()`.
type FromYupType = (yupType: YupType) => YupType;

type TypeConstructor = (fromYupType: FromYupType, parameters: TypeConstructorParameters) => YupType;

export type TypeDefinition = YupType | TypeConstructor;

export type Types = {
  [name: string]: TypeDefinition;
}

export function useCustomTypes(types: Types): void;

export interface SchemaError {
  message: string;
  path: string;
}

export type ValidationErrorType =
  'required' |
  'unknown' |
  'ambiguous' |
  'unsupported';

export interface SchemaValidationError {
  message: string;
  errors?: string[];
  type?: ValidationErrorType;
  path?: string;
  value: any;
}

interface CreateValidationErrorArgs {
  message: string;
  errors: string[];
  type?: ValidationErrorType;
  path?: string;
  value: any;
}

export type CreateValidationError = (CreateValidationErrorArgs) => SchemaValidationError;

type Schemas = {
  [name: string]: Schema;
}

export interface SchemaValidationOptions {
  schemas: Schemas;
  allowEmptyStrings?: boolean;
  allowEmptyArrays?: boolean;
  returnAllErrors?: boolean;
  convertDates?: boolean;
  dateStrings?: boolean;
  dateFormat?: DateFormat;
  createValidationError?: CreateValidationError;
  // context?: object;
}

export type ValidationFunction = (data: object) => object;

declare function schemaValidation(
  schema: Schema,
  options?: SchemaValidationOptions
): ValidationFunction;

export default schemaValidation;
