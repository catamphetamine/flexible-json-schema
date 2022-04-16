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
    "description": "User's name"
  },
  "age": {
    "type": "number",
    "description": "User's age"
  },
  ...
})

// Returns the data object if it's valid.
// Throws an error if the data object is not valid.
validate({
  name: 'Alex Jones',
  age: 38,
  ...
})
```

A schema consists of one or multiple "entries", for each property.

A schema "entry" consists of a property name and a property "descriptor" object specifying:

* The property type.
* The property's human-readable description.
* The property's `required` flag. All properties are considered required unless declared as `required: false`.

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
* `"string"` — A string.
* `"date"` — A `Date` string or a `Date` instance.

Utility value types:

* `"email"` — An email address. Example: `"example@domain.com"`.
* `"url"` — A valid URL (absolute or relative). Example: `"https://google.com"`.
* `"relativeUrl"` — A valid relative URL. Example: `"/users/123"`.

#### Strings

By default, empty strings aren't allowed. To allow empty strings, pass `allowEmptyStrings: true` option. Empty strings are still interpreted as "missing values", so if a property should support empty string value then declare it as `required: false`.

```js
const validate = schemaValidation(schema, {
  allowEmptyStrings: true
})
```

#### Dates

By default, all `type: "date"` properties are required to be instances of `Date` class. However, when JSON objects are stringified, `Date`s are converted to "date ISO strings" like `"2000-01-01T00:00:00.000Z"`. To support those, pass `dateStrings: true` flag.

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
<summary>To convert dates from their stringified representations to <code>Date</code> instances, pass <code>convertDates: true</code> option instead of <code>dateStrings: true</code>option.

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

#### Custom Types

To extend the default list of value types, or to override some of them, one can use `useCustomTypes()` function:

```js
import schemaValidation, { useCustomTypes } from 'flexible-json-schema'

// These are simply re-exports from `yup`.
import {
  string,
  boolean,
  object,
  number,
  date,
  lazy,
  array
} from 'flexible-json-schema/core';

useCustomTypes({
  // See `yup` docs for defining custom types:
  // https://www.npmjs.com/package/yup
  "currency": number().min(0)
})

const schema = {
  amount: {
    type: "currency",
    description: "Money amount"
  }
}

