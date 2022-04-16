import {
  Schema,
  DateFormat
} from './index.d';

export type Structure = 'flat';

export interface SchemaParseError {
  message: string;
  path: string;
  value: any;
}

interface CreateParseErrorArgs {
  message: string;
  path: string;
  value: any;
}

export type CreateParseError = (CreateParseErrorArgs) => SchemaParseError;

interface ParsePropertyValueArgs {
  key: string;
  path: string;
  type: string;
  value: string;
};

type ParsePropertyValue = (ParsePropertyValueArgs) => any;

interface ParsePropertyArgs {
  key: string;
  path: string;
  type: string;
  value: string;
  parsePropertyValue: ParsePropertyValue;
  createParseError: CreateParseError;
  context?: object;
}

export type ParseProperty = (ParsePropertyArgs) => any;

export interface SchemaParseOptions {
  inPlace?: boolean;
  dateFormat?: DateFormat;
  parseDatesOnly?: boolean;
  structure?: Structure;
  parseProperty?: ParseProperty;
  createParseError?: CreateParseError;
  context?: object;
}

export type ParseFunction = (data: object) => object;

declare function schemaParser(
  schema: Schema,
  options?: SchemaParseOptions
): ParseFunction;

export default schemaParser;
