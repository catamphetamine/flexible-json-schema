import schemaValidation from './validate.js';

describe('validate', function() {
  it('should validate `type: "any"` values', function() {
    const schema = {
      value: {
        type: 'any',
        description: 'Any'
      }
    }

    const validate = schemaValidation(schema)

    validate({ value: 'a' })
    validate({ value: 1 })
    validate({ value: ['a', 'b'] })
    validate({ value: [1, 2] })
    validate({ value: { a: 'b' } })
  })

  it('should validate `type: "any"` values (`required: false`)', function() {
    const schema = {
      value: {
        type: 'any',
        description: 'Any',
        required: false
      }
    }

    const validate = schemaValidation(schema)

    validate({ value: 'a' })
    validate({ value: 1 })
    validate({ value: ['a', 'b'] })
    validate({ value: [1, 2] })
    validate({ value: { a: 'b' } })
    validate({})
  })

  it('should validate `arrayOf: "any"` arrays', function() {
    const schema = {
      value: {
        arrayOf: 'any',
        description: 'Any array'
      }
    }

    const validate = schemaValidation(schema)

    validate({ value: [1, 2] })
    validate({ value: ['a', 'b'] })

    expect(() => {
      validate({ value: 'a' })
    }).to.throw('value must be a `array` type')

    expect(() => {
      validate({ value: 1 })
    }).to.throw('value must be a `array` type')

    expect(() => {
      validate({ value: { a: 'b' } })
    }).to.throw('value must be a `array` type')
  })

  it('should validate `arrayOf: "any"` arrays (`required: false`)', function() {
    const schema = {
      value: {
        arrayOf: 'any',
        description: 'Any array',
        required: false
      }
    }

    const validate = schemaValidation(schema)

    validate({ value: [1, 2] })
    validate({ value: ['a', 'b'] })
    validate({})

    expect(() => {
      validate({ value: 'a' })
    }).to.throw('value must be a `array` type')

    expect(() => {
      validate({ value: 1 })
    }).to.throw('value must be a `array` type')

    expect(() => {
      validate({ value: { a: 'b' } })
    }).to.throw('value must be a `array` type')
  })

  it('should validate `schema: {}` objects', function() {
    const schema = {
      value: {
        schema: {},
        description: 'Any object'
      }
    }

    const validate = schemaValidation(schema)

    validate({ value: { a: 'b' } })

    expect(() => {
      validate({ value: 1 })
    }).to.throw('value must be a `object` type')

    expect(() => {
      validate({ value: 'a' })
    }).to.throw('value must be a `object` type')

    expect(() => {
      validate({ value: [1, 2] })
    }).to.throw('value must be a `object` type')

    expect(() => {
      validate({ value: ['a', 'b'] })
    }).to.throw('value must be a `object` type')
  })

  it('should validate `schema: {}` objects (`required: false`)', function() {
    const schema = {
      value: {
        schema: {},
        description: 'Any object',
        required: false
      }
    }

    const validate = schemaValidation(schema)

    validate({ value: { a: 'b' } })
    validate({})

    expect(() => {
      validate({ value: 1 })
    }).to.throw('value must be a `object` type')

    expect(() => {
      validate({ value: 'a' })
    }).to.throw('value must be a `object` type')

    expect(() => {
      validate({ value: [1, 2] })
    }).to.throw('value must be a `object` type')

    expect(() => {
      validate({ value: ['a', 'b'] })
    }).to.throw('value must be a `object` type')
  })
});
