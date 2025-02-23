import schemaValidation from './validate.js';

describe('validate/oneOfType', function() {
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
              oneOf: ["x", "y", "z"],
              description: "Can be one of: 'x', 'y', 'z'"
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
        description: 'An object',
        oneOfType: [
          {
            is: 'object',
            description: 'Object',
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object',
            description: 'Object with a `b` property',
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

  it('should match objects\' nested properties using "when"', function() {
    const schema = {
      anObject: {
        description: 'Object with a `b.a` property',
        oneOfType: [
          {
            is: 'object',
            description: 'Object',
            when: {
              b: {
                a: {
                  $exists: true
                }
              }
            },
            schema: {
              b: {
                a: {
                  type: 'string',
                  description: 'String'
                }
              }
            }
          },
          {
            is: 'object',
            description: 'Object with a `b.c` property',
            when: {
              b: {
                c: {
                  $exists: true
                }
              }
            },
            schema: {
              b: {
                c: {
                  type: 'string',
                  description: 'String'
                }
              }
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      anObject: {
        b: {
          a: 'a'
        }
      }
    })

    validate({
      anObject: {
        b: {
          c: 'c'
        }
      }
    })

    expect(() => {
      validate({
        anObject: {
          b: {
            b: 'b'
          }
        }
      })
    }).to.throw('Value doesn\'t match any of the possible types')
  })

  it('should match `is` ("$notOneOf")', function() {
    const schema = {
      anObject: {
        description: 'Object',
        oneOfType: [
          {
            is: 'object',
            description: 'Object',
            when: {
              a: {
                $notOneOf: ['a']
              }
            },
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object',
            description: 'Object',
            when: {
              a: 123
            },
            schema: {
              a: {
                type: 'number',
                description: 'Number'
              }
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      anObject: {
        a: 'b'
      }
    })

    expect(() => {
      validate({
        anObject: {
          a: 'a'
        }
      })
    }).to.throw('Value doesn\'t match any of the possible types')
  })

  it('should match items of an array (tests each element of an array)', function() {
    const schema = {
      objects: {
        description: 'Objects',
        oneOfType: [
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              a: {
                $exists: true
              }
            },
            arrayOf: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              b: {
                $exists: true
              }
            },
            arrayOf: {
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
      objects: [{
        a: 'a'
      }, {
        a: 'a'
      }]
    })

    validate({
      objects: [{
        b: 'b'
      }, {
        b: 'b'
      }]
    })

    expect(() => {
      validate({
        objects: [{
          a: 'a'
        }, {
          c: 'c'
        }]
      })
    }).to.throw('Value doesn\'t match any of the possible types')
  })

  it('should match empty arrays and not throw "ambiguous" error (explicit `nonEmpty: false` flag)', function() {
    const schema = {
      objects: {
        description: 'Objects',
        oneOfType: [
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              a: {
                $exists: true
              }
            },
            nonEmpty: false,
            arrayOf: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              b: {
                $exists: true
              }
            },
            nonEmpty: false,
            arrayOf: {
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

    validate({ objects: [] })
  })

  it('should match empty arrays and not throw "ambiguous" error (explicit `allowEmptyArrays: true` flag)', function() {
    const schema = {
      objects: {
        description: 'Objects',
        oneOfType: [
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              a: {
                $exists: true
              }
            },
            arrayOf: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              b: {
                $exists: true
              }
            },
            arrayOf: {
              b: {
                type: 'string',
                description: 'String'
              }
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema, { allowEmptyArrays: true })

    validate({ objects: [] })
  })

  it('should match empty arrays and not throw "ambiguous" error (explicit `allowEmptyArrays: true` flag with explicit `nonEmpty: true` flag)', function() {
    const schema = {
      objects: {
        description: 'Objects',
        oneOfType: [
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              a: {
                $exists: true
              }
            },
            nonEmpty: true,
            arrayOf: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object[]',
            description: 'Objects',
            when: {
              b: {
                $exists: true
              }
            },
            nonEmpty: true,
            arrayOf: {
              b: {
                type: 'string',
                description: 'String'
              }
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema, { allowEmptyArrays: true })

    expect(() => {
      validate({ objects: [] })
    }).to.throw('ambiguous')
  })

  it('should match `is` ("$is")', function() {
    const schema = {
      anObject: {
        description: 'Object',
        oneOfType: [
          {
            is: 'object',
            description: 'Object',
            when: {
              a: {
                $is: 'string'
              }
            },
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object',
            description: 'Object',
            when: {
              a: {
                $is: 'number'
              }
            },
            schema: {
              a: {
                type: 'number',
                description: 'Number'
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

    validate({
      anObject: {
        a: 1
      }
    })

    expect(() => {
      validate({
        anObject: {
          a: true
        }
      })
    }).to.throw('Value doesn\'t match any of the possible types')
  })

  it('should match multiple object type variations', function() {
    const schema = {
      ambiguousObject: {
        description: 'Ambiguous object',
        oneOfType: [
          {
            is: 'object',
            description: 'Object',
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
            description: 'Object',
            when: {
              a: 'b'
            },
            schema: {
              a: {
                type: 'string',
                description: 'String'
              },
              c: {
                type: 'string',
                description: 'String'
              }
            }
          },
          {
            is: 'object',
            description: 'Object',
            when: {
              c: 'd'
            },
            schema: {
              a: {
                type: 'string',
                description: 'String'
              },
              c: {
                type: 'string',
                description: 'String'
              }
            }
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
            description: 'String',
            // Ignored.
            required: false
          },
          {
            is: 'number',
            type: 'number',
            description: 'Number',
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
            description: 'String',
            // Ignored.
            required: true
          },
          {
            is: 'number',
            type: 'number',
            description: 'Number',
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
        description: 'One of Type',
        oneOfType: [
          {
            is: 'object[]',
            when: {
              a: 'a'
            },
            description: 'An array of objects',
            arrayOf: {
              description: 'An object',
              schema: {
                a: {
                  type: 'string',
                  description: 'String'
                },
                b: {
                  type: 'string',
                  description: 'String',
                  required: false
                },
                c: {
                  type: 'string',
                  description: 'String',
                  required: false
                }
              }
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

  it('should validate non-required `oneOfType` properties having `null` value', function() {
    const schema = {
      stringOrObject: {
        description: 'String or Object',
        required: false,
        schema: {
          description: 'String or Object',
          oneOfType: [
            {
              is: 'string',
              type: 'string',
              description: 'String'
            },
            {
              is: 'object',
              description: 'Object',
              schema: {
                a: {
                  type: 'string',
                  description: 'String'
                }
              }
            }
          ]
        }
      }
    }

    const validate = schemaValidation(schema)

    validate({ stringOrObject: null })
    validate({ stringOrObject: undefined })
    validate({ stringOrObject: 'a' })
  })

  it('should validate `oneOfType` properties defined as an object schema having a `type` property', function() {
    const schema = {
      stringOrObject: {
        description: 'String or Object',
        oneOfType: [
          {
            is: 'string',
            description: 'String',
            type: 'string'
          },
          {
            is: 'object',
            description: 'Object',
            schema: {
              type: {
                type: 'string',
                description: 'String'
              }
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({ stringOrObject: { type: 'test' } })
  })

  it('should validate dates', function() {
    const schema = {
      dateOrObject: {
        description: 'Date or Object',
        oneOfType: [
          {
            is: 'date',
            type: 'date',
            description: 'Date'
          },
          {
            is: 'object',
            description: 'object',
            schema: {
              a: {
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
            type: 'date',
            description: 'Date'
          },
          {
            is: 'object',
            description: 'Object',
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
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
            type: 'date',
            description: 'Date'
          },
          {
            is: 'object',
            description: 'Object',
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
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

  it('should validate `is: "any[]"` and nested `oneOfType`', function() {
    const schema = {
      array: {
        description: 'Array',
        oneOfType: [
          {
            is: 'string[]',
            arrayOf: 'string',
            description: 'String'
          },
          {
            is: 'any[]',
            description: 'Array of strings or numbers',
            arrayOf: {
              description: 'String or Number',
              oneOfType: [
                {
                  is: 'string',
                  type: 'string',
                  description: 'String'
                },
                {
                  is: 'number',
                  type: 'number',
                  description: 'Number'
                }
              ]
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema)

    validate({
      array: ['a', 1]
    })

    expect(() => {
      validate({
        array: ['a', 'b']
      })
    }).to.throw('Value matches multiple')

    expect(() => {
      validate({
        array: ['a', 1, true]
      })
    }).to.throw('Value doesn\'t match any of the possible types')
  })

  it('should validate immediately nested `oneOfType` (nested `oneOfType`)', function() {
    const schema = {
      description: 'One of type',
      oneOfType: [
        {
          is: 'string',
          description: 'String',
          type: 'string'
        },
        {
          is: 'object',
          description: 'Object',
          oneOfType: [{
            is: 'object',
            description: 'Object',
            schema: {
              a: {
                type: 'string',
                description: 'String'
              }
            }
          }]
        }
      ]
    }

    const validate = schemaValidation(schema)

    validate({
      a: 'a'
    })
  })

  it('should validate immediately nested `oneOfType` (nested `schema.oneOfType`)', function() {
    const schema = {
      description: 'One of type',
      oneOfType: [
        {
          is: 'string',
          description: 'String',
          type: 'string'
        },
        {
          is: 'object',
          description: 'Object',
          schema: {
            description: 'Nested one of type',
            oneOfType: [{
              is: 'object',
              description: 'Object',
              schema: {
                a: {
                  type: 'string',
                  description: 'String'
                }
              }
            }]
          }
        }
      ]
    }

    const validate = schemaValidation(schema)

    validate({
      a: 'a'
    })
  })

  it('should validate immediately nested `oneOfType` (nested `schema.schema.oneOfType`)', function() {
    const schema = {
      description: 'One of type',
      oneOfType: [
        {
          is: 'string',
          description: 'String',
          type: 'string'
        },
        {
          is: 'object',
          description: 'Object',
          schema: {
            description: 'Nested one of type',
            oneOfType: [{
              is: 'object',
              description: 'Object',
              // These two nested `schema`s will automatically be merged into one.
              schema: {
                description: 'Object',
                schema: {
                  a: {
                    type: 'string',
                    description: 'String'
                  }
                }
              }
            }]
          }
        }
      ]
    }

    const validate = schemaValidation(schema)

    validate({
      a: 'a'
    })
  })

  it('should validate `oneOfType` that references a named schema that results in an immediately-nested `oneOfType`', function() {
    const recordSchema = {
      description: 'Record',
      oneOfType: [{
        is: 'object',
        description: 'Record',
        schema: {
          id: {
            type: 'number',
            description: 'ID'
          }
        }
      }]
    }

    const schema = {
      description: 'Record or Other',
      oneOfType: [{
        is: 'object',
        when: {
          someOtherProperty: {
            $exists: false
          }
        },
        description: 'Record',
        schema: 'record'
      }, {
        is: 'object',
        when: {
          someOtherProperty: {
            '$exists': true
          }
        },
        description: 'Other',
        schema: {}
      }]
    }

    const validate = schemaValidation(schema, {
      schemas: { record: recordSchema }
    })

    // It would've thrown a "this must be one of the following values: " error
    // if immediately-nested `oneOfTypes` weren't handled.
    validate({
      id: 1
    });
  })
})