const validateMoney = schemaValidation(schema)
validateMoney({ amount: 100.50 })
```

Refer to [`yup`](https://github.com/jquense/yup) documentation for defining custom types:
* An integer between 1 and 10: `number().integer().min(1).max(10)`
* One of "Apple", "Banana", "Clementine": `string().oneOf([null, 'Apple', 'Banana', 'Clementine'])`
* An HTTP(S) URL: `string().matches(/^https?:\/\//)`
* A string whose value depends on some other property value: `string().min(1).when('otherPropertyName', (otherPropertyValue, yupType) => yupType.oneOf(POSSIBLE_VALUES_FOR[otherPropertyValue]))`
* A phone number: `string().min(1).test('isPhoneNumber', '${path} is not a phone number', (value) => !value || isValidPhoneNumber(value))`

A custom type can be a `yup` type definition, like the examples above, or it can be a function returning a `yup` type definition.

```js
import { string, date } from 'flexible-json-schema/core'

useCustomTypes({
  "date": (fromYupType, { context, schemaEntry }) => {
    if (options.dateStrings) {
      return fromYupType(string().matches(DATE_ISO_STRING_REGEXP))
    }
    return fromYupType(date())
  }
})
```

* `fromYupType` function should wrap any `yup` type returned from such function.
* `context` is the optional ["context"](#context) parameter that can be passed when creating a schema validation function. It can be used to alter the behavior of custom types.
* `schemaEntry` is the "schema entry" for this property. It can be used to pass options from the property definition to the custom type validation function in order to alter its behavior.

<details>
<summary>Using <code>yup</code> <code>lazy()</code> type constructor requires the type definition be declared as a function.</summary>

######

```js
useCustomTypes({
  "boolean-or-object": (fromYupType) => {
    return lazy((value) => {
      const type = typeof value === 'boolean' ? boolean() : object()
      return fromYupType(type)
    })
  }
})
```
</details>

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

`oneOf` only supports [value](#values) types (no arrays, no objects, etc).

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

By default, arrays aren't allowed to be empty. To allow empty arrays, pass `allowEmptyArrays: true` option.

```js
const validate = schemaValidation(schema, { allowEmptyArrays: true })
```

### Maps

To define a uniform-type map, use `objectOf: <type>` property.

```js
const validatePerformance = schemaValidation({
  scores: {
    // Could also be an `objectOf` nested objects, etc.
    objectOf: "number",
    description: "Player scores"
  }
})

validatePerformance({
  scores: {
    player1: 1.25,
    player2: 2.40,
    player3: 4.10
  }
})
```

### Nested Objects

To define a nested object, use a "nested schema" approach (see the "Nested Schema" section of this document).

```js
const validateProduct = schemaValidation({
  "type": {
    "oneOf": ["fruit", "vegetable"],
    "description": "Product type"
  },
  "fruit": {
    "name": {
      "type": "string",
      "description": "Fruit name"
    },
    "weight": {
      "type": "number",
      "description": "Fruit weight (in kg.)"
    }
  }
})

validateProduct({
  type: "fruit",
  fruit: {
    name: "Banana",
    weight: 0.2
  }
})
```

## Nested Schema.

Any property of a schema could:
* Reference another schema by name.
* Reference another schema by inline schema definition.
* Directly define a nested object schema.

<details>
<summary>Referencing a nested schema by name.</summary>

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
<summary>Referencing a nested schema by inline schema definition.</summary>

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
<summary>Defining a nested object schema directly.</summary>

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

### Nested Schema Placeholder

To define a nested object of "any" shape, use an empty object `{}` as its schema.

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

This hack should not be used out of laziness. An example of a valid use case for this approach is using such "loosely" defined schema in order to have more flexibility when validating such a nested object.

```js
const validateInput = schemaValidation(inputSchema)

function validate(input) {
  validateInput(input)
  for (const object of input.objects) {
    validateObject(object)
  }
}
```
</details>

## Parse

Schemas could also be used to parse JSON objects with stringified values. For example, it could be used to parse an HTTP GET request query object (with `structure: "flat"` option).

<!-- Or, it could be used to parse dates from "date ISO strings" to `Date` instances in a JSON object (with `parseDatesOnly: true` option). -->

### Parse HTTP GET Request Query

```js
import schemaParser from 'flexible-json-schema/parse'

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
  "active": "1",
  "status": "PENDING",
  "tags": "[\"home\",\"accessory\"]",
  "createdAt": "2000-01-01T00:00:00.000Z",
  "owner": "{\"id\": \"456\"}"
}

const parse = schemaParser(schema, {
  structure: 'flat'
})

parse(query) === {
  "id": 123,
  "active": true,
  "status": "PENDING",
  "tags": ["home", "accessory"],
  "createdAt": new Date("2000-01-01T00:00:00.000Z"),
  "owner": {
    "id": 456
  }
}
```

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

### Parse Custom Types

A developer can supply "custom" types for schema validation via `useCustomTypes()`. Those custom types are only for validation. By default, any custom types are parsed as strings. If any of those custom types should be parsed in some special way, pass a `parseProperty()` function option when creating a schema parsing function.

```js
import { useCustomTypes } from 'flexible-json-schema'
import schemaParser from 'flexible-json-schema/parse'

useCustomTypes({
  "percent": number().min(0).max(100)
})

const parse = schemaParser(schema, {
  parseProperty({ key, path, value, type, parsePropertyValue, context, createParseError }) {
    if (type === "percent") {
      // Parse this property value as a number.
      return parsePropertyValue({ key, path, value, type: 'number' })
    }
    // Parse this property value as a string.
    return value
  }
})
```

## Errors

### Validation Errors

Validating using a schema might throw a `SchemaValidationError`.

```js
import { SchemaValidationError } from 'flexible-json-schema'

error.message // The error message.
error.errors // The list of error messages. Only when `returnAllErrors: true` option is passed.
error.type // One of: "required", "unknown", `undefined`.
error.path // Example: "somePropertyName".
error.value // The value of the property that failed validation.
```

A developer can pass a custom error creation function:

```js
import schemaValidation from 'flexible-json-schema'

const validate = schemaValidation(schema, {
  createValidationError({ output, message, type, path, value }) {
    return new Error(message)
  }
})
```

### Parse Errors

Parsing using a schema might throw a `SchemaParseError`.

```js
import { SchemaParseError } from 'flexible-json-schema'

error.message // The error message.
error.path // Example: "somePropertyName".
error.value // The value of the property that failed to be parsed.
```

A developer can pass a custom error creation function:

```js
import schemaParser from 'flexible-json-schema/parse'

const parse = schemaParser(schema, {
  createParseError({ message, path, value }) {
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

## Context

One can pass `context` options in order to alter the behavior of custom type validators.

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

## Conditional Required

<details>
<summary>When a property should be <code>required</code> depending on some other property.</summary>

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

A `when` condition could also be defined based on not some other property's value but rather the fact of that property being present or not:

```js
{
  one: {
    oneOf: [...],
    description: "One"
  },
  two: {
    type: "text",
    description: "Two",
    required: {
      when: {
        one: {
          $present: true / false
        }
      }
    }
  }
}
```

A `when` condition could be a combination of conditions imposed on several properties, which would be treated as a logical `AND`:

```js
{
  one: {
    oneOf: [...],
    description: "One"
  },
  two: {
    oneOf: [...],
    description: "Two"
  },
  three: {
    type: "text",
    description: "Three",
    required: {
      when: {
        one: {
          $present: true
        },
        two: "two"
      }
    }
  }
}
```
</details>

<!--
`validate(data, options)` options:

* `strict: boolean` — Pass `strict: false` to indicate that there can be other properties not described in the schema. By default, it throws when it encounters an "unknown" property. The `strict: false` flag should be considered a hacky "legacy" workaround that was used in `CC-Public-API/user/create/index.js` to support the hacky legacy "access request" / "user account create" case.
-->
