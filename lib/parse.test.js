import schemaParser from './parse.js';

// import { useCustomTypes } from './validate/types/index.js';
import { number } from './core.js';

describe('parse', function() {
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

    const customTypes = {
      id: number()
    }

    const parse = schemaParser(schema, {
      inPlace: true,
      customTypes
    })

    parse('1').should.equal('1')

    // useCustomTypes({
    //   id: number()
    // })

    const parseWithCustomType = schemaParser(schema, {
      inPlace: true,
      customTypes,
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

  it('should support `null` type', function() {
    const schema = {
      a: {
        type: null,
        description: 'Null',
        required: false
      }
    };

    const parse = schemaParser(schema, { inPlace: true })

    parse({ a: null }).should.deep.equal({ a: null });
    parse({ a: undefined }).should.deep.equal({ a: undefined });
    parse({}).should.deep.equal({});
    parse({ a: '' }).should.deep.equal({ a: '' });
    parse({ a: 'a' }).should.deep.equal({ a: 'a' });
  });
});
