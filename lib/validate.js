import { ValidationError } from './core.js';

import isObject from './isObject.js';
import appendPathKey from './appendPathKey.js';
import normalizeSchema from './schema/normalizeSchema.js';

import SCHEMA_ENTRY_TYPES, { isInlineObjectSchema } from './schemaEntryTypes.js';

import markAsRequiredOrOptional_ from './validate/markAsRequiredOrOptional.js';

import SchemaError from './SchemaError.js';
import defaultCreateValidationError, { getValidationErrorType, getValidationErrorMessage } from './createValidationError.js';

import schemaParser from './parse.js';

// Creates a schema validation function.
export default function schemaValidation(schema, {
  schemas,
  // strict = true,
  allowEmptyStrings = false,
  allowEmptyArrays = false,
  returnAllErrors = false,
  convertDates = false,
  dateStrings = false,
  dateFormat,
  createValidationError = defaultCreateValidationError,
  // context: customContext
} = {}) {
  if (!schema) {
    throw new Error('Schema not passed');
  }

  // When `convertDates: true` option is passed,
  // there's no need to also pass `dateStrings: true` option.
  if (convertDates) {
    dateStrings = true;
  }

  const context = {
    strict: true,
    schemas,
    allowEmptyStrings,
    allowEmptyArrays,
    // customContext,
    convertDates,
    dateStrings,
    dateFormat,
    createValidationError({ message, errors, type, path, value }) {
      const detailedMessage = getValidationErrorMessage({ message, type, path, value });
      return createValidationError({
        message: detailedMessage,
        errors: errors || [message],
        type,
        path,
        value
      });
    }
  };

  const yupSchema = compileSchemaEntry(schema, {
    key: undefined,
    path: undefined,
    schemaPath: undefined,
    description: undefined,
    context
  });

  return function validate(input) {
    try {
      yupSchema.validateSync(input, {
        // https://github.com/jquense/yup
        //
        // "when true, parsing is skipped an the input is validated "as-is"".
        //
        // "Know that your input value is already parsed? You can "strictly"
        //  validate an input, and avoid the overhead of running parsing logic."
        //
        strict: true,

        // Pass `returnAllErrors: true` to return all schema errors rather than just the first one.
        abortEarly: !returnAllErrors,

        // "External values that can be provided to validations and conditionals".
        //
        // const yupSchema = object({
        //   count: number()
        //     .when('$parameter', ([parameter], yupType) =>
        //       parameter === 123 ? yupType.max(6) : yupType
        //     )
        // });
        //
        // yupSchema.validateSync(value, { context: { parameter: 123 } });
        //
        context: undefined
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        // Validation Error properties.
        // https://github.com/jquense/yup#validationerrorerrors-string--arraystring-value-any-path-string
        //
        // yup@0.32.x
        // https://codesandbox.io/s/yup-forked-bsd8g
        //
        // yup@1.4.x
        // https://codesandbox.io/p/sandbox/yup-forked-bsd8g
        // (added: `params.spec`, `params.disableStackTrace`)
        //
        // * `name` — "ValidationError".
        // * `value` — The parsed object value (so far).
        // * `path` — The object property path that errored.
        // * `type` — The type of the validation error. Example: "typeError".
        // * `message` — The error message.
        // * `errors` — The list of error messages (strings).
        // * `inner` — Unlear what that is. Their website says: "in the case of aggregate errors, inner is an array of ValidationErrors throw earlier in the validation chain".
        // * `params` — Unlear what that is. Their website doesn't say anything about it.
        // * `params.type` — The supposed type of the property.
        // * `params.path` — Unlear what that is. Looks like it's the path to the property.
        // * `params.originalValue` — Property value before parsing.
        // * `params.value` — Property value after parsing.
        // * `params.disableStackTrace` — Unlear what that is. Example: false.
        // * `params.spec` — Unlear what that is. Seems to be some kind of a descripton of the property. Example:
        //
        // "spec": {
        //   "strip": false,
        //   "strict": false,
        //   "abortEarly": true,
        //   "recursive": true,
        //   "disableStackTrace": false,
        //   "nullable": false,
        //   "optional": false,
        //   "coerce": true
        // }
        //
        throw context.createValidationError({
          message: error.errors[0],
          errors: error.errors,
          type: getValidationErrorType(error.type, error.message),
          path: error.path,
          value: error.params.originalValue
        });
      } else {
        throw error;
      }
    }

    if (convertDates) {
      const parse = schemaParser(schema, {
        schemas,
        dateFormat,
        parseDatesOnly: true,
        inPlace: isObject(input) ? true : undefined,
        createParseError: context.createValidationError
      });
      input = parse(input);
    }

    return input;
  };
}

function compileSchemaEntry(schemaEntry, {
  key,
  path,
  schemaPath,
  context
}) {
  if (!isObject(schemaEntry)) {
    throw new SchemaError(`Unsupported schema entry. Must be an object:\n${JSON.stringify(schemaEntry, null, 2)}`, {
      path: schemaPath
    });
  }

  if (!path) {
    schemaEntry = normalizeSchema(schemaEntry, { context })
  }

  const validateDescription = () => {
    if (!(typeof schemaEntry.description === 'string')) {
      throw new SchemaError(`"description" is missing`, {
        path: schemaPath
      });
    }
  };

  const markAsRequiredOrOptional = (propertyYupSchema) => {
    return markAsRequiredOrOptional_(
      propertyYupSchema,
      isInlineObjectSchema(schemaEntry) ? true : schemaEntry.required,
      { schemaPath, context }
    );
  }

  for (const schemaEntryType of SCHEMA_ENTRY_TYPES) {
    if (schemaEntryType.test(schemaEntry)) {
      if (schemaEntryType.name !== 'inline-object-schema') {
        validateDescription();
      }
      return schemaEntryType.validate({
        key,
        path,
        schemaPath,
        schemaEntry,
        context,
        markAsRequiredOrOptional,
        compileSchemaEntry
      })
    }
  }

  throw new SchemaError(`Unsupported schema entry:\n${JSON.stringify(schemaEntry, null, 2)}`, {
    path: schemaPath
  });
}
