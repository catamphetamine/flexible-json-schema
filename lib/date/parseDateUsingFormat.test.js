import parseDateUsingFormat from './parseDateUsingFormat.js';

describe('parseDateUsingFormat', function() {
  it('should parse year-month-day dates', function() {
    const date_ = new Date(2000, 0, 1);
    // Fix local time zone offset.
    const date = new Date(date_.getTime() - date_.getTimezoneOffset() * 60 * 1000);
    const parsedDate = parseDateUsingFormat('2000-01-01', 'yyyy-mm-dd');
    parsedDate.getTime().should.equal(date.getTime());
  });

  it('should not support unsupported date formats', function() {
    expect(() => parseDateUsingFormat('01/01/2000', 'mm/dd/yyyy')).to.throw('Unsupported');
  });
});
