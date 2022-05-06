import {
  lazy,
  mixed,
  array,
  object,
  ValidationError
} from './core.js';

import isObject from './isObject.js';
import validateOneOf from './validateOneOf.js';
import validateOneOfType from './validateOneOfType.js';
import appendPathIndex from './appendPathIndex.js';
import appendPathKey from './appendPathKey.js';
import expandSchemaReference from './expandSchemaReference.js';
import dynamicTypeWhen from './dynamicTypeWhen.js';
import testWhen from './testWhen.js';

import TYPES, {
  defaultStringType,
  nonEmptyStringType,
  defaultDateType,
  getDateStringTypeForFormat
} from './types.js';

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
    path: undefined
  }, context);

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
  description: parentSuppliedDescription
}, context) {
  // Expand `schema?: string` property (named schema reference).
  schemaEntry = expandSchemaReference(schemaEntry, { path }, context)

  const {
    required,
    oneOf,
    arrayOf,
    objectOf,
    oneOfType,
    nonEmpty,
    type,
    schema,
    description = parentSuppliedDescription
  } = schemaEntry;

  const validateDescription = () => {
    if (!description) {
      throw new SchemaError(`"description" is missing in schema entry for key "${key}":\n${JSON.stringify(schemaEntry, null, 2)}`, {
        path
      });
    }
  };

  const markAsRequiredOrOptional = (property) => {
    if (isObject(required)) {
      if (!isObject(required.when)) {
        throw new Error('Conditional "required" must be an object having a "when" sub-object');
      }
      return dynamicTypeWhen(required.when, {
        onTrue: () => property.required(),
        onFalse: () => property
      });
    }
    if (required === false) {
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
      return property.nullable();
    } else {
      // "Mark the schema as required, which will not allow `undefined`
      //  or `null` as a value."
      return property.required();
    }
  };

  const defineProperty = (property) => {
    if (oneOf) {
      validateDescription();
      validateOneOf(oneOf, { path });
      return markAsRequiredOrOptional(
        // `yup` doesn't even know how to handle `oneOf` `null`s properly.
        // https://github.com/jquense/yup/issues/104
        // Added `null` option to the list just so that `null` values are supported.
        //
        // It works in a weird manner: adding `null` to the list of options
        // allows `null` to pass the `.oneOf()` check specifically
        // but still requires appending `.nullable()` at the end
        // for `null` to pass the original `mixed()` type definition itself.
        //
        // So if the field is declared as `required: true` then adding `null`
        // to the list of options still won't allow `null`s or `undefined`s to pass.
        //
        mixed().oneOf([null, ...oneOf])
      );
    }

    if (arrayOf) {
      validateDescription();
      let property = array().of(
        typeof arrayOf === 'string'
          ? getPropertyType(arrayOf, {
            key: appendPathIndex(key, undefined),
            path: appendPathIndex(path, undefined),
            schemaEntry,
            markAsRequiredOrOptional: _ => _
          }, context)
          : compileSchemaEntry(arrayOf, {
            key: appendPathIndex(key, undefined),
            path: appendPathIndex(path, undefined),
            description
          }, context)
      );
      if (!context.allowEmptyArrays) {
        property = property.min(1);
      }
      return markAsRequiredOrOptional(property);
    }

    if (objectOf) {
      validateDescription();
      //
      // There seem to be other workarounds for "objectOf".
      // https://github.com/jquense/yup/issues/524
      //
      // They say `lazy()` property declarations could be slow on large datasets.
      //
      return lazy((value) => {
        const type = value === undefined || value === null
          // `mixed().oneOf([])`:
          // * Won't allow anything besides `undefined` or `null`.
          // * Will support `undefined` and `null` if `required: false` is applied to it.
          // * Won't support `undefined` or `null` if `required: true` is applied to it.
          ? mixed().oneOf([])
          : object(
            Object.fromEntries(
              Object.keys(value).map((key) => {
                return [
                  key,
                  typeof objectOf === 'string'
                    ? getPropertyType(objectOf, {
                      key,
                      path: appendPathKey(path, key),
                      schemaEntry,
                      markAsRequiredOrOptional: _ => _
                    }, context)
                    : compileSchemaEntry(objectOf, {
                      key,
                      path: appendPathKey(path, key),
                      description
                    }, context)
                ];
              })
            )
          );

        // `.lazy()` doesn't provide `.required()` or `.nullable()` methods.
        // Hence, types declared through `.lazy()` manage their own "required" status.
        return markAsRequiredOrOptional(type);
      });
    }

    if (oneOfType) {
      validateOneOfType(oneOfType, { path });

      return lazy((value) => {
        if (value === undefined || value === null) {
          // `mixed().oneOf([])`:
          // * Won't allow anything besides `undefined` or `null`.
          // * Will support `undefined` and `null` if `required: false` is applied to it.
          // * Won't support `undefined` or `null` if `required: true` is applied to it.
          return markAsRequiredOrOptional(mixed().oneOf([]));
        }

        // Find matching types.
        const typeVariations = oneOfType.filter((typeVariation) => {
          const { is, when } = typeVariation
          if (isOfNativeType(value, is, { path }, context)) {
            if (is === 'object' && when) {
              return testWhen(when, value);
            }
            if (is === 'object[]' && when) {
              return testWhen(when, value[0]);
            }
            return true;
          }
        })

        if (typeVariations.length > 1) {
          throw context.createValidationError({
            message: 'Value matches multiple `oneOfType` types',
            type: 'ambiguous',
            path,
            value
          });
        }

        if (typeVariations.length === 0) {
          // None of the possible types matched.
          throw context.createValidationError({
            message: 'Value doesn\'t match any of the possible types',
            type: 'unsupported',
            path,
            value
          });
        }

        const { is, when, ...typeDefinition } = typeVariations[0];

        return compileSchemaEntry(
          { ...typeDefinition, required },
          { key, path, description },
          context
        );
      })
    }

    if (typeof type === 'string') {
      validateDescription();
      return getPropertyType(type, {
        key,
        path,
        schemaEntry,
        markAsRequiredOrOptional
      }, context);
    }

    if (isObject(schema)) {
      return markAsRequiredOrOptional(
        defineNestedObjectSchema(schema, {
          key,
          path,
          compileSchemaEntry
        }, context)
      );
    }

    return markAsRequiredOrOptional(
      defineNestedObjectSchema(schemaEntry, {
        key,
        path,
        compileSchemaEntry
      }, context)
    );

    throw new SchemaError(`Unsupported schema ${key ? '"' + key + '" entry' : ''} type:\n${JSON.stringify(schemaEntry, null, 2)}`, {
      path
    });
  };

  return defineProperty();
}

