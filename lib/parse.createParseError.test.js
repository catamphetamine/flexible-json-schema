import schemaParser from './parse.js';

describe('parse/createParseError', function() {
  it('should support custom `createParseError()` function (`type: "ambiguous"`)', function() {
    const schema = {
      description: 'One of types',
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
          description: 'Object',
          schema: {
            a: {
              type: 'string',
              description: 'String'
            }
          }
        }
      ]
    };

    const parse = schemaParser(schema, {
      createParseError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      },
      inPlace: true
    });

    try {
      parse({ a: 'a' });
      throw new Error('Should have thrown a `type: "ambiguous"` custom error');
    } catch (error) {
      if (error.type === 'ambiguous') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createParseError()` function (`type: "unsupported"`)', function() {
    const schema = {
      a: {
        arrayOf: 'string',
        description: 'String'
      }
    };

    const parse = schemaParser(schema, {
      createParseError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      },
      inPlace: true
    });

    try {
      parse({ a: 'a' });
      throw new Error('Should have thrown a `type: "unsupported"` custom error');
    } catch (error) {
      if (error.type === 'unsupported') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createParseError()` function (`type: "invalid"`)', function() {
    const schema = {
      a: {
        type: 'positiveInteger',
        description: 'String'
      }
    };

    const parse = schemaParser(schema, {
      createParseError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      },
      inPlace: true
    });

    try {
      parse({ a: 'a' });
      throw new Error('Should have thrown a `type: "invalid"` custom error');
    } catch (error) {
      if (error.type === 'invalid') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createParseError()` function (`type: "unknown"`)', function() {
    const schema = {
      a: {
        type: 'string',
        description: 'String'
      }
    };

    const parse = schemaParser(schema, {
      createParseError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      },
      inPlace: true
    });

    try {
      parse({ b: 'b' });
      throw new Error('Should have thrown a `type: "unknown"` custom error');
    } catch (error) {
      if (error.type === 'unknown') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });
});
