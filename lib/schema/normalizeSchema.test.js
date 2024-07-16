import normalizeSchema from './normalizeSchema.js';

describe('normalizeSchema', () => {
  it('should normalize schema (`schema` and `extends` references)', () => {
    normalizeSchema({
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
      schema: {
        region: {
          description: 'Region',
          type: 'string'
        },
        color: {
          description: 'Color',
          type: 'string'
        }
      }
    });
  });
});