function getPropertyType(type, {
  key,
  path,
  schemaEntry,
  markAsRequiredOrOptional
}, context) {
  let typeDefinition = TYPES[type];

  if (!typeDefinition) {
    throw new SchemaError(`Unsupported schema property type : ${type}`, {
      path
    });
  }

  // If the type is declared using a function approach,
  // then call that function.
  if (typeof typeDefinition === 'function') {
    return typeDefinition(markAsRequiredOrOptional, {
      // context: context.customContext,
      schemaEntry
    });
  }

  // Optionally allow empty strings.
  if (typeDefinition === defaultStringType) {
    if (!context.allowEmptyStrings) {
      typeDefinition = nonEmptyStringType;
    }
  }
  // Optionally allow dates to be stringified in a specific format.
  else if (typeDefinition === defaultDateType) {
    if (context.dateStrings) {
      typeDefinition = getDateStringTypeForFormat(context.dateFormat);
    }
  }

  return markAsRequiredOrOptional(typeDefinition);
}

function defineNestedObjectSchema(schemaEntry, {
  key,
  path,
  compileSchemaEntry
}, context) {
  // Special case (a hack): `property: {}` means "property is an object".
  // This is used when the `property` itself is validated separately
  // via its own schema. Example: `{ token: { type: 'string' }, profile: {} }`
  // where `profile` has already been validated separately.
  // Don't use this feature to bypass schema validation out of laziness.
  // This is currently also used on Authentication Events because
  // they could contain any properties.
  if (Object.keys(schemaEntry).length === 0) {
    // Matches any object.
    return object();
  }

  // Nested object schema.
  const shape = {};
  for (const key of Object.keys(schemaEntry)) {
    shape[key] = compileSchemaEntry(schemaEntry[key], {
      key,
      path: appendPathKey(path, key),
    }, context);
  }

  let property = object().shape(shape);

  if (context.strict) {
    property = property.noUnknown();
  }

  return property;
}

function isOfNativeType(value, nativeType, { path }, context) {
  const isArrayNativeType = nativeType.slice(-2) === '[]';
  const isArray = Array.isArray(value);

  if ((isArrayNativeType && !isArray) || (!isArrayNativeType && isArray)) {
    return false;
  }

  // Recurse into an array.
  if (isArrayNativeType) {
    if (nativeType === 'any[]') {
      return true;
    }

    // Remove the `[]` postfix.
    nativeType = nativeType.slice(0, -2);

    let i = 0;
    for (const element of value) {
      if (!isOfNativeType(element, nativeType, { path: `${path}[${i}]` }, context)) {
        return false;
      }
      i++;
    }
    return true;
  }

  switch (nativeType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return isObject(value);
    case 'date':
      if (context.dateStrings) {
        return typeof value === 'string';
      }
      return value instanceof Date;
    default:
      throw new SchemaError(`Unknown native type: "${nativeType}"`, { path });
  }
}
