import isObject from './isObject.js';

import validateOneOfProperty from './validate/oneOf.js';
import validateArrayOfProperty from './validate/arrayOf.js';
import validateObjectOfProperty from './validate/objectOf.js';
import validateOneOfTypeProperty from './validate/oneOfType.js';
import validateObjectProperty from './validate/object.js';
import validateTypedProperty from './validate/type.js';

import parseOneOfProperty from './parse/oneOf.js';
import parseArrayOfProperty from './parse/arrayOf.js';
import parseObjectOfProperty from './parse/objectOf.js';
import parseOneOfTypeProperty from './parse/oneOfType.js';
import parseObjectProperty from './parse/object.js';
import parseTypedProperty from './parse/type.js';

const SCHEMA_ENTRY_TYPES = [
  // "Inline" object schema definition.
  //
  // Doesn't have a `description` property.
  // Is implicitly assumed `required: true`.
  //
  // This "inline" object schema entry type should be at the first position in this list
  // in order to validate that `isInlineObjectSchema()` function works correctly.
  //
  {
    name: 'inline-object-schema',
    test: schemaEntry => isInlineObjectSchema(schemaEntry),
    validate: (parameters) => validateObjectProperty({
      ...parameters,
      inlineObjectSchema: true
    }),
    parse: (parameters) => parseObjectProperty({
      ...parameters,
      inlineObjectSchema: true
    })
  },

  // `schema`
  {
    name: 'schema',
    test: schemaEntry => isObject(schemaEntry.schema),
    validate: validateObjectProperty,
    parse: parseObjectProperty
  },

  // `oneOf`
  {
    name: 'oneOf',
    test: schemaEntry => schemaEntry.oneOf,
    validate: validateOneOfProperty,
    parse: parseOneOfProperty
  },

  // `arrayOf`
  {
    name: 'arrayOf',
    test: schemaEntry => schemaEntry.arrayOf,
    validate: validateArrayOfProperty,
    parse: parseArrayOfProperty
  },

  // `objectOf`
  {
    name: 'objectOf',
    test: schemaEntry => schemaEntry.objectOf,
    validate: validateObjectOfProperty,
    parse: parseObjectOfProperty
  },

  // `oneOfType`
  {
    name: 'oneOfType',
    test: schemaEntry => schemaEntry.oneOfType,
    validate: validateOneOfTypeProperty,
    parse: parseOneOfTypeProperty
  },

  // `type`
  {
    name: 'type',
    test: schemaEntry => typeof schemaEntry.type === 'string',
    validate: validateTypedProperty,
    parse: parseTypedProperty
  }
];

export default SCHEMA_ENTRY_TYPES;

export function isInlineObjectSchema(schemaEntry) {
  if (!isObject(schemaEntry)) {
    return false;
  }

  for (const schemaEntryType of SCHEMA_ENTRY_TYPES) {
    if (schemaEntryType.name !== 'inline-object-schema') {
      if (schemaEntryType.test(schemaEntry)) {
        return false;
      }
    }
  }

  return true;
}
