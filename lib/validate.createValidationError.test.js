import schemaValidation from './validate.js';

describe('validate/createValidationError', function() {
  it('should support custom `createValidationError()` function (type: "required") (`undefined` value)', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String'
      }
    }, {
      createValidationError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      }
    });

    try {
      validate({});
      throw new Error('Should have thrown a `type: "required"` custom error');
    } catch (error) {
      if (error.type === 'required') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createValidationError()` function (type: "required") (`null` value)', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String'
      }
    }, {
      createValidationError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      }
    });

    try {
      validate({ a: null });
      throw new Error('Should have thrown a `type: "required"` custom error');
    } catch (error) {
      if (error.type === 'required') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createValidationError()` function (type: "unknown")', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String'
      }
    }, {
      createValidationError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      }
    });

    try {
      validate({ b: 'b' });
      throw new Error('Should have thrown a `type: "unknown"` custom error');
    } catch (error) {
      if (error.type === 'unknown') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createValidationError()` function (type: "unsupported")', function() {
    const validate = schemaValidation({
      description: 'One of types',
      oneOfType: [
        {
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
        },
        {
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
        }
      ]
    }, {
      createValidationError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      }
    });

    try {
      validate('a');
      throw new Error('Should have thrown a `type: "unsupported"` custom error');
    } catch (error) {
      if (error.type === 'unsupported') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });

  it('should support custom `createValidationError()` function (type: "ambiguous")', function() {
    const validate = schemaValidation({
      description: 'One of types',
      oneOfType: [
        {
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
        },
        {
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
        }
      ]
    }, {
      createValidationError({ message, errors, type, path, value }) {
        const error = new Error(message);
        error.type = type;
        return error;
      }
    });

    try {
      validate({ a: 'a' });
      throw new Error('Should have thrown a `type: "ambiguous"` custom error');
    } catch (error) {
      if (error.type === 'ambiguous') {
        // Test passed.
      } else {
        throw error;
      }
    }
  });
});
