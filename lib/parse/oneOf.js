import validateOneOf from '../validateOneOf.js';
import parseTypedProperty from './type.js'

export default function parseOneOfProperty(
  key,
  path,
  value,
  oneOf,
  context,
  parseProperty
) {
  validateOneOf(oneOf, { path });

  return parseTypedProperty(
    key,
    path,
    value,
    typeof oneOf[0],
    context,
    parseProperty
  );

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
