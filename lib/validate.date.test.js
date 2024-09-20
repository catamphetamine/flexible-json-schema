import { date } from './core.js';
import schemaValidation from './validate.js';

describe('validate/date', function() {
  it('should throw an error when encountering an invalid date', function() {
    const schema = {
      date: {
        type: 'date',
        description: 'Date',
      }
    }

    const validate = schemaValidation(schema)

    const data = {
      date: new Date('YYYY-01-01T00:00:00.000Z')
    }

    expect(() => validate(data)).to.throw('Invalid Date')
  })

  it('should throw an error when encountering an invalid date (custom type)', function() {
    const schema = {
      customDate: {
        type: 'customDate',
        description: 'Custom Date'
      }
    }

    const customTypes = {
      customDate: date().test(
        'is-valid-modern-date-of-birth',
        '${path} is not a valid modern date of birth',
        (value) => {
          // See `./lib/type/filter.js` for more info on why `undefined` and `null` are ignored.
          if (value === undefined || value === null) {
            return true;
          }
          return value.getTime() >= new Date('1900-01-01T00:00:00.000Z').getTime();
        }
      )
    }

    const validate = schemaValidation(schema, {
      customTypes
    })

    const data = {
      customDate: new Date('YYYY-01-01T00:00:00.000Z')
    }

    expect(() => validate(data)).to.throw('Invalid Date')
  })
});
