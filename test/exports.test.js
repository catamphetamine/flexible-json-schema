import schemaValidation, { useCustomTypes, SchemaValidationError } from '../index.js'
import schemaParser, { SchemaParseError } from '../parse.js'
import { string } from '../core.js'

describe('flexible-json-schema', () => {
  it('should export ES modules', () => {
    schemaValidation.should.be.a('function')
    useCustomTypes.should.be.a('function')
    SchemaValidationError.should.be.a('function')

    schemaParser.should.be.a('function')
    SchemaParseError.should.be.a('function')

    string.should.be.a('function')
  })
})
