import schemaValidation from './validate.js'

describe('validate/schema', function() {
  it('should support nested schema reference', function() {
    const validate = schemaValidation({
      a: {
        b: {
          description: 'B',
          schema: 'b'
        }
      }
    }, {
      schemas: {
        b: {
          c: {
            type: 'string',
            description: 'C'
          }
        }
      }
    });

    expect(() => validate({})).to.throw('required');
    expect(() => validate({ a: { b: {} } })).to.throw('required');
    validate({ a: { b: { c: 'd' } } });
  })

  it('should validate with object schema references (root = object)', function() {
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

    const validate = schemaValidation(schema, { schemas })

    validate({
      object: {
        a: 'a'
      }
    })
  })

  it('should validate with object schema references (root = value)', function() {
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

    const validate = schemaValidation(schema, { schemas })

    validate({
      a: 'a'
    })
  })

  it('should validate with object schema references (root = value) (has description)', function() {
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

    const validate = schemaValidation(schema, { schemas })

    validate({
      a: 'a'
    })
  })

  it('should validate with value schema references (root = object)', function() {
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

    const validate = schemaValidation(schema, { schemas })

    validate({
      value: 1
    })
  })

  it('should validate with value schema references (root = value)', function() {
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

    const validate = schemaValidation(schema, { schemas })

    validate(1)
  })

  it('should expand deep schema references', async function() {
    const schema = {
      courseEnrollmentPricing: {
        schema: 'coursePricing',
        description: 'Pricing'
      }
    };

    const schemas = {
      coursePricing: {
        description: 'Course Pricing',
        arrayOf: {
          description: 'Course Pricing Variant',
          schema: 'coursePricingVariant'
        }
      },
      coursePricingVariant: {
        description: 'Course pricing variant',
        oneOfType: [
          {
            "is": "object",
            "description": "Pricing model",
            "schema": {
              "model": {
                "oneOf": ["fixed"],
                "description": "Pricing model"
              },
              "code": {
                "schema": "coursePricingStringCondition",
                "description": "Course code",
                "required": false
              }
            }
          }
        ]
      },
      coursePricingStringCondition: {
        "description": "Course pricing string filter condition",
        "oneOfType": [
          {
            "is": "string",
            "type": "string",
            "description": "String"
          },
          {
            "is": "string[]",
            "description": "A \"one of\" list of strings",
            "arrayOf": {
              "type": "string",
              "description": "String"
            }
          }
        ]
      }
    }

    const validate = schemaValidation(schema, { schemas })

    validate({
      courseEnrollmentPricing: [{
        model: 'fixed',
        code: ['ABC', 'DEF']
      }]
    })
  });
});
