import expandSchemaReference from './expandSchemaReference.js';

describe('expandSchemaReference', () => {
  it('should expand `schema` reference', () => {
    expandSchemaReference({
      schema: 'flower'
    }, {
      context: {
        schemas: {
          flower: {
            color: {
              description: 'Color',
              type: 'string'
            }
          }
        }
      }
    }).should.deep.equal({
      schema: {
        color: {
          description: 'Color',
          type: 'string'
        }
      }
    });
  });

  it('should expand `extends` reference', () => {
    expandSchemaReference({
      extends: 'flower',
      schema: {
        region: {
          description: 'Region',
          type: 'string'
        }
      }
    }, {
      context: {
        schemas: {
          flower: {
            color: {
              description: 'Color',
              type: 'string'
            }
          }
        }
      }
    }).should.deep.equal({
      description: 'Extends "flower"',
      extends: {
        color: {
          description: 'Color',
          type: 'string'
        }
      },
      schema: {
        region: {
          description: 'Region',
          type: 'string'
        }
      }
    });
  });
});
