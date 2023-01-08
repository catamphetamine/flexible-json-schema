import schemaValidation from './validate.js';

describe('validate', function() {
  it('shouldn\'t allow empty strings', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String'
      }
    });

    validate({ a: 'a' });
    expect(() => validate({ a: '' })).to.throw('must be at least 1 characters');
  });

  it('should not allow empty strings when `allowEmptyStrings` is `true` and `required` is `true`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String'
      }
    }, {
      allowEmptyStrings: true
    });

    validate({ a: 'a' });
    expect(() => validate({ a: '' })).to.throw('required');
  });

  it('should allow empty strings when `allowEmptyStrings` is `true` and `required` is `false`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String',
        required: false
      }
    }, {
      allowEmptyStrings: true
    });

    validate({ a: 'a' });
    validate({ a: '' });
  });

  it('should allow `null` or `undefined` when not `required`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String',
        required: false
      }
    }, {
      allowEmptyStrings: true
    });

    validate({ a: undefined });
    validate({ a: null })
  });

  it('shouldn\'t allow empty arrays', function() {
    const validate = schemaValidation({
      a: {
        arrayOf: 'string',
        description: 'Strings'
      }
    });

    validate({ a: ['a'] });
    expect(() => validate({ a: [] })).to.throw('must have at least 1 items');
  });

  it('should allow empty arrays when `allowEmptyArrays` is `true`', function() {
    const validate = schemaValidation({
      a: {
        arrayOf: 'string',
        description: 'Strings'
      }
    }, {
      allowEmptyArrays: true
    });

    validate({ a: ['a'] });
    validate({ a: [] });
  });

  it('should allow empty arrays when `nonEmpty` is `false`', function() {
    const validate = schemaValidation({
      a: {
        arrayOf: 'string',
        description: 'Strings',
        nonEmpty: false
      }
    });

    validate({ a: ['a'] });
    validate({ a: [] });
  });

  it('should allow empty arrays when `allowEmptyArrays` is `true` and `nonEmpty` is `false`', function() {
    const validate = schemaValidation({
      a: {
        arrayOf: 'string',
        description: 'Strings',
        nonEmpty: false
      }
    }, {
      allowEmptyArrays: true
    });

    validate({ a: ['a'] });
    validate({ a: [] });
  });

  it('should support `objectOf` type', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: "number",
        description: "Numbers"
      }
    });

    validate({
      stats: {
        a: 1.25,
        b: 2.40,
        c: 4.10
      }
    });
  });

  it('should support `objectOf` type (nested objects)', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: {
          x: {
            type: "number",
            description: "Number"
          }
        },
        description: "Numbers"
      }
    });

    validate({
      stats: {
        a: {
          x: 1.25
        },
        b: {
          x: 2.40
        },
        c: {
          x: 4.10
        }
      }
    });
  });

  it('should support "dateString" type', function() {
    const validate = schemaValidation({
      a: {
        type: 'dateString',
        description: 'Date string'
      }
    });

    validate({ a: '2020-01-01T00:00:00.000Z' });
    expect(() => validate({ a: new Date() })).to.throw('must be a `string` type');
    expect(() => validate({ a: '2020-01-01' })).to.throw('must be exactly 24 characters');
    expect(() => validate({ a: 'a' })).to.throw('must be exactly 24 characters');
    expect(() => validate({ a: '' })).to.throw('must be exactly 24 characters');
    expect(() => validate({ a: '' })).to.throw('must be exactly 24 characters');
  });

  it('should support "date" type', function() {
    const validate = schemaValidation({
      a: {
        type: 'date',
        description: 'Date'
      }
    });

    validate({ a: new Date() });
    expect(() => validate({ a: '2020-01-01T00:00:00.000Z' })).to.throw('must be a `date` type');
    expect(() => validate({ a: 'a' })).to.throw('must be a `date` type');
    expect(() => validate({ a: '' })).to.throw('must be a `date` type');
  });

  it('should support "date" type (`dateStrings: true`)', function() {
    const validate = schemaValidation({
      a: {
        type: 'date',
        description: 'Date'
      }
    }, {
      dateStrings: true
    });

    validate({ a: '2020-01-01T00:00:00.000Z' });
    expect(() => validate({ a: '2020-01-01' })).to.throw('must be exactly');
    expect(() => validate({ a: new Date() })).to.throw('must be a `string` type');
    expect(() => validate({ a: 'a' })).to.throw('must be exactly');
    expect(() => validate({ a: '' })).to.throw('must be exactly');
  });

  it('should support "date" type (`dateStrings: true` and `dateFormat: "yyyy-mm-dd"`)', function() {
    const validate = schemaValidation({
      a: {
        type: 'date',
        description: 'Date'
      }
    }, {
      dateStrings: true,
      dateFormat: 'yyyy-mm-dd'
    });

    validate({ a: '2020-01-01' });
    expect(() => validate({ a: '2020-01-01T00:00:00.000Z' })).to.throw('must be exactly');
    expect(() => validate({ a: new Date() })).to.throw('must be a `string` type');
    expect(() => validate({ a: 'a' })).to.throw('must be exactly');
    expect(() => validate({ a: '' })).to.throw('must be exactly');
  });

  it('should convert values of "date" type (`convertDates: true`)', function() {
    const validate = schemaValidation({
      a: {
        type: 'date',
        description: 'Date'
      }
    }, {
      convertDates: true
    });

    const data = { a: '2020-01-01T00:00:00.000Z' };
    validate(data);
    expect(data.a instanceof Date).to.equal(true);

    expect(() => validate({ a: '2020-01-01' })).to.throw('must be exactly');
    expect(() => validate({ a: new Date() })).to.throw('must be a `string` type');
    expect(() => validate({ a: 'a' })).to.throw('must be exactly');
    expect(() => validate({ a: '' })).to.throw('must be exactly');
  });

  it('should convert values of "date" type (`convertDates: true` and `dateFormat: "yyyy-mm-dd"`)', function() {
    const validate = schemaValidation({
      a: {
        type: 'date',
        description: 'Date'
      }
    }, {
      convertDates: true,
      dateFormat: 'yyyy-mm-dd'
    });

    const data = { a: '2020-01-01' };
    validate(data);
    expect(data.a instanceof Date).to.equal(true);

    expect(() => validate({ a: '2020-01-01T00:00:00.000Z' })).to.throw('must be exactly');
    expect(() => validate({ a: new Date() })).to.throw('must be a `string` type');
    expect(() => validate({ a: 'a' })).to.throw('must be exactly');
    expect(() => validate({ a: '' })).to.throw('must be exactly');
  });

  it('should support required parameter', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: '...',
        required: false
      },
      b: {
        type: 'string',
        description: '...'
      }
    });

    validate({ a: 'a', b: 'b' });
    validate({ b: 'b' });
    expect(() => validate({ a: 'a' })).to.throw('required');
  });

  it('should support conditional required parameter', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: '...',
        required: false
      },
      b: {
        type: 'string',
        description: '...'
      },
      c: {
        type: 'string',
        description: '...',
        required: {
          when: {
            a: {
              $exists: true
            },
            b: {
              $exists: true
            }
          }
        }
      },
      d: {
        type: 'string',
        description: '...',
        required: false
      }
    });

    validate({ b: 'b' });
    validate({ b: 'b', d: 'd' });
    expect(() => validate({ a: 'a', b: 'b', d: 'd' })).to.throw('required');
    validate({ a: 'a', b: 'b', c: 'c', d: 'd' });
  });

  it('should support "when not present" required parameter', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: '...',
        required: false
      },
      b: {
        type: 'string',
        description: '...'
      },
      c: {
        type: 'string',
        description: '...',
        required: {
          when: {
            a: {
              $exists: false
            }
          }
        }
      },
      d: {
        type: 'string',
        description: '...',
        required: false
      }
    });

    validate({ a: 'a', b: 'b' });
    expect(() => validate({ b: 'b' })).to.throw('required');
    validate({ a: 'a', b: 'b', c: 'c' });
  });

  it('should support conditional required parameter with a value', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: '...',
        required: false
      },
      b: {
        type: 'string',
        description: '...'
      },
      c: {
        type: 'string',
        description: '...',
        required: {
          when: {
            a: 'a1',
            b: 'b1'
          }
        }
      },
      d: {
        type: 'string',
        description: '...',
        required: false
      }
    });

    validate({ b: 'b' });
    validate({ b: 'b', d: 'd' });
    expect(() => validate({ a: 'a1', b: 'b1', d: 'd' })).to.throw('required');
    validate({ a: 'a1', b: 'b1', c: 'c', d: 'd' });
  });

  it('should support "oneOf" type', function() {
    const validate = schemaValidation({
      a: {
        oneOf: ['a1', 'a2'],
        description: '...'
      }
    });

    expect(() => validate({})).to.throw('required');
    validate({ a: 'a1' });
    expect(() => validate({ a: 'a3' })).to.throw('a must be one of the following values: a1, a2');
  });

  it('should support "oneOf" type with "required: false"', function() {
    const validate = schemaValidation({
      a: {
        oneOf: ['a1', 'a2'],
        description: '...',
        required: false
      }
    });

    validate({});
    validate({ a: 'a1' });
    expect(() => validate({ a: 'a3' })).to.throw('a must be one of the following values: a1, a2');
  });

  it('should support "oneOf" type with conditional required', function() {
    const validate = schemaValidation({
      a: {
        oneOf: ['a1', 'a2'],
        description: '...',
        required: {
          when: {
            b: {
              $exists: true
            }
          }
        }
      },
      b: {
        type: 'string',
        description: '...'
      }
    });

    expect(() => validate({ b: 'b' })).to.throw('required');
    validate({ a: 'a1', b: 'b' });
  });

  it('should validate simple values (`required: true`)', function() {
    const schema = {
      type: 'number',
      description: 'Number'
    }

    const validate = schemaValidation(schema)

    validate(123)
    expect(() => validate('123')).to.throw('must be a `number` type')
  })

  it('should validate simple values (`required: true`)', function() {
    const schema = {
      type: 'number',
      description: 'Number',
      required: false
    }

    const validate = schemaValidation(schema)

    validate(undefined)
    validate(null)
  })

  it('should validate `arrayOf` schema', function() {
    const schemas = {
      objects: {
        description: 'An array of objects',
        arrayOf: {
          schema: 'object'
        }
      },
      object: {
        description: 'Description',
        schema: {
          a: {
            type: 'string',
            description: 'Description'
          }
        }
      }
    }

    const schema = {
      schema: 'objects',
      description: 'Description'
    }

    const validate = schemaValidation(schema, { schemas })

    validate([{
      a: 'A'
    }])
  })

  it('should validate `arrayOf` schema (`oneOfType`)', function() {
    const schemas = {
      objects: {
        description: 'An array of objects',
        arrayOf: {
          schema: 'object'
        }
      },
      object: {
        description: 'Description',
        schema: 'oneOfTypeSchema'
      },
      oneOfTypeSchema: {
        description: 'Any of the object types',
        oneOfType: [
          {
            is: 'object',
            when: {
              a: {
                $exists: true
              }
            },
            description: 'Object',
            schema: {
              a: {
                type: 'string',
                description: 'Description'
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
            description: 'Object',
            schema: {
              b: {
                type: 'string',
                description: 'Description'
              }
            }
          }
        ]
      }
    }

    const schema = {
      schema: 'objects',
      description: 'Description'
    }

    const validate = schemaValidation(schema, { schemas })

    validate([{
      a: 'A'
    }])
  })

  it('should conditional required ($or)', function() {
    const schema = {
      a: {
        type: 'string',
        description: 'A',
        required: {
          when: {
            $or: [
              { b: 'b' },
              { c: 'c' }
            ]
          }
        }
      },
      b: {
        type: 'string',
        description: 'B',
        required: false
      },
      c: {
        type: 'string',
        description: 'C',
        required: false
      }
    }

    const validate = schemaValidation(schema)

    validate({ a: 'a' });
    validate({ a: 'a', b: 'b', c: 'c' })
    expect(() => validate({ b: 'b' })).to.throw('required');
    expect(() => validate({ c: 'c' })).to.throw('required');
    validate({ b: 'e' });
    validate({ c: 'a' });
    expect(() => validate({ b: 'b', 'c': 'c' })).to.throw('required');
    expect(() => validate({ b: 'b', c: 'a' })).to.throw('required');
    validate({ b: 'e', c: 'a' });
  })
});
