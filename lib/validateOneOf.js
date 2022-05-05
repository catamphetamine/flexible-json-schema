import SchemaError from './SchemaError.js';

export default function validateOneOf(oneOf, { path }) {
  // Validate that `oneOf` list values are of the same type,
  // and that that value type is supported.
  const valueTypes = oneOf.map(value => typeof value);
  for (const valueType of valueTypes) {
    if (valueType !== valueTypes[0] || !isValidOneOfValueType(valueType)) {
      throw new SchemaError(`A \`oneOf\` values list can only consist of either string or number or boolean values`, {
        path
      })
    }
  }
}

/**
 * `oneOf` value lists only support: strings, numbers or booleans.
 *
 * Objects aren't supported, though it could be possible using `lodash-es/isEqual()`.
 *
 * Dates aren't supported too.
 * The rationale is that a JSON schema can't specify `Date` objects
 * as part of a `oneOf` value list, so it can't be a date anyway.
 * Theoretically, one could come up with a workaround like storing date values
 * in "date ISO string" format and then specifying some additional flag
 * like `oneOfDates: true`, but currently there's no need for such feature.
 *
 * @param  {string} nativeValueType
 * @return {Boolean}
 */
function isValidOneOfValueType(type) {
  switch (type) {
    case 'string':
    case 'number':
    case 'boolean':
      return true;
    default:
      return false;
  }
}
