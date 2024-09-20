import schemaValidation from './validate.js';

describe('validate/nullable', function() {
  it('should support `required: false` and `nullable: false`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String',
        required: false,
        nullable: false
      }
    });

    validate({});
    validate({ a: 'a' });
    expect(() => validate({ a: null })).to.throw('cannot be null');
  });

  it('should support `required: true` and `nullable: false`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String',
        required: true,
        nullable: false
      }
    });

    expect(() => validate({})).to.throw('required');
    validate({ a: 'a' });
    expect(() => validate({ a: null })).to.throw('cannot be null');
  });

  it('should support `required: false` and `nullable: true`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String',
        required: false,
        nullable: true
      }
    });

    validate({});
    validate({ a: 'a' });
    validate({ a: null });
  });

  it('should support `required: true` and `nullable: true`', function() {
    const validate = schemaValidation({
      a: {
        type: 'string',
        description: 'String',
        required: true,
        nullable: true
      }
    });

    expect(() => validate({})).to.throw('required');
    validate({ a: 'a' });
    validate({ a: null });
  });
});
