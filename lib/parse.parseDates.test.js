import { date } from './core.js';
import schemaParser from './parse.js';

describe('parse/parseDates', function() {
  it('should automatically parse dates when parsing custom `date()` types', function() {
    const schema = {
      date: {
        type: 'date',
        description: 'Date',
      },
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

    const parse = schemaParser(schema, {
      inPlace: true,
      customTypes
    })

    const data = {
      date: '2000-01-01T00:00:00.000Z',
      customDate: '2000-01-01T00:00:00.000Z'
    }

    expect(typeof data.date === 'string').to.equal(true)
    expect(typeof data.customDate === 'string').to.equal(true)

    parse(data)

    expect(data.date instanceof Date).to.equal(true)
    expect(data.date).to.deep.equal(new Date('2000-01-01T00:00:00.000Z'))

    expect(data.customDate instanceof Date).to.equal(true)
    expect(data.customDate).to.deep.equal(new Date('2000-01-01T00:00:00.000Z'))
  })
})
