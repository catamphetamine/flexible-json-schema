import schemaValidation from './validate.js';
import { useCustomTypes } from './validate/types/index.js';
import oneOf from './type/oneOf.js';

useCustomTypes({
  'aOrBOrC': oneOf(['a', 'b', 'c'])
});

describe('validate', function() {
  it('should support `objectOf` type', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: 'number',
        description: 'Object'
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

  it('should support `objectOf` type (with `keyOneOf`)', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: 'number',
        keyOneOf: ['a', 'b', 'c'],
        description: 'Object'
      }
    });

    validate({
      stats: {
        a: 1.25,
        b: 2.40,
        c: 4.10
      }
    });

    expect(() => {
      validate({
        stats: {
          a: 1.25,
          b: 2.40,
          c: 4.10,
          d: 5.30
        }
      });
    }).to.throw('unknown');
  });

  it('should support `objectOf` type (with `keyType`)', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: 'number',
        keyType: 'aOrBOrC',
        description: 'Object'
      }
    });

    validate({
      stats: {
        a: 1.25,
        b: 2.40,
        c: 4.10
      }
    });

    expect(() => {
      validate({
        stats: {
          a: 1.25,
          b: 2.40,
          c: 4.10,
          d: 5.30
        }
      });
    }).to.throw('unknown');
  });

  it('should support `objectOf` type (value is an object)', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: {
          x: {
            type: 'number',
            description: 'Number'
          }
        },
        description: 'Object'
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

  it('should support `objectOf` type (value is an object having a `schema`)', function() {
    const validate = schemaValidation({
      stats: {
        objectOf: {
          description: 'Object',
          schema: {
            x: {
              type: 'number',
              description: 'Number'
            }
          }
        },
        description: 'Object'
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

    expect(() => {
      validate({
        stats: {
          a: {
            x: 1.25,
            y: 2.15
          }
        }
      });
    }).to.throw('unknown');
  });
});
