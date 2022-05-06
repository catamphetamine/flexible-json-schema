import {
  Schema
} from './schema.d';

import {
  DateFormat
} from './index.d';

export type Structure = 'flat';

export type ParseErrorType =
  'ambiguous' |
  'unsupported' |
  'invalid' |
  'unknown';

export interface SchemaParseError {
  message: string;
  errors: string[];
  type?: ParseErrorType;
  path?: string;
  value: any;
}

interface CreateParseErrorArgs {
  message: string;
  errors: string[];
  type?: ParseErrorType;
  path?: string;
  value: any;
}

export type CreateParseError = (CreateParseErrorArgs) => SchemaParseError;

interface ParsePropertyValueArgs {
  path: string;
  type: string;
  value: string;
};

type ParsePropertyValue = (ParsePropertyValueArgs) => any;

interface ParsePropertyArgs {
  path: string;
  type: string;
  value: string;
  parsePropertyValue: ParsePropertyValue;
  createParseError: CreateParseError;
  // context?: object;
}

export type ParseProperty = (ParsePropertyArgs) => any;

type Schemas = {
  [name: string]: Schema;
}

export interface SchemaParseOptions {
  schemas: Schemas;
  inPlace?: boolean;
  dateFormat?: DateFormat;
  parseDatesOnly?: boolean;
  structure?: Structure;
  parseProperty?: ParseProperty;
  createParseError?: CreateParseError;
  // context?: object;
}

export type ParseFunction = (data: object) => object;

declare function schemaParser(
  schema: Schema,
  options?: SchemaParseOptions
): ParseFunction;

export default schemaParser;
