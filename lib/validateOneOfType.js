import SchemaError from './SchemaError.js';
import appendPathIndex from './appendPathIndex.js';

export default function validateOneOfType(oneOfType, { schemaPath }) {
  // Validate that `oneOfType` is an array.
  if (!Array.isArray(oneOfType)) {
    throw new SchemaError('`oneOfType` must be an array', {
      path: schemaPath
    });
  }

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

    i++;
  }
}
