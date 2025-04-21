import schemaParser from './parse.js';

describe('parse', function() {
  it('should parse "objectOf" values', function() {
    const schema = {
      objectOf: 'string',
      description: 'Object'
    };

    const parse = schemaParser(schema, { inPlace: true });

    parse({ a: 'b' }).should.deep.equal({ a: 'b' });
  });

  it('should parse "objectOf" values (with `keyOneOf`)', function() {
    const schema = {
      objectOf: 'string',
      keyOneOf: ['a', 'b'],
      description: 'Object'
    };

    const parse = schemaParser(schema, { inPlace: true });

    parse({ a: 'b' }).should.deep.equal({ a: 'b' });

    // Doesn't validate the parsed value because this is parsing, not validation.
    // expect(() => parse({ c: 'b' })).to.throw('unknown');
  });

  it('should parse "objectOf" values (value type is object)', function() {
    const schema = {
      objectOf: {
        x: {
          type: 'string',
          description: 'String'
        }
      },
      description: 'Object'
    };

    const parse = schemaParser(schema, { inPlace: true });

    parse({ a: { x: 'b' } }).should.deep.equal({ a: { x: 'b' } });

    expect(() => parse({ a: { y: 'b' } })).to.throw('unknown');
  });
});
