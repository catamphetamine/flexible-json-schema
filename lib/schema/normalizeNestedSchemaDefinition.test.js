import normalizeNestedSchemaDefinition from './normalizeNestedSchemaDefinition.js';

describe('normalizeNestedSchemaDefinition', () => {
  it('should normalize nested schema defintion (schema: { type })', () => {
    normalizeNestedSchemaDefinition({
      description: 'Description',
      required: false,
      schema: {
        description: 'Schema description',
        required: undefined,
        type: 'string'
      }
    }).should.deep.equal({
      description: 'Description',
      required: false,
      type: 'string'
    });
  });

  it('should normalize nested schema defintion (schema: { schema: { type } })', () => {
    normalizeNestedSchemaDefinition({
      description: 'Description',
      required: false,
      schema: {
        description: 'Schema description',
        required: undefined,
        schema: {
          description: 'Nested schema description',
          required: undefined,
          type: 'string'
        }
      }
    }).should.deep.equal({
      description: 'Description',
      required: false,
      type: 'string'
    });
  });

  it('should normalize nested schema defintion (schema: { schema: properties })', () => {
    normalizeNestedSchemaDefinition({
      description: 'Description',
      required: false,
      schema: {
        description: 'Schema description',
        required: undefined,
        schema: {
          a: {
            description: 'A',
            type: 'string'
          }
        }
      }
    }).should.deep.equal({
      description: 'Description',
      required: false,
      schema: {
        a: {
          description: 'A',
          type: 'string'
        }
      }
    });
  });

  it('should normalize nested schema defintion (schema: { schema: { schema: properties } })', () => {
    normalizeNestedSchemaDefinition({
      description: 'Description',
      required: false,
      schema: {
        description: 'Schema description',
        required: undefined,
        schema: {
          description: 'Nested schema description',
          required: undefined,
          schema: {
            a: {
              description: 'A',
              type: 'string'
            }
          }
        }
      }
    }).should.deep.equal({
      description: 'Description',
      required: false,
      schema: {
        a: {
          description: 'A',
          type: 'string'
        }
      }
    });
  });
});
