import SchemaError from './SchemaError.js';
import appendPathIndex from './appendPathIndex.js';

export default function validateOneOfType(oneOfType, { schemaPath }) {
  // Validate that `oneOfType` is an array.
  if (!Array.isArray(oneOfType)) {
    throw new SchemaError('`oneOfType` must be an array', {
      path: schemaPath
    });
  }

  // Will count how many type variations have same `is`.
  const typeVariationsByIs = {};

  // Validate that every type variation has a `description` and an `is`.
  let i = 0;
  for (const typeVariation of oneOfType) {
    // Validate that `description` is present.
    if (typeof typeVariation.description !== 'string') {
      throw new SchemaError('Each `oneOfType` variation must have a `description`', {
        path: appendPathIndex(schemaPath, i)
      });
    }

    // Validate that `is` is present.
    if (!typeVariation.is) {
      throw new SchemaError(`\`is\` property is missing from \`oneOfType\` variation:\n${JSON.stringify(typeVariation, null, 2)}`, {
        path: schemaPath
      });
    }

    // Add to `typeVariationsByIs`.
    if (!typeVariationsByIs[typeVariation.is]) {
      typeVariationsByIs[typeVariation.is] = [];
    }
    typeVariationsByIs[typeVariation.is].push(typeVariation);

    i++;
  }

  // Validate that type variations aren't obviously ambiguous.
  for (const is of Object.keys(typeVariationsByIs)) {
    const typeVariations = typeVariationsByIs[is];
    if (typeVariations.length > 1) {
      const ambiguousTypeVariation = typeVariations.find(_ => !_.when)
      if (ambiguousTypeVariation) {
        throw new SchemaError(`\`when\` property is missing from \`oneOfType\` variation:\n${JSON.stringify(ambiguousTypeVariation, null, 2)}`, {
          path: schemaPath
        });
      }
    }
  }
}
