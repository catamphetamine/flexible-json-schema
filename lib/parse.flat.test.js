import schemaParser from './parse.js';

// import { useCustomTypes } from './validate/types/index.js';
// import { number } from './core.js';

describe('parse (structure: "flat")', function() {
  it('should parse values from strings', function() {
    const data = {
      bool1: '✓',
      bool2: '✕',
      bool3: '1',
      bool4: '0',
      bool5: 'true',
      bool6: 'false',
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
      bool4: {
        type: 'boolean',
        description: 'Boolean'
      },
      bool5: {
        type: 'boolean',
        description: 'Boolean'
      },
      bool6: {
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
      bool4: false,
      bool5: true,
      bool6: false,
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
      booleans: '[true, false, true]',
      strings: '["a","b","c"]',
      numbers: '[1,2,3]'
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

  it('should parse oneOfType in case of a "flat" stringified object', function() {
    const data = {
      object: JSON.stringify({
        a: 1,
        date: '2021-01-01T00:00:00.000Z'
      })
    };

    const parse = schemaParser({
      object: {
        description: 'Object',
        schema: {
          a: {
            description: 'A string or a number',
            oneOfType: [{
              is: 'string',
              type: 'string',
              description: 'String'
            }, {
              is: 'number',
              type: 'number',
              description: 'Number'
            }]
          },
          date: {
            description: 'Date',
            type: 'date'
          }
        }
      },
    }, {
      structure: 'flat'
    });

    parse(data).should.deep.equal({
      object: {
        a: 1,
        date: new Date('2021-01-01T00:00:00.000Z')
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
});
