import { ValidationError } from './core.js';

import isObject from './isObject.js';
import expandSchemaReference from './expandSchemaReference.js';

import defineOneOfProperty from './validate/oneOf.js';
import defineArrayOfProperty from './validate/arrayOf.js';
import defineObjectOfProperty from './validate/objectOf.js';
import defineOneOfTypeProperty from './validate/oneOfType.js';
import defineObjectProperty from './validate/object.js';
import defineTypedProperty from './validate/type.js';

import markAsRequiredOrOptional_, { markAsRequired } from './validate/markAsRequiredOrOptional.js';

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
        // Validation Error properties:
        // https://codesandbox.io/s/yup-forked-bsd8g
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
  description: fallbackDescription,
  context
}) {
  // Expand `schema?: string` property (named schema reference).
  schemaEntry = expandSchemaReference(schemaEntry, { path, context })

  const {
    required,
    oneOf,
    arrayOf,
    objectOf,
    oneOfType,
    nonEmpty,
    type,
    schema,
    description = fallbackDescription
  } = schemaEntry;

  const validateDescription = () => {
    if (!description) {
      throw new SchemaError(`"description" is missing in schema entry for key "${key}":\n${JSON.stringify(schemaEntry, null, 2)}`, {
        path
      });
    }
  };

  const markAsRequiredOrOptional = (property) => {
    return markAsRequiredOrOptional_(property, required, { path });
  }

  if (oneOf) {
    validateDescription();
    return defineOneOfProperty(oneOf, {
      path,
      markAsRequiredOrOptional
    });
  }

  if (arrayOf) {
    validateDescription();
    return defineArrayOfProperty(arrayOf, {
      key,
      path,
      schemaEntry,
      context,
      markAsRequiredOrOptional,
      compileSchemaEntry
    });
  }

  if (objectOf) {
    validateDescription();
    return defineObjectOfProperty(objectOf, {
      key,
      path,
      schemaEntry,
      context,
      markAsRequiredOrOptional,
      compileSchemaEntry
    });
  }

  if (oneOfType) {
    validateDescription();
    return defineOneOfTypeProperty(oneOfType, {
      key,
      path,
      description,
      required,
      context,
      markAsRequiredOrOptional,
      compileSchemaEntry
    });
  }

  if (typeof type === 'string') {
    validateDescription();
    return defineTypedProperty(type, {
      key,
      path,
      schemaEntry,
      context,
      markAsRequiredOrOptional
    });
  }

  if (isObject(schema)) {
    validateDescription();
    return defineObjectProperty(schema, {
      key,
      path,
      context,
      markAsRequiredOrOptional,
      compileSchemaEntry
    })
  }

  // "Inline" object schema definition.
  // Doesn't have a `description` property.
  // Is `required`.
  return defineObjectProperty(schemaEntry, {
    key,
    path,
    context,
    markAsRequiredOrOptional: markAsRequired,
    compileSchemaEntry
  })

  // throw new SchemaError(`Unsupported schema ${key ? '"' + key + '" entry' : ''} type:\n${JSON.stringify(schemaEntry, null, 2)}`, {
  //   path
  // });
}
