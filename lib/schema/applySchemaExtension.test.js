import applySchemaExtension from './applySchemaExtension.js';

describe('applySchemaExtension', () => {
  it('should expand `extends` schema over `schema` "inline" schema', () => {
    applySchemaExtension({
      description: 'Color of a region',
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
    }, {
      context: {}
    }).should.deep.equal({
      description: 'Color of a region',
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

  it('should expand `extends` schema definition into an "inline" schema rather than a non-inline one', () => {
    applySchemaExtension({
      description: 'Flower of a region',
      extends: {
        description: 'Flower',
        schema: {
          description: 'Flower (nested)',
          schema: {
            color: {
              description: 'Color',
              type: 'string'
            }
          }
        }
      },
      schema: {
        region: {
          description: 'Region',
          type: 'string'
        }
      }
    }, {
      context: {}
    }).should.deep.equal({
      description: 'Flower of a region',
      schema: {
        color: {
          description: 'Color',
          type: 'string'
        },
        region: {
          description: 'Region',
          type: 'string'
        }
      }
    });
  });
});
