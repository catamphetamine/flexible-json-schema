import { lazy, mixed } from '../core.js';
import validateOneOfType from '../validateOneOfType.js';
import valueMatchesTypeVariation from '../valueMatchesTypeVariation.js';
import appendPathIndex from '../appendPathIndex.js';
import appendPathKey from '../appendPathKey.js';

export default function defineOneOfTypeProperty(oneOfType, {
  key,
  path,
  schemaPath,
  required,
  context,
  markAsRequiredOrOptional,
  compileSchemaEntry
}) {
  validateOneOfType(oneOfType, { schemaPath });

  return lazy((value) => {
    if (value === undefined || value === null) {
      // `mixed().oneOf([null])`:
      // * Won't allow anything besides `undefined` or `null`.
      // * Will support `undefined` or `null`, and applying `required: false` to it won't change its behavior.
      // * Won't support `undefined` or `null` if `required: true` is applied to it.
      //
      // More details on each possible case:
      //
      // `mixed().oneOf([])`:
      // * Will allow `undefined`.
      // * Won't allow `null`.
      // * Won't allow anything else.
      //
      // `mixed().oneOf([]).nullable()`:
      // * Will allow `undefined`.
      // * Won't allow `null`.
      // * Won't allow anything else.
      //
      // `mixed().oneOf([]).required()`:
      // * Won't allow `undefined`.
      // * Won't allow `null`.
      // * Won't allow anything else.
      //
      // `mixed().oneOf([null])`:
      // * Will allow `undefined`.
      // * Will allow `null`.
      // * Won't allow anything else.
      //
      // `mixed().oneOf([null]).nullable()`:
      // * Will allow `undefined`.
      // * Will allow `null`.
      // * Won't allow anything else.
      //
      // `mixed().oneOf([null]).required()`:
      // * Won't allow `undefined`.
      // * Won't allow `null`.
      // * Won't allow anything else.
      //
      return markAsRequiredOrOptional(mixed().oneOf([null]));
    }

    const getCompiledSchemaEntry = (oneOfType, { schemaPath }) => {
      const { i, schemaEntry } = getSchemaEntry(oneOfType, {
        schemaPath,
        path,
        value,
        context,
        required
      })

      // Include a potential immediately nested `oneOfType` schema entry
      // in this `lazy()` call, because otherwise the resulting `yup()` schema wouldn't work
      // and would output a cryptic error message:
      // "this must be one of the following values: ".
      const immediatelyNestedOneOfType = schemaEntry.oneOfType || (schemaEntry.schema && schemaEntry.schema.oneOfType);
      if (immediatelyNestedOneOfType) {
        return getCompiledSchemaEntry(immediatelyNestedOneOfType, {
          schemaPath: appendPathKey(schemaPath, schemaEntry.oneOfType ? 'oneOfType' : appendPathKey('schema', 'oneOfType'))
        })
      }

      return compileSchemaEntry(schemaEntry, {
        key,
        path,
        schemaPath: appendPathIndex(schemaPath, i),
        context
      });
    };

    return getCompiledSchemaEntry(oneOfType, { schemaPath });
  })
}

function getSchemaEntry(oneOfType, {
  schemaPath,
  path,
  value,
  context,
  required
}) {
  const typeVariation = getTypeVariation(oneOfType, {
    schemaPath,
    path,
    value,
    context
  });

  const { is, when, ...typeDefinition } = typeVariation;

  return {
    i: oneOfType.indexOf(typeVariation),
    schemaEntry: {
      ...typeDefinition,
      required
    }
  };
}

function getTypeVariation(oneOfType, { schemaPath, path, value, context }) {
  // Find matching types.
  const typeVariations = oneOfType.filter((typeVariation) => {
    return valueMatchesTypeVariation(value, typeVariation, { schemaPath, context });
  });

  // If the value type is ambiguous, throw an error.
  if (typeVariations.length > 1) {
    // There's one edge case where the value type might not be ambiguous
    // even if there're multiple matching `typeVariations`: that's when
    // the value is an empty array and there is a `typeVariation` that
    // allows the value to be an empty array. In that case, all those
    // `typeVariations` are effectively indiscernable from one another,
    // so any one of those could be used and the choice won't affect anything.
    if (Array.isArray(value) && value.length === 0) {
      const typeVariationsThatAllowEmptyArray = typeVariations.filter(typeVariation => typeVariationAllowsEmptyArray(typeVariation, { context }));
      if (typeVariationsThatAllowEmptyArray.length > 0) {
        return typeVariationsThatAllowEmptyArray[0];
      }
    }

    // Throw `ambiguous` value type error.
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

  return typeVariations[0];
}

function typeVariationAllowsEmptyArray(typeVariation, { context }) {
  return (context.allowEmptyArrays && typeVariation.nonEmpty !== true) || typeVariation.nonEmpty === false;
}
