# Flexible JSON Schema

This library provides a flexible way of defining JSON schemas that can be used for validation of JSON objects.

Built on top of [`yup`](https://github.com/jquense/yup) schema builder, it provides an unlimited level of flexibility when defining custom data types.

It combines the simplicity of JSON schema definition with the unlimited possibilities for fine-grained custom type definition.

## Definitions

"Schemas" are JSON objects describing a data structure. They can be used to validate input or output data.

```js
import schemaValidation from 'flexible-json-schema'

// Create a validation function.
const validate = schemaValidation({
  "name": {
    "type": "string",
    "description": "User's name",
    "example": "John Smith"
  },
  "age": {
    "type": "number",
    "description": "User's age",
    "example": 18
  },
  ...
})

// Returns the data object if it's valid.
// Throws an error if the data object is not valid.
return validate({
  name: 'Alex Jones',
  age: 38,
  ...
})
```

The data could be an object or it could be a non-object.

The tree structure of a schema should correspond to the tree structure of the data.

Each property in a schema should correspond to the same property in the data, describing it via a "property descriptor" — an object specifying:

* Type descriptor — Describes the type of the value. Could be either a "simple" `type` property having a value like `"string"` / `"number"` / etc, or a more "complex" property like `arrayOf` / `oneOf` / `objectOf` / `schema`.
* Description — A human-readable description of the property, for documentation purposes.
* Required or not? — (optional) A boolean `required` flag. Is `required: true` by default.
  * `required: true` — The property must exist and its value can't be `null` or an empty string.
  * `required: false` — The property can be omitted and its value can be `null`.
* Can be `null` or not? — (optional) (advanced) A boolean `nullable` flag. Has no default behavior. Can be used to differentiate between `null` and `undefined` values:
  * `required: true` and `nullable: true` — The property must exist but its value is allowed to be `null`.
  * `required: false` and `nullable: false` — The property can be omitted but its value can't be `null` when it exists.

## Property Types

### Values

Base value types:

* `"number"` — A number (could be fractional).
* `"integer"` — An integer.
* `"positiveNumber"` — A "positive" number.
* `"positiveInteger"` — A "positive" integer.
* `"nonNegativeNumber"` — A "non-negative" number.
* `"nonNegativeInteger"` — A "non-negative" integer.
* `"boolean"` — `true` or `false`.
* `"string"` — A string. Specifically, a non-empty string, unless [`allowEmptyStrings: true`](#strings) option is passed.
* `"date"` — A `Date` instance.
* `"dateString"` — A `Date` string, in [ISO](https://en.wikipedia.org/wiki/ISO_8601) format: `YYYY-MM-DDTHH:mm:ss.sssZ`.

Utility value types:

* `"email"` — An email address. Example: `"example@domain.com"`.
* `"url"` — A valid absolute URL. Example: `"https://google.com"`.
* `"relativeUrl"` — A valid relative URL. Example: `"/users/123"`.

Special case types:

* `null` — Only allows `null` value. Can be used in conjunction with `required: false` to define properties that should be missing or set to `null`.

#### Strings

By default, empty strings aren't allowed. To allow empty strings, pass `allowEmptyStrings: true` option. This will allow empty strings, although they'll still be interpreted as "missing values", so if a property should support an empty string value then it should also be declared as `required: false`.

```js
const validate = schemaValidation(schema, {
  allowEmptyStrings: true
})
```

#### Dates

By default, all `type: "date"` properties are required to be instances of `Date` class. However, when JSON objects are stringified, all `Date` properties are converted to "date ISO strings" like `"2000-01-01T00:00:00.000Z"`. To use `type: "date"` for those stringified dates, pass `dateStrings: true` option.

```js
const validate = schemaValidation(schema, {
  dateStrings: true
})
```

Another supported date string format is `"yyyy-mm-dd"`.

```js
const validate = schemaValidation(schema, {
  dateStrings: true,
  dateFormat: 'yyyy-mm-dd'
})
```

<details>
<summary>The validation function could also convert dates from their stringified representations to <code>Date</code> instances. To do that, pass <code>convertDates: true</code> option instead of <code>dateStrings: true</code> option.</summary>

######

```js
const schema = {
  date: {
    type: "date",
    description: "Date"
  }
}

const validateAndConvertDates = schemaValidation(schema, {
  convertDates: true,
  // dateFormat: 'yyyy-mm-dd'
})

const data = {
  date: '2000-01-01T00:00:00.000Z'
  // date: '2000-01-01'
}

// Mutates the data object.
validateAndConvertDates(data)

data.date instanceof Date === true
```
</details>

#### Custom Types

To extend the default list of value types, or to override some of them, one can use `useCustomTypes()` function.

To create custom types, one could use the basic [`yup`](https://www.npmjs.com/package/yup) type constructors that're re-exported from `flexible-json-schema/core` subpackage, along with a few "utility" functions that're exported from `flexible-json-schema/type` subpackage.

```js
import schemaValidation, { useCustomTypes } from 'flexible-json-schema'

// These are simply re-exports from `yup`.
//
// See `yup` docs for defining custom types:
// https://www.npmjs.com/package/yup
//
import {
  string,
  boolean,
  number,
  date,
  object,
  array
} from 'flexible-json-schema/core';

// These are utility functions that could be used to create custom types.
import {
  arrayOfOneOf,
  conditional,
  depends,
  filter,
  oneOf,
  regexp
} from 'flexible-json-schema/type'

useCustomTypes({
  // A `yup` type definition. See `yup` docs for more info.
  "currencyAmount": number().min(0),

  // `oneOf()` creates a type that could be any value from the list.
  "currencyType": oneOf(["USD", "CAD"]),

  // `arrayOfOneOf()` creates a type that could be an array of the values from the list.
  // Supported options: `allowEmpty: true` / `nonEmpty: false`.
  "colors": arrayOfOneOf(["red", "green", "blue"]),

  // `conditional()` dynamically creates a type based on the value.
  // Example: Suppose that `rating` could only be `0...10` or `999`.
  "rating": conditional((value) => {
    if (value >= 0 && value <= 10) {
      return number().min(0).max(10);
    }
    return number().min(999).max(999);
  }),

  // `depends()` defines a property that depends on another property.
  // Example: a list of possible country regions depends on the country.
  "country": oneOf(['US', 'CA']),
  "countryRegion": depends(['country'], string(), ([country], type) => {
    if (country === 'US') {
      return oneOf(type, ['TX', 'CA', ...]);
    } else {
      return oneOf(type, ['ON', 'NS', ...]);
    }
  }),

  // `filter()` defines a type that must satisfy some condition.
  "phone": filter(string(), value => value.length === 10),

  // `regexp()` defines a string that must match a regular expression.
  // By default, empty strings aren't allowed.
  // Supported options: `allowEmpty: true` / `nonEmpty: false`.
  "url": regexp(/^https?:\/\//)
})

const schema = {
  amount: {
    type: "currencyAmount",
    description: "Currency amount"
  },
  currency: {
    type: "currencyType",
    description: "Currency type"
  }
}

const validateMoney = schemaValidation(schema)
validateMoney({ amount: 100.50, currency: 'USD' })
```

#### Custom Types (`yup`)

When not using the "utility" functions that're expored from `flexible-json-schema/type` subpackage, or when there's no suitable function there, one could define custom types using just the functions provided by [`yup`](https://www.npmjs.com/package/yup). This way it would be much more flexible but also more complex.

Refer to [`yup`](https://github.com/jquense/yup) documentation for more info on defining custom types.

Common examples:
* An integer between 1 and 10: `number().integer().min(1).max(10)`
* An HTTP(S) URL: `string().matches(/^https?:\/\//)`
* One of "x", "y", "z" (or empty, when `required: false`): `string().oneOf([null, "x", "y", "z"])`
* An array of colors: `array().of(string().oneOf("red", "green", "blue"))`

<details>
<summary>Any validation logic via <code>.test()</code></summary>

######

```js
// Validates US phone numbers written in `+1` notation.
// Example: "+12133734253".
function isValidUsPhoneNumber(value) {
  return value.length === 12 && value.startsWith("+1")
}

useCustomTypes({
  "phone": string().test(
    'isUsPhoneNumber',
    '${path} is not a US phone number',
    (value) => {
      // A workaround for a `yup` quirk:
      // `test()` function is also run for `undefined` or `null` values.
      // https://github.com/jquense/yup/issues/1055
      if (value === undefined || value === null) {
        // Ignore `undefined` or `null` values:
        // those ones should still pass the test
        // when the property is declared as `required: false`.
        return true
      }
      return isValidUsPhoneNumber(value)
    }
  )
})
```
</details>

######

The examples above are considered quite simple `yup` type definitions. In some cases though, a property type can't be described in such simple terms. For example, a property value could be either a `number` or a `string`, but both are considered valid in general. Or there might be cases when one property value could depend on some other property value.

In such complex cases, a property type definition could be implemented as a type constructor function:

```js
function (fromYupType, { schemaEntry }) {
  return fromYupType(...)
}
```

* `fromYupType()` function should wrap the final `yup` type returned from the type contructor function.
<!-- * `context` is the optional "context" parameter that can be passed when creating a schema validation function. It can be used to alter the behavior of custom types. -->
* `schemaEntry` is the "schema entry" for this property. It could be used to read any options from the "schema entry" definition and then act accordingly.

<details>
<summary>Using <code>yup</code> <code>lazy()</code> function to dynamically define property type based on the property value.</summary>

######

```js
useCustomTypes({
  "booleanOrObject": (fromYupType) => {
    return lazy((value) => {
      switch (typeof value) {
        case 'boolean':
          return fromYupType(boolean())
        default:
          return fromYupType(object())
      }
    }
})
```
</details>

<details>
<summary>Using <code>yup</code> <code>when()</code> function to dynamically define property type based on some other property value.</summary>

######

```js
import { useCustomTypes } from "flexible-json-schema"
import { string } from "flexible-json-schema/core"

const STATES = {
  US: ["TX", "NY", "CA", ...],
  CA: ["NL", "PE", "QC", ...]
}

useCustomTypes({
  // `country` can be one of: "US", "CA".
  // Adding `null` is required due to `yup`'s internal quirks.
  // https://github.com/jquense/yup/issues/104
  "country": string().oneOf([null, "US", "CA"]),

  // `state` depends on `country`.
  "state": (fromYupType) => {
    return string().when(["country"], ([country], stringType) => {
      // If `country` is specified, then `state` must also be specified.
      if (country) {
        return fromYupType(stringType.oneOf(STATES[country]))
      }
      // If `country` is not specified, then `state` should also be not specified.
      return fromYupType(stringType.oneOf([null]))
    })
  }
})
```
</details>

<!--
<details>
<summary>Passing <code>context</code> option to dynamically define custom types at runtime.</summary>

######
-->

<!--
For example, suppose there's a `language` context parameter. Then, a custom `type: "month"` could be implemented as:

```js
import schemaValidation, { useCustomTypes } from 'flexible-json-schema'

useCustomTypes({
  "month": (fromYupType, { context }) => {
    switch (context.language) {
      case 'ru':
        return fromYupType(string().oneOf([
          null,
          'янв',
          'фев',
          ...
        ]))
      case 'en':
        return fromYupType(string().oneOf([
          null,
          'jan',
          'feb',
          ...
        ]))
      default:
        throw new Error(`Language not supported: ${context.language}`)
    }
  }
})

const schema = {
  month: {
    type: "month",
    description: "Month name"
  }
}

const validateRussian = schemaValidation(schema, {
  context: {
    language: 'ru'
  }
})

validateRussian({
  month: 'янв'
})

const validateEnglish = schemaValidation(schema, {
  context: {
    language: 'en'
  }
})

validateEnglish({
  month: 'jan'
})
```

Analogous, `context` can be used in a custom type validator.
-->

<!--
```js
import schemaValidation, { useCustomTypes } from 'flexible-json-schema'
import { number, string } from 'flexible-json-schema/core'

useCustomTypes({
  "countryCode": (fromYupType, { context }) => {
    return fromYupType(context.threeLetterCodes ? string().length(3) : string().length(2))
  }
})

const schema = {
  country: {
    type: "countryCode",
    description: "A three-letter or a two-letter country code"
  }
}

const validateThreeLetterCode = schemaValidation(schema, {
  context: {
    threeLetterCodes: true
  }
})

validateThreeLetterCode({
  country: 'RUS'
})
```
</details>
-->

### Enums

To define a "one of" value type ("enumeration"), use `oneOf: [...]` property.

```js
const validateProduct = schemaValidation({
  "fruit": {
    "oneOf": ["Apple", "Banana", "Coconut"],
    "description": "A fruit"
  }
})

validateProduct({
  fruit: "Banana"
})
```

`oneOf` only supports [value](#values) types: no arrays, no objects, etc. All values must be of the same type: strings only, numbers only, etc.

### Arrays

To define an array of elements of some type, use `arrayOf: <type>` property.

```js
const validateProducts = schemaValidation({
  "fruits": {
    "arrayOf": "string",
    "description": "A list of fruits"
  }
})

validateProducts({
  fruits: ["Apple", "Banana"]
})
```

Or, for example, an array of objects with a certain shape:

```js
const validateProducts = schemaValidation({
  "fruits": {
    "arrayOf": {
      "name": {
        "type": "string",
        "description": "Fruit name"
      }
    },
    "description": "A list of fruits"
  }
})

validateProducts({
  fruits: [{ name: "Apple" }, { name: "Banana" }]
})
```

By default, arrays aren't allowed to be empty. To allow any array to be empty, pass `allowEmptyArrays: true` option.

```js
const validate = schemaValidation(schema, { allowEmptyArrays: true })
```

The global `allowEmptyArrays` setting can be overridden for individual arrays by specifying `allowEmpty: true` or `nonEmpty: true` property in the descriptor object:

```js
const schema = {
  array: {
    arrayOf: 'string',
    allowEmpty: true
  }
}
```

### Maps

To define a uniform-type map, use `objectOf: <type-or-schema>` property.

```js
const validatePerformance = schemaValidation({
  scores: {
    objectOf: "number",
    description: "Player scores"
  }
})

validatePerformance({
  scores: {
    player1: 1.25,
    player2: 2.40
  }
})
```

```js
const validatePerformance = schemaValidation({
  scores: {
    objectOf: {
      score: {
        type: "number",
        description: "Score"
      }
    },
    description: "Player scores"
  }
})

validatePerformance({
  scores: {
    player1: {
      score: 1.25
    },
    ...
  }
})
```

The set of possible keys of an object could be restricted by specifying a `keyOneOf` property.

```js
const validatePerformance = schemaValidation({
  scores: {
    objectOf: "number",
    keyOneOf: ["Alice", "Bob"],
    description: "Player scores"
  }
})

validatePerformance({
  scores: {
    Alice: 1.25,
    Bob: 2.40
  }
})
```

Alternative to specifying `keyOneOf`, one could specify a `keyType`.

```js
import schemaValidation, { useCustomTypes } from 'flexible-json-schema'
import { oneOf } from 'flexible-json-schema/type'

useCustomTypes({
  "AliceOrBob": oneOf(["Alice", "Bob"])
})

const validatePerformance = schemaValidation({
  scores: {
    objectOf: "number",
    keyType: "AliceOrBob",
    description: "Player scores"
  }
})

validatePerformance({
  scores: {
    Alice: 1.25,
    Bob: 2.40
  }
})
```

### Objects

To define an object (for example, a nested object), there're three different approaches:

* Reference another schema by name. See [Schema Reference](#schema-reference).
* Define the object's schema in a `schema` property.
* Define the object's shape.

<details>
<summary>Referencing another schema by name.</summary>

######

```js
const artistSchema = {
  name: {
    type: 'string',
    description: 'Artist name'
  },
  discography: {
    arrayOf: {
      schema: 'album'
    }
  }
}

const schemas = {
  album: {
    title: {
      type: 'string',
      description: 'Album title'
    },
    year: {
      type: 'number',
      description: 'Album year'
    }
  }
}

const validateArtist = schemaValidation(artistSchema, { schemas })
```
</details>

<details>
<summary>Referencing another schema by name (via <code>extends</code> keyword) while extending it with custom properties.</summary>

######

```js
const artistSchema = {
  name: {
    type: 'string',
    description: 'Artist name'
  },
  discography: {
    arrayOf: {
      extends: 'album',
      schema: {
        rating: {
          type: 'number',
          description: 'The album\'s rating among the other albums of the artist'
        }
      }
    }
  }
}

const schemas = {
  album: {
    title: {
      type: 'string',
      description: 'Album title'
    },
    year: {
      type: 'number',
      description: 'Album year'
    }
  }
}

const validateArtist = schemaValidation(artistSchema, { schemas })
```
</details>

<details>
<summary>Defining the object's schema in a <code>schema</code> property.</summary>

######

```js
const artistSchema = {
  name: {
    type: 'string',
    description: 'Artist name'
  },
  discography: {
    arrayOf: {
      schema: {
        title: {
          type: 'string',
          description: 'Album title'
        },
        year: {
          type: 'number',
          description: 'Album year'
        }
      }
    }
  }
}

const validateArtist = schemaValidation(artistSchema)
```
</details>

<details>
<summary>Define the object's shape.</summary>

######

```js
const artistSchema = {
  name: {
    type: 'string',
    description: 'Artist name'
  },
  bestAlbum: {
    title: {
      type: 'string',
      description: 'Album title'
    },
    year: {
      type: 'number',
      description: 'Album year'
    }
  }
}

const validateArtist = schemaValidation(artistSchema)
```
</details>

### Any

Although supporting "any" type contradicts the concept of defining a schema by itself, it might be useful in cases when a developer wants to "start small" and outline a schema for some legacy undocumented data structure. So "any" type is considered an intermediate rather than a prominent solution.

#### Any Type

To define a property of "any" type, use `type: "any"`.

Matches any value, any array, any object, etc.

#### Any Array

To define an array of `type: "any"` items, use `arrayOf: "any"`.

#### Any Object

To define an object of "any" shape, use an empty object `{}` as its schema.

To define an empty object, use an empty object `{}` as its schema and `empty: true` property.

<details>
<summary>Example</summary>

#####

"Simple" variant:

```js
{
  nestedObject: {}
}
```

"Advanced" variant:

```js
{
  nestedObject: {
    description: "...",
    required: true/false,
    schema: {}
  }
}
```

<!--
This feature had been used before [Schema References](#schema-reference) were implemented:

```js
const validateInput = schemaValidation(inputSchema)

function validate(input) {
  validateInput(input)
  for (const object of input.objects) {
    validateObject(object)
  }
}
```
-->
</details>

### One of Type

To define a "one of type" property, add a `oneOfType` entry containing an array of "type variations".

Each "type variation" should be a standard "property descriptor" object also having:

* `is` — a javascript `typeof` type.
* `when` — (optional) the [conditions](#when) that the property value has to match in case of `is: "object"` or `is: "object[]"`:
  * In case of `is: "object"`, `when` will test the properties of the object.
  * In case of `is: "object[]"`, `when` will test the properties of each object in the array — all of them must match.

`is` can be one of:

* `string`
* `number`
* `boolean`
* `object`
* `date` — A `Date` instance. If `dateStrings: true` flag is passed, then any `string`.
* An array of any of the above:
  * `string[]`
  * `number[]`
  * `boolean[]`
  * `object[]`
  * `date[]`
* `any[]` — An array of any elements.

<details>
<summary>An example of defining a <code>oneOfType</code> property.</summary>

######

```js
const schema = {
  booleanOrStringOrArrayOrObject: {
    description: "A boolean, or a string, or an array of strings, or an object with a formula.",
    oneOfType: [
      {
        // "boolean" here is a javascript `typeof` type.
        is: "boolean",
        type: "boolean",
        description: "Can be a boolean"
      },
      {
        // "string" here is a javascript `typeof` type.
        is: "string",
        oneOf: ["x", "y", "z"],
        description: "Can be one of: 'x', 'y', 'z'"
      },
      {
        // "string" here is a javascript `typeof` type.
        is: "string[]",
        arrayOf: {
          oneOf: ["x", "y", "z"]
        },
        description: "Can be an array of: 'x', 'y', 'z'"
      },
      {
        // "object" here is a javascript `typeof` type.
        is: "object",
        when: {
          formula: {
            $exists: true
          }
        },
        description: "Can be an object with a formula",
        schema: {
          formula: {
            type: "string",
            description: "Some formula"
          }
        }
      }
    ]
  }
}
```
</details>

## `when`

`when` object describes conditions that an object must match. The shape of `when` is:

  * `[propertyName]: propertyValue` — The object must have a property called `[propertyName]` and its value must be equal to `propertyValue`.
  * `[propertyName]: conditions` — The object must have a property called `[propertyName]` and its value must meet all of the conditions described by the `conditions` object. The shape of `conditions` object is:
    * `$exists: true` — The property must "exist", i.e. the value must not be `undefined` or `null`.
    * `$exists: false` — The property must not "exist", i.e. the value must be `undefined` or `null`.
    * `$notEqual: value` — The value must not be equal to `value`.
    * `$oneOf: [...]` — The value must be one of `[...]`.
    * `$notOneOf: [...]` — The value must not be one of `[...]`.
    * `$is: "..."` — The value must be of type `"..."` (see the [list](#one-of-type) of possible `is` types).
    * `$isNot: "..."` — The value must not be of type `"..."` (see the [list](#one-of-type) of possible `is` types).
  * `$or: [conditions1, conditions2, ...]` — Allows providing a list of `conditions` objects only one of which is required to match.

Examples:

```js
// Both conditions must be met:
// * `one` property exists
// * `two` property value is "b"
const when = {
  one: {
    $exists: true
  },
  two: "b"
}

// Matches:
// * { one: 'a', two: 'b', three: 'c' }
```

```js
// Any of the conditions must be met:
// * `one` property exists
// * `two` property exists
const when = {
  $or: [
    one: {
      $exists: true
    },
    two: {
      $exists: true
    }
  ]
}

// Matches:
// * { one: 'a', three: 'c' }
// * { two: 'b', three: 'c' }
// * { one: 'a', two: 'b', three: 'c' }
```

## Schema Reference

Any property in a schema can reference another schema by name.

```js
const schema = {
  artist: {
    description: 'Artist',
    schema: 'artist'
  },
  discography: {
    description: 'Artist\'s discography',
    arrayOf: {
      schema: 'album'
    }
  }
}

const schemas = {
  artist: {
    name: {
      type: 'string',
      description: 'Artist name'
    }
  },
  album: {
    title: {
      type: 'string',
      description: 'Album title'
    },
    year: {
      type: 'number',
      description: 'Album year'
    }
  }
}

const validateArtist = schemaValidation(schema, { schemas })
```

## Parse

Schemas could also be used to "parse" JSON objects with stringified values in order to convert those values from strings to their appropriate "native" type: string, number, boolean, date, etc.

An example of a JSON object with stringified values:

```js
{
  "name": "John Smith",
  "age": "35",
  "married": "true",
  "title": "Manager",
  "occupation": ["salesman", "marketing"],
  "children": [{
    "name": "Jane Brown",
    "sex": "female",
    "age": "4"
  }]
}
```

In that case, each and every "leaf" property of the data tree sctructure must be a string, unless being `undefined` or `null`.

The most-commonly-used scenarios for parsing JSON objects with stringified values are:

* Parsing a CSV file.
  * First, a CSV file should be parsed into a list rows of cells having a "flat" data structure.
    * Example: `[["Column 1", "Column 2", ...], ["Value 1", "Value 2", ...], ...]`.
  * Then, those "flat" rows of data should be converted from arrays to JSON objects, usually with property nesting. The value of each "leaf" property should stay being a string.
    * Example: `[{ "Column 1": "Value 1", "Column 2": "Value 2", ... }, ...]`.
  * After that, the list of JSON objects should be "parsed" using a schema in order for every "leaf" string property to be converted into an appropriate "native" type:
    * string
    * number
    * boolean
    * date
    * etc.

* Parsing URL query parameters.
  * First, all query parameter values should be extracted from the URL into a `query` object.
    * Example: `{ "param1": "value1", "param2": "value2", ... }`.
  * Then, the `query` object should be "parsed" using a schema in order to convert every query parameter's string value into an appropriate "native" type:
    * string
    * number
    * boolean
    * date
    * etc.
  * When some URL query parameter values are "complex" data structures such as arrays or objects:
    * First, those values should be `JSON.stringify()`-ed before putting them in the URL. For example, if there's a query parameter called `filters` being an object `{...}` then the URL query part should look like: `?filters=${JSON.stringify(filters)}`. Same goes for arrays.
    * Second, one should pass `structure: "flat"` option when "parsing" the extracted `query` object using a schema, which enables `JSON.parse()`-ing such "complex" data structures back from their "stringified" representations. See the example below.

<!-- Or, it could be used to parse dates from "date ISO strings" to `Date` instances in a JSON object (with `parseDatesOnly: true` option). -->

### Parse `boolean`

When parsing `boolean` values, it supports multiple possible formats for convenience:

* `"true"` or `"false"`
  * `"true"` → `true`
  * `"false"` → `false`
* `"1"` or `"0"`
  * `"1"` → `true`
  * `"0"` → `false`
* `"✓"` or `"✕"`
  * `"✓"` → `true`
  * `"✕"` → `false`

### Examples

<details>
<summary>Parse HTTP GET Request Query.</summary>

######

```js
import schemaParser from "flexible-json-schema/parse"

const querySchema = {
  id: {
    type: "number",
    description: "A numeric ID"
  },
  active: {
    type: "boolean",
    description: "Whether the item is active"
  },
  status: {
    oneOf: ["PENDING", "FINALIZED"],
    description: "The item's status"
  },
  tags: {
    arrayOf: "string",
    description: "The item's tags"
  },
  scores: {
    arrayOf: "number",
    description: "The item's scores"
  },
  createdAt: {
    type: "date",
    description: "Creation date"
  },
  owner: {
    id: {
      type: "number",
      description: "A numeric ID of the item's owner"
    }
  }
}

// const query = request.query
// const params = request.pathParameters

const query = {
  "id": "123",
  "active": "true",
  "status": "PENDING",
  "tags": "[\"home\",\"accessory\"]",
  "scores": "[1.5,2.0]",
  "createdAt": "2000-01-01T00:00:00.000Z",
  "owner": "{\"id\":456}"
}

const parse = schemaParser(schema, {
  structure: "flat"
})

parse(query) === {
  "id": 123,
  "active": true,
  "status": "PENDING",
  "tags": ["home", "accessory"],
  "scores": [1.5, 2],
  "createdAt": new Date("2000-01-01T00:00:00.000Z"),
  "owner": {
    "id": 456
  }
}
```
</details>

<details>
<summary>Parse CSV file data.</summary>

######

```js
import schemaParser from 'flexible-json-schema/parse'

const schema = {
  id: {
    type: "number",
    description: "A numeric ID"
  },
  name: {
    type: "string",
    description: "A person's name"
  },
  dateOfBirth: {
    type: "date",
    description: "Date of birth"
  },
  address: {
    street: {
      type: "string",
      description: "Street name"
    },
    building: {
      type: "number",
      description: "Building number"
    }
  }
}

const csvFileContents = `
id,name,dateOfBirth,street,apt
1,John Smith,2000-01-01,Main Ave.,10
`.trim()

// This is a "naive" variant of parsing *.csv file contents.
// A proper implementation should check for escaped commas in cell values.
const [
  id,
  name,
  dateOfBirth,
  street,
  building
] = csvFileContents.split('\n')[1].split(',')

const person = {
  id,
  name,
  dateOfBirth,
  address: {
    street,
    building
  }
}

person === {
  id: "1",
  name: "John Smith",
  dateOfBirth: "2000-01-01",
  address: {
    street: "Main Ave.",
    building: "10"
  }
}

const parse = schemaParser(schema, {
  inPlace: true,
  dateFormat: "yyyy-mm-dd"
})

parse(person) === {
  id: 1,
  name: "John Smith",
  dateOfBirth: new Date("2000-01-01T00:00:00.000Z"),
  address: {
    street: "Main Ave.",
    building: 10
  }
}
```
</details>

<!--
### Parse Dates Only

In web development, data is passed from client to server by first calling `JSON.stringify()` on the client and then calling `JSON.parse()` on the server. During this transformation, `Date` instances get converted to "date ISO strings" like `"2000-01-01T00:00:00.000Z"`, and then don't get converted back to `Date` instances.

To fix just that, pass `parseDatesOnly: true` option when creating a schema parsing function: it will only convert dates from "date ISO strings" to `Date` instances and leave other properties untouched.

```js
import schemaParser from 'flexible-json-schema/parse'

const parse = schemaParser(schema, {
  parseDatesOnly: true
})

parse({
  id: 123,
  date: "2000-01-01T00:00:00.000Z"
}) === {
  id: 123,
  date: new Date("2000-01-01T00:00:00.000Z")
}
```

If stringified dates are in a format other than "date ISO string", pass a `dateFormat` option. Currently, only `"yyyy-mm-dd"` format is supported.

```js
import schemaParser from 'flexible-json-schema/parse'

const parse = schemaParser(schema, {
  parseDatesOnly: true,
  dateFormat: 'yyyy-mm-dd'
})

parse({
  id: 123,
  date: "2000-01-01"
}) === {
  id: 123,
  date: new Date("2000-01-01T00:00:00.000Z")
}
```
-->

<details>
<summary>Parse Custom Types.</summary>

######

<!--
Developers can define "custom" types via `useCustomTypes()`. Even though custom type definitions are only used for validation, the parsing function still requires each custom type to be defined. By default, any custom types are parsed as strings. If any of those custom types should be parsed in some other way, pass a `parseProperty()` function option when creating a schema parsing function.

```js
import { useCustomTypes } from 'flexible-json-schema'
import { number, string } from 'flexible-json-schema/core'
import schemaParser from 'flexible-json-schema/parse'

useCustomTypes({
  "percent": number().min(0).max(100),
  "phone": string()
})

const parse = schemaParser(schema, {
  parseProperty({ path, value, type, parsePropertyValue, createParseError }) {
    // Parse `type: "percent"` properties as numbers.
    if (type === "percent") {
      return parsePropertyValue({ path, value, type: 'number' })
    }
    // Parse any other custom-type properties,
    // including `type: "phone"` ones, as strings.
    return value
  }
})
```
-->

Developers can define "custom" types via `useCustomTypes()` but those custom type definitions are only used for validation. The parsing function ignores any of those custom type definitions and, by default, leaves those property values as is. If any of those custom types should be parsed in some special way, pass a `parseProperty()` function option when creating a schema parsing function.

```js
import schemaParser from 'flexible-json-schema/parse'

const parse = schemaParser(schema, {
  parseProperty({ path, value, type, parsePropertyValue, createParseError }) {
    // Parse `type: "percent"` properties as numbers.
    if (type === "percent") {
      return parsePropertyValue({ path, value, type: 'number' })
    }
    // Parse any other custom-type properties,
    // like `type: "phone"` ones, as strings.
    return value
  }
})
```
</details>

## Errors

### Validation Errors

Validating using a schema might throw a `SchemaValidationError`.

```js
import { SchemaValidationError } from 'flexible-json-schema'

error.message // Detailed error message.
error.errors // A list of original error messages. To include all errors, pass `returnAllErrors: true` option.
error.type // Error type. One of: "required", "unknown", "ambiguous", "unsupported", `undefined`.
error.path // Example: "somePropertyName.childObjectProperty". Is `undefined` for root path.
error.value // The value of the property that failed validation.
```

A developer can pass a custom error creation function:

```js
import schemaValidation from 'flexible-json-schema'

const validate = schemaValidation(schema, {
  // See TypeScript typings for the list of possible values for the `type` property.
  createValidationError({ message, errors, type, path, value }) {
    return new Error(message)
  }
})
```

### Parse Errors

Parsing using a schema might throw a `SchemaParseError`.

```js
import { SchemaParseError } from 'flexible-json-schema'

error.message // Detailed error message.
error.errors // A list of original error messages. Only a single error message in the list.
error.type // Error type. One of: "ambiguous", "unsupported", "invalid", "unknown", `undefined`.
error.path // Example: "somePropertyName.childObjectProperty". Is `undefined` for root path.
error.value // The value of the property that failed to be parsed.
```

A developer can pass a custom error creation function:

```js
import schemaParser from 'flexible-json-schema/parse'

const parse = schemaParser(schema, {
  // See TypeScript typings for the list of possible values for the `type` property.
  createParseError({ message, errors, type, path, value }) {
    return new Error(message)
  }
})
```

### Returning All Errors

By default, schema validation aborts as soon as it encounters the first validation error and then throws an error for that property. If returning all errors is required, pass `returnAllErrors: true` property: in that case, a `SchemaValidationError` error will have an `errors` property (a list of all error messages).

```js
const validate = schemaValidation(schema, {
  returnAllErrors: true
})
```

## Conditional Required

Conditional Required could be used when a property should be `required` depending on some other property.

<details>
<summary>Example</summary>

#####

Suppose there's a "Reason" select for an action performed on a website. The user could select a pre-defined reason from a list of common ones, or they could select "Other" and then describe the reason in a separate text input field (required).

The form data is then sent to the server as a combination of two fields:

* `reason` — A pre-defined reason code, or `"OTHER"`.
* `reasonNotes` — The `"OTHER"` reason description (required).

So when `reason` is `"OTHER"`, `reasonNotes` are required. Such "conditional require" could be described as:

```js
{
  reason: {
    oneOf: [...],
    description: "Reason"
  },
  reasonNotes: {
    type: "text",
    description: "Reason description",
    required: {
      when: {
        reason: "OTHER"
      }
    }
  }
}
```

In the schema above, `when` describes the [conditions](#when) that the object's properties must meet.
</details>

<!--
`validate(data, options)` options:

* `strict: boolean` — Pass `strict: false` to indicate that there can be other properties not described in the schema. By default, it throws when it encounters an "unknown" property. The `strict: false` flag should be considered a hacky "legacy" workaround that was used in `CC-Public-API/user/create/index.js` to support the hacky legacy "access request" / "user account create" case.
-->

## Tests

To run tests:

```
npm test
```
