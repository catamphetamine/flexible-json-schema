import { lazy, mixed } from '../core.js';
import validateOneOfType from '../validateOneOfType.js';
import valueMatchesTypeVariation from '../valueMatchesTypeVariation.js';
import appendPathIndex from '../appendPathIndex.js';

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

    // Find matching types.
    const typeVariations = oneOfType.filter((typeVariation) => {
      return valueMatchesTypeVariation(value, typeVariation, { schemaPath, context });
    });

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
      {
        ...typeDefinition,
        required
      },
      {
        key,
        path,
        schemaPath: appendPathIndex(schemaPath, oneOfType.indexOf(typeVariations[0])),
        context
      }
    );
  })
}
