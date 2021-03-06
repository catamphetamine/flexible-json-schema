import schemaParser from './parse.js';

// import { useCustomTypes } from './validate/types/index.js';
// import { number } from './core.js';

describe('parse', function() {
  it('should parse values from strings', function() {
    const data = {
      bool1: '✓',
      bool2: '0',
      bool3: '1',
      date1: '2021-08-16T19:07:35.400Z'
    };

    const parse = schemaParser({
      bool1: {
        type: 'boolean',
        description: 'Boolean'
      },
      bool2: {
        type: 'boolean',
        description: 'Boolean'
      },
      bool3: {
        type: 'boolean',
        description: 'Boolean'
      },
      date1: {
        type: 'date',
        description: 'Date'
      }
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      bool1: true,
      bool2: false,
      bool3: true,
      date1: new Date('2021-08-16T19:07:35.400Z')
    });
  });

  it('should parse dates', function() {
    const data = {
      date: '2021-08-16T19:07:35.400Z'
    };

    const parse = schemaParser({
      date: {
        type: 'date',
        description: 'Date'
      }
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      date: new Date('2021-08-16T19:07:35.400Z')
    });
  });

  it('should parse `null`s', function() {
    const data = {
      bool: null,
      date: null
    };

    const parse = schemaParser({
      bool: {
        type: 'boolean',
        description: 'Boolean',
        required: false
      },
      date: {
        type: 'date',
        description: 'Date',
        required: false
      }
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      bool: null,
      date: null
    });
  });

  it('should "parse dates only"', function() {
    const data = {
      bool1: '✓',
      bool2: '0',
      bool3: '1',
      date1: '2021-08-16T19:07:35.400Z'
    };

    const parse = schemaParser({
      bool1: {
        type: 'boolean',
        description: 'Boolean'
      },
      bool2: {
        type: 'boolean',
        description: 'Boolean'
      },
      bool3: {
        type: 'boolean',
        description: 'Boolean'
      },
      date1: {
        type: 'date',
        description: 'Date'
      }
    }, {
      parseDatesOnly: true,
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      bool1: '✓',
      bool2: '0',
      bool3: '1',
      date1: new Date('2021-08-16T19:07:35.400Z')
    });
  });

  it('should "parse dates only" (null)', function() {
    const data = {
      bool: '✓',
      date: null
    };

    const parse = schemaParser({
      bool: {
        type: 'boolean',
        description: 'Boolean'
      },
      date: {
        type: 'date',
        description: 'Date',
        required: false
      }
    }, {
      parseDatesOnly: true,
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      bool: '✓',
      date: null
    });
  });

  it('should parse dates in "yyyy-mm-dd" format', function() {
    const data = {
      date: '2000-01-01'
    };

    const parse = schemaParser({
      date: {
        type: 'date',
        description: 'Date'
      }
    }, {
      dateFormat: 'yyyy-mm-dd',
      structure: 'flat'
    });

    const date_ = new Date(2000, 0, 1);
    // Fix local time zone offset.
    const date = new Date(date_.getTime() - date_.getTimezoneOffset() * 60 * 1000);

    parse(data).date.getTime().should.equal(date.getTime());
  });

  it('should parse arrays', function() {
    const data = {
      booleans: '["✓","0","1"]',
      strings: '["a","b","c"]',
      numbers: '["1","2","3"]'
    };

    const parse = schemaParser({
      booleans: {
        arrayOf: 'boolean',
        description: 'Booleans'
      },
      strings: {
        arrayOf: 'string',
        description: 'Strings'
      },
      numbers: {
        arrayOf: 'number',
        description: 'Numbers'
      }
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      booleans: [true, false, true],
      strings: ['a', 'b', 'c'],
      numbers: [1, 2, 3]
    });
  });

  it('should parse oneOf', function() {
    const data = {
      string: 'a'
    };

    const parse = schemaParser({
      string: {
        oneOf: ['a', 'b', 'c', 'd'],
        description: 'String'
      },
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      string: 'a'
    });
  });

  it('should parse arrayOf(oneOf)', function() {
    const data = {
      strings: '["a","b","c"]'
    };

    const parse = schemaParser({
      strings: {
        arrayOf: {
          oneOf: ['a', 'b', 'c', 'd'],
          description: 'A letter'
        },
        description: 'Strings'
      },
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      strings: ['a', 'b', 'c']
    });
  });

  it('should parse nested objects', function() {
    const data = {
      object: {
        a: {
          b: 'c',
          d: '1'
        }
      }
    };

    const parse = schemaParser({
      object: {
        a: {
          b: {
            type: 'string',
            description: 'String'
          },
          d: {
            type: 'boolean',
            description: 'Boolean'
          }
        }
      }
    }, {
      inPlace: true
    });

    parse(data);
    data.should.deep.equal({
      object: {
        a: {
          b: 'c',
          d: true
        }
      }
    });
  });

  it('should parse nested objects (from query)', function() {
    const data = {
      object: JSON.stringify({ a: { b: 'c' } })
    };

    const parse = schemaParser({
      object: {
        a: {
          b: {
            type: 'string',
            description: 'String'
          }
        }
      }
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      object: {
        a: {
          b: 'c'
        }
      }
    });
  });

  it('should parse simple values (`required: true`)', function() {
    const schema = {
      type: 'number',
      description: 'Number'
    }

    const parse = schemaParser(schema)

    parse('123').should.equal(123)
    expect(() => parse('a')).to.throw('Expected a number')
  })

  it('should parse simple values (`required: true`)', function() {
    const schema = {
      type: 'number',
      description: 'Number',
      required: false
    }

    const parse = schemaParser(schema)

    expect(parse(undefined)).to.be.undefined
    expect(parse(null)).to.be.null
  })

  it('should parse with object schema references (root = object)', function() {
    const schemas = {
      object: {
        a: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const schema = {
      object: {
        schema: 'object',
        description: 'Object'
      }
    }

    const parse = schemaParser(schema, { schemas, inPlace: true })

    parse({
      object: {
        a: 'a'
      }
    })
  })

  it('should parse with object schema references (root = value)', function() {
    const schemas = {
      object: {
        a: {
          type: 'string',
          description: 'String'
        }
      }
    }

    const schema = {
      schema: 'object',
      description: 'Object'
    }

    const parse = schemaParser(schema, { schemas, inPlace: true })

    parse({
      a: 'a'
    })
  })

  it('should parse with object schema references (root = value) (has description)', function() {
    const schemas = {
      object: {
        description: 'Named schema for an object',
        schema: {
          a: {
            type: 'string',
            description: 'String'
          }
        }
      }
    }

    const schema = {
      schema: 'object',
      description: 'Object'
    }

    const parse = schemaParser(schema, { schemas, inPlace: true })

    parse({
      a: 'a'
    })
  })

  it('should parse with value schema references (root = object)', function() {
    const schemas = {
      value: {
        type: 'number',
        description: 'Number'
      }
    }

    const schema = {
      value: {
        schema: 'value',
        description: 'Value'
      }
    }

    const parse = schemaParser(schema, { schemas, inPlace: true })

    parse({
      value: '1'
    }).should.deep.equal({
      value: 1
    })
  })

  it('should parse with value schema references (root = value)', function() {
    const schemas = {
      value: {
        type: 'number',
        description: 'Number'
      }
    }

    const schema = {
      schema: 'value',
      description: 'Value'
    }

    const parse = schemaParser(schema, { schemas, inPlace: true })

    parse('1').should.equal(1)
  })

  it('should support custom `parseProperty()` parameter', function() {
    const schema = {
      type: 'id',
      description: 'Custom Type'
    }

    const parse = schemaParser(schema, { inPlace: true })

    parse('1').should.equal('1')

    // useCustomTypes({
    //   id: number()
    // })

    const parseWithCustomType = schemaParser(schema, {
      inPlace: true,
      parseProperty({ path, type, value, parsePropertyValue }) {
        switch (type) {
          case 'id':
            return parsePropertyValue({ path, type: 'positiveInteger', value });
          default:
            return value;
        }
      }
    })

    parseWithCustomType('1').should.equal(1)
  })
});
