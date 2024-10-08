import schemaValidation from './validate.js';

describe('validate/extends', function() {
  it('should support `extends` schema (reference)', function() {
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

  it('should support `extends` schema (inline)', function() {
    const schema = {
      description: 'Extends',
      extends: {
        c: {
          type: 'string',
          description: 'String'
        }
      },
      schema: {
        a: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const validate = schemaValidation(schema)

    validate({ a: 'a', c: 'c' })
    expect(() => validate({ a: 'a', b: 'b', c: 'c' })).to.throw('unknown')
  })

  it('should support `extends` schema (inline) (oneOfType)', function() {
    const schema = {
      description: 'Extends + one of type',
      extends: {
        c: {
          type: 'string',
          description: 'String'
        }
      },
      oneOfType: [{
        is: 'object',
        description: 'Object',
        when: {
          a: {
            $exists: true
          }
        },
        schema: {
          a: {
            type: 'string',
            description: 'String'
          }
        }
      }, {
        is: 'object',
        description: 'Object',
        when: {
          b: {
            $exists: true
          }
        },
        schema: {
          b: {
            type: 'string',
            description: 'String'
          }
        }
      }]
    }

    const validate = schemaValidation(schema)

    validate({ a: 'a', c: 'c' })
    validate({ b: 'b', c: 'c' })
    expect(() => validate({ a: 'a' })).to.throw('required')
    expect(() => validate({ c: 'c' })).to.throw('unsupported')
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

  it('should only object schema extension when using `extends` and disallow primitive schema extension', function() {
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

    expect(() => schemaValidation(schema, { schemas })).to.throw('Expected `schema` definition to describe an object, not a primitive')
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

    expect(() => schemaValidation(schema, { schemas })).to.throw('Can only `extend` objects, not primitives')
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

  it('should support `extends` that itself uses `extends` (no `description`)', function() {
    const schema = {
      extends: 'ab',
      schema: 'c'
    }

    const schemas = {
      ab: {
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

    const validate = schemaValidation(schema, { schemas })

    validate({ a: 'a', b: 'b' })
    expect(() => validate({ a: 'a', c: 'c' })).to.throw('unknown')
  })
})
