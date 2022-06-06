import schemaParser from './parse.js';

describe('parse/any', function() {
  it('should parse `type: "any"` values', function() {
    const schema = {
      value: {
        type: 'any',
        description: 'Any'
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({ value: 'a' }).should.deep.equal({ value: 'a' })
    parse({ value: '1' }).should.deep.equal({ value: '1' })
    parse({ value: ['a', 'b'] })
    parse({ value: ['1', '2'] })
    parse({ value: { a: 'b' } })
  })

  it('should parse `type: "any"` values (`required: false`)', function() {
    const schema = {
      value: {
        type: 'any',
        description: 'Any',
        required: false
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({ value: 'a' }).should.deep.equal({ value: 'a' })
    parse({ value: '1' }).should.deep.equal({ value: '1' })
    parse({ value: ['a', 'b'] })
    parse({ value: ['1', '2'] })
    parse({ value: { a: 'b' } })
    parse({}).should.deep.equal({})
  })

  it('should parse `arrayOf: "any"` arrays', function() {
    const schema = {
      value: {
        arrayOf: 'any',
        description: 'Any array'
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({ value: ['1', '2'] }).should.deep.equal({ value: ['1', '2'] })
    parse({ value: ['a', 'b'] }).should.deep.equal({ value: ['a', 'b'] })

    expect(() => {
      parse({ value: 'a' })
    }).to.throw('Expected an array')

    expect(() => {
      parse({ value: '1' })
    }).to.throw('Expected an array')

    expect(() => {
      parse({ value: { a: 'b' } })
    }).to.throw('Expected an array')
  })

  it('should parse `arrayOf: "any"` arrays (`required: false`)', function() {
    const schema = {
      value: {
        arrayOf: 'any',
        description: 'Any array',
        required: false
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({ value: ['1', '2'] }).should.deep.equal({ value: ['1', '2'] })
    parse({ value: ['a', 'b'] }).should.deep.equal({ value: ['a', 'b'] })
    parse({}).should.deep.equal({})

    expect(() => {
      parse({ value: 'a' })
    }).to.throw('Expected an array')

    expect(() => {
      parse({ value: '1' })
    }).to.throw('Expected an array')

    expect(() => {
      parse({ value: { a: 'b' } })
    }).to.throw('Expected an array')
  })

  it('should parse `schema: {}` objects', function() {
    const schema = {
      value: {
        schema: {},
        description: 'Any object'
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({ value: { a: 'b' } }).should.deep.equal({ value: { a: 'b' } })
    parse({ value: { a: '1' } }).should.deep.equal({ value: { a: '1' } })

    expect(() => {
      parse({ value: 'a' })
    }).to.throw('Expected an object')

    expect(() => {
      parse({ value: '1' })
    }).to.throw('Expected an object')

    expect(() => {
      parse({ value: ['a', 'b'] })
    }).to.throw('Expected an object')

    expect(() => {
      parse({ value: ['1', '2'] })
    }).to.throw('Expected an object')
  })

  it('should parse `schema: {}` objects (`required: false`)', function() {
    const schema = {
      value: {
        schema: {},
        description: 'Any object',
        required: false
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({ value: { a: 'b' } }).should.deep.equal({ value: { a: 'b' } })
    parse({ value: { a: '1' } }).should.deep.equal({ value: { a: '1' } })
    parse({}).should.deep.equal({})

    expect(() => {
      parse({ value: 'a' })
    }).to.throw('Expected an object')

    expect(() => {
      parse({ value: '1' })
    }).to.throw('Expected an object')

    expect(() => {
      parse({ value: ['a', 'b'] })
    }).to.throw('Expected an object')

    expect(() => {
      parse({ value: ['1', '2'] })
    }).to.throw('Expected an object')
  })
});
