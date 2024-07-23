import validateOneOf from '../validateOneOf.js';
import appendPathKey from '../appendPathKey.js';
import parseTypedProperty from './type.js'

export default function parseOneOfProperty({
  key,
  path,
  schemaPath,
  schemaEntry,
  value,
  context,
  parseProperty
}) {
  const { oneOf } = schemaEntry;

  schemaPath = appendPathKey(schemaPath, 'oneOf');

  validateOneOf(oneOf, {schemaPath });

  return parseTypedProperty({
    key,
    path,
    schemaPath,
    schemaEntry: {
      type: typeof oneOf[0],
      description: schemaEntry.description
    },
    value,
    context,
    parseProperty
  });

  // Doesn't validate the parsed value because this is parsing, not validation.
  // if (!oneOf.includes(value)) {
  //   throw context.createParseError({
  //     message: `${value} must be one of: ${oneOf.join(', ')}`,
  //     path,
  //     value
  //   });
  // }
  //
  // return value;
}
