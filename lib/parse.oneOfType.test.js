import schemaParser from './parse.js';

describe('parse/oneOfType', function() {
  it('should parse `oneOfType` properties', function() {
    const schema = {
      booleanOrStringOrArrayOrObject: {
        description: "A boolean or an object with a formula.",
        oneOfType: [
          {
            // "boolean" here is a javascript `typeof` type.
            is: "boolean",
            type: "boolean",
            description: "Can be a boolean"
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

    const parse = schemaParser(schema, {
      inPlace: true
    })

    parse({
      booleanOrStringOrArrayOrObject: '1'
    }).should.deep.equal({
      booleanOrStringOrArrayOrObject: true
    })

    parse({
      booleanOrStringOrArrayOrObject: '0'
    }).should.deep.equal({
      booleanOrStringOrArrayOrObject: false
    })

    parse({
      booleanOrStringOrArrayOrObject: { formula: 'E = mc²' }
    }).should.deep.equal({
      booleanOrStringOrArrayOrObject: {
        formula: 'E = mc²'
      }
    })

    expect(() => parse({
      booleanOrStringOrArrayOrObject: { formula: 123 }
    })).to.throw('Expected value to be a string, got a number')

    expect(() => parse({
      booleanOrStringOrArrayOrObject: { a: 'b' }
    })).to.throw('No type variation fits the value')

    expect(() => parse({
      booleanOrStringOrArrayOrObject: '123'
    })).to.throw('Expected "boolean" value to be')

    expect(() => parse({
      booleanOrStringOrArrayOrObject: 'string'
    })).to.throw('Expected "boolean" value to be')

    expect(() => parse({
      booleanOrStringOrArrayOrObject: ['a', 'b']
    })).to.throw('No type variation fits the value')
  })

  it('should parse `oneOf` strings or arrays of `oneOf` strings', function() {
    const schema = {
      property: {
        description: 'A string or an array of strings',
        oneOfType: [
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
          }
        ]
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({
      property: 'x'
    })

    parse({
      property: ['x', 'y']
    })
  })

  it('should use match objects without "when"', function() {
    const schema = {
      anObject: {
        description: 'An object',
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

    const parse = schemaParser(schema, { inPlace: true })

    parse({
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

    const parse = schemaParser(schema, { inPlace: true })

    expect(() => {
      parse({
        ambiguousObject: {
          a: 'a',
          b: 'b'
        }
      })
    }).to.throw('More than one type variation fits the value')
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

    const parse = schemaParser(schema, { inPlace: true })

    expect(() => parse({
      ambiguous: {
        a: 'b',
        c: 'd'
      }
    })).to.throw('More than one type variation fits the value')
  })

  it('should parse arrays of objects', function() {
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

    const parse = schemaParser(schema, { inPlace: true })

    parse({
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
      parse({
        property: [
          {
            b: 'b'
          }
        ]
      })
    }).to.throw('No type variation fits the value')

    expect(() => {
      parse({
        property: {
          a: 'a'
        }
      })
    }).to.throw('No type variation fits the value')
  })

  it('should parse dates', function() {
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

    const parse = schemaParser(schema, { inPlace: true })

    const data = {
      dateOrObject: '2000-01-01T00:00:00.000Z'
    }

    parse(data)

    data.dateOrObject.toISOString().should.equal('2000-01-01T00:00:00.000Z')
  })

  it('should parse dates ("yyyy-mm-dd")', function() {
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

    const parse = schemaParser(schema, {
      inPlace: true,
      dateFormat: 'yyyy-mm-dd'
    })

    const data = {
      dateOrObject: '2000-01-01'
    }

    parse(data)

    data.dateOrObject.toISOString().should.equal('2000-01-01T00:00:00.000Z')
  })

  it('should parse `is: "any[]"` and nested `oneOfType`', function() {
    const schema = {
      array: {
        description: 'Array',
        oneOfType: [
          {
            is: 'string[]',
            arrayOf: 'string'
          },
          {
            is: 'any[]',
            arrayOf: {
              description: 'String or Number',
              oneOfType: [
                {
                  is: 'object',
                  schema: {
                    a: {
                      type: 'number',
                      description: 'Number'
                    }
                  }
                },
                {
                  is: 'number',
                  type: 'number'
                }
              ]
            }
          }
        ]
      }
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse({
      array: ['a', '1']
    }).should.deep.equal({
      array: ['a', '1']
    })

    parse({
      array: ['1', { a: '1' }]
    }).should.deep.equal({
      array: [1, { a: 1 }]
    })

    expect(() => {
      parse({
        array: ['a', { a: 'a' }]
      })
    }).to.throw('Expected a number')
  })

  it('should parse `oneOfType`: string or array or object (structure: "flat")', function() {
    const schema = {
      parameter: {
        description: 'Parameter',
        oneOfType: [
          {
            is: 'string',
            oneOf: ['stringValue']
          },
          {
            is: 'object',
            shape: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          },
          {
            is: 'object[]',
            arrayOf: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          }
        ]
      }
    }

    const parse = schemaParser(schema, { structure: 'flat' })

    parse({
      parameter: 'stringValue'
    }).should.deep.equal({
      parameter: 'stringValue'
    })

    parse({
      parameter: JSON.stringify([{ a: 'a', b: true }])
    }).should.deep.equal({
      parameter: [{ a: 'a', b: true }]
    })

    parse({
      parameter: JSON.stringify({ a: 'a', b: true })
    }).should.deep.equal({
      parameter: { a: 'a', b: true }
    })
  })

  it('should not parse ambiguous `oneOfType` declarations: string or array or object (structure: "flat")', function() {
    const schema = {
      parameter: {
        description: 'Parameter',
        oneOfType: [
          {
            is: 'string',
            type: 'string'
          },
          {
            is: 'object',
            shape: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          },
          {
            is: 'object[]',
            arrayOf: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          }
        ]
      }
    }

    const parse = schemaParser(schema, { structure: 'flat' })

    parse({
      parameter: 'stringValue'
    }).should.deep.equal({
      parameter: 'stringValue'
    })

    expect(() => {
      parse({
        parameter: '[stringValue]'
      }).should.deep.equal({
        parameter: '[stringValue]'
      })
    }).to.throw('ambiguous')

    expect(() => {
      parse({
        parameter: '{stringValue}'
      }).should.deep.equal({
        parameter: '{stringValue}'
      })
    }).to.throw('ambiguous')

    expect(() => {
      parse({
        parameter: JSON.stringify([{ a: 'a', b: true }])
      }).should.deep.equal({
        parameter: [{ a: 'a', b: true }]
      })
    }).to.throw('ambiguous')

    expect(() => {
      parse({
        parameter: JSON.stringify({ a: 'a', b: true })
      }).should.deep.equal({
        parameter: { a: 'a', b: true }
      })
    }).to.throw('ambiguous')
  })

  it('should not parse ambiguous `oneOfType` declarations: string or array or object (structure: "flat") (`oneOf` has a value starting with a "[")', function() {
    const schema = {
      parameter: {
        description: 'Parameter',
        oneOfType: [
          {
            is: 'string',
            oneOf: [
              '[stringValue]'
            ]
          },
          {
            is: 'object',
            shape: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          },
          {
            is: 'object[]',
            arrayOf: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          }
        ]
      }
    }

    const parse = schemaParser(schema, { structure: 'flat' })

    parse({
      parameter: 'stringValue'
    }).should.deep.equal({
      parameter: 'stringValue'
    })

    expect(() => {
      parse({
        parameter: '[stringValue]'
      }).should.deep.equal({
        parameter: '[stringValue]'
      })
    }).to.throw('ambiguous')

    expect(() => {
      parse({
        parameter: JSON.stringify([{ a: 'a', b: true }])
      }).should.deep.equal({
        parameter: [{ a: 'a', b: true }]
      })
    }).to.throw('ambiguous')

    parse({
      parameter: JSON.stringify({ a: 'a', b: true })
    }).should.deep.equal({
      parameter: { a: 'a', b: true }
    })
  })

  it('should not parse ambiguous `oneOfType` declarations: string or array or object (structure: "flat") (`oneOf` has a value starting with a "{")', function() {
    const schema = {
      parameter: {
        description: 'Parameter',
        oneOfType: [
          {
            is: 'string',
            oneOf: [
              '{stringValue}'
            ]
          },
          {
            is: 'object',
            shape: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          },
          {
            is: 'object[]',
            arrayOf: {
              a: {
                oneOf: ['a'],
                description: 'A'
              },
              b: {
                type: 'boolean',
                description: 'B'
              }
            }
          }
        ]
      }
    }

    const parse = schemaParser(schema, { structure: 'flat' })

    parse({
      parameter: 'stringValue'
    }).should.deep.equal({
      parameter: 'stringValue'
    })

    expect(() => {
      parse({
        parameter: '{stringValue}'
      }).should.deep.equal({
        parameter: '{stringValue}'
      })
    }).to.throw('ambiguous')

    parse({
      parameter: JSON.stringify([{ a: 'a', b: true }])
    }).should.deep.equal({
      parameter: [{ a: 'a', b: true }]
    })

    expect(() => {
      parse({
        parameter: JSON.stringify({ a: 'a', b: true })
      }).should.deep.equal({
        parameter: { a: 'a', b: true }
      })
    }).to.throw('ambiguous')
  })
})
