import schemaValidation from './validate.js';

describe.only('validate', function() {
  it('should support `extends` schema', function() {
    const schema = {
      description: 'Extends',
      extends: 'c',
      schema: {
        a: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const schemas = {
      c: {
        c: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const validate = schemaValidation(schema, { schemas })

    validate({ a: 'a', c: 'c' })
    expect(() => validate({ a: 'a', b: 'b', c: 'c' })).to.throw('unknown')
  })

  it('should support `extends` schema (extension overwrites some properties)', function() {
    const schema = {
      description: 'Extends',
      extends: 'c',
      schema: {
        a: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const schemas = {
      c: {
        a: {
          type: 'number',
          description: 'number'
        },
        c: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const validate = schemaValidation(schema, { schemas })

    validate({ a: 'a', c: 'c' })
    expect(() => validate({ a: 1, c: 'c' })).to.throw('must be a `string')
    expect(() => validate({ a: 'a', b: 'b', c: 'c' })).to.throw('unknown')
  })

  it('should only object schema extension when using `extends`', function() {
    const schema = {
      description: 'Extends',
      extends: 'c',
      schema: {
        type: 'string',
        description: 'String'
      }
    }

    const schemas = {
      c: {
        c: {
          type: 'string',
          description: 'String'
        }
      }
    }

    expect(() => schemaValidation(schema, { schemas })).to.throw('`extends` can only be used along with a `schema` object')
  })

  it('should only use object schema reference in `extends`', function() {
    const schema = {
      description: 'Extends',
      extends: 'c',
      schema: {
        a: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const schemas = {
      c: {
        type: 'string',
        description: 'String'
      }
    }

    expect(() => schemaValidation(schema, { schemas })).to.throw('`extends` can only reference a schema of an object')
  })

  it('should support `extends` of a `schema` that itself uses `extends`', function() {
    const schema = {
      description: 'Extends',
      extends: 'c',
      schema: 'ab'
    }

    const schemas = {
      ab: {
        description: 'AB',
        extends: 'b',
        schema: {
          a: {
            type: 'string',
            description: 'String'
          }
        }
      },
      b: {
        b: {
          type: 'string',
          description: 'String'
        }
      },
      c: {
        c: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const validate = schemaValidation(schema, { schemas })

    validate({ a: 'a', b: 'b', c: 'c' })
    expect(() => validate({ a: 'a', b: 'b', c: 'c', d: 'd' })).to.throw('unknown')
  })

  it('should support `extends` that itself uses `extends`', function() {
    const schema = {
      description: 'Extends',
      extends: 'ab',
      schema: 'c'
    }

    const schemas = {
      ab: {
        description: 'AB',
        extends: 'b',
        schema: {
          a: {
            type: 'string',
            description: 'String'
          }
        }
      },
      b: {
        b: {
          type: 'string',
          description: 'String'
        }
      },
      c: {
        c: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const validate = schemaValidation(schema, { schemas })

    validate({ a: 'a', b: 'b', c: 'c' })
    expect(() => validate({ a: 'a', b: 'b', c: 'c', d: 'd' })).to.throw('unknown')
  })

  it('should only allow using `extends` along an "inline" `schema` object', function() {
    const schema = {
      description: 'Extends',
      extends: 'b',
      schema: {
        description: 'a',
        schema: {
          a: {
            type: 'string',
            description: 'String'
          }
        }
      }
    }

    const schemas = {
      b: {
        b: {
          type: 'string',
          description: 'String'
        }
      }
    }

    expect(() => schemaValidation(schema, { schemas })).to.throw('`extends` can only be used along with a `schema` object or a `schema` reference')
  })
})
