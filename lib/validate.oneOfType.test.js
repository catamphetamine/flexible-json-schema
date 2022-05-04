import schemaValidation from './validate.js';

describe('validate', function() {
  it('should validate `oneOfType` properties', function() {
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

    const validate = schemaValidation(schema)

    validate({
      booleanOrStringOrArrayOrObject: true
    })

    validate({
      booleanOrStringOrArrayOrObject: false
    })

    validate({
      booleanOrStringOrArrayOrObject: 'x'
    })

    validate({
      booleanOrStringOrArrayOrObject: ['x', 'y']
    })

    validate({
      booleanOrStringOrArrayOrObject: {
        formula: 'E = mc²'
      }
    })

    expect(() => validate({
      booleanOrStringOrArrayOrObject: {
        formula: true
      }
    })).to.throw('must be a `string`')

    expect(() => validate({
      booleanOrStringOrArrayOrObject: {
        a: 'b'
      }
    })).to.throw('Value doesn\'t match any of the possible types')

    expect(() => validate({
      booleanOrStringOrArrayOrObject: 123
    })).to.throw('Value doesn\'t match any of the possible types')

    expect(() => validate({
      booleanOrStringOrArrayOrObject: 'string'
    })).to.throw('must be one of')

    expect(() => validate({
      booleanOrStringOrArrayOrObject: ['a', 'b']
    })).to.throw('must be one of')
  })

  it('should use match objects without "when"', function() {
    const schema = {
      anObject: {
        oneOfType: [
          {
            is: 'object',
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object',
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
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      anObject: {
        a: 'a'
      }
    })
  })

  it('should match multiple object type variations', function() {
    const schema = {
      ambiguousObject: {
        oneOfType: [
          {
            is: 'object',
            schema: {
              a: {
                type: 'string',
                description: 'String'
              },
              b: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object',
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
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    expect(() => {
      validate({
        ambiguousObject: {
          a: 'a',
          b: 'b'
        }
      })
    }).to.throw('Value matches multiple `oneOfType` types')
  })

  it('should throw on ambiguity', function() {
    const schema = {
      ambiguous: {
        description: 'This is ambiguous',
        oneOfType: [
          {
            is: 'object',
            when: {
              a: 'b'
            },
            schema: {}
          },
          {
            is: 'object',
            when: {
              c: 'd'
            },
            schema: {}
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    expect(() => validate({
      ambiguous: {
        a: 'b',
        c: 'd'
      }
    })).to.throw('Value matches multiple `oneOfType` types')
  })

  it('should work with `required: true`', function() {
    const schema = {
      unrelated: {
        type: 'string',
        description: 'String'
      },
      stringOrNumber: {
        description: 'String or Number',
        oneOfType: [
          {
            is: 'string',
            type: 'string',
            // Ignored.
            required: false
          },
          {
            is: 'number',
            type: 'number',
            // Ignored.
            required: false
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      unrelated: '...',
      stringOrNumber: 123
    })

    expect(() => {
      validate({
        unrelated: '...'
      })
    }).to.throw('is a required field')
  })

  it('should work with `required: false`', function() {
    const schema = {
      unrelated: {
        type: 'string',
        description: 'String'
      },
      stringOrNumber: {
        description: 'String or Number',
        required: false,
        oneOfType: [
          {
            is: 'string',
            type: 'string',
            // Ignored.
            required: true
          },
          {
            is: 'number',
            type: 'number',
            // Ignored.
            required: true
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      unrelated: '...',
      stringOrNumber: 123
    })

    validate({
      unrelated: '...'
    })
  })

  it('should validate arrays of objects', function() {
    const schema = {
      property: {
        oneOfType: [
          {
            is: 'object[]',
            when: {
              a: 'a'
            },
            description: 'An array of objects',
            arrayOf: {
              schema: {}
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      property: [
        {
          a: 'a',
          b: 'b'
        },
        {
          a: 'a',
          c: 'c'
        }
      ]
    })

    expect(() => {
      validate({
        property: [
          {
            b: 'b'
          }
        ]
      })
    }).to.throw('Value doesn\'t match any of the possible types')

    expect(() => {
      validate({
        property: {
          a: 'a'
        }
      })
    }).to.throw('Value doesn\'t match any of the possible types')
  })

  it('should validate dates', function() {
    const schema = {
      dateOrObject: {
        description: 'Date or Object',
        oneOfType: [
          {
            is: 'date',
            type: 'date'
          },
          {
            is: 'object',
            schema: {}
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      dateOrObject: new Date('2000-01-01T00:00:00.000Z')
    })
  })

  it('should validate dates (string)', function() {
    const schema = {
      dateOrObject: {
        description: 'Date or Object',
        oneOfType: [
          {
            is: 'date',
            type: 'date'
          },
          {
            is: 'object',
            schema: {}
          }
        ]
      }
    }

    const validate = schemaValidation(schema, {
      dateStrings: true
    })

    validate({
      dateOrObject: '2000-01-01T00:00:00.000Z'
    })
  })

  it('should validate dates (string in "yyyy-mm-dd" format)', function() {
    const schema = {
      dateOrObject: {
        description: 'Date or Object',
        oneOfType: [
          {
            is: 'date',
            type: 'date'
          },
          {
            is: 'object',
            schema: {}
          }
        ]
      }
    }

    const validate = schemaValidation(schema, {
      dateFormat: 'yyyy-mm-dd',
      dateStrings: true
    })

    validate({
      dateOrObject: '2000-01-01'
    })
  })
})
