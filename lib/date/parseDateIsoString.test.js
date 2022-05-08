import parseDateIsoString from './parseDateIsoString.js';

describe('parseDateIsoString', function() {
  it('should parse dates', function() {
    const date_ = new Date(2000, 0, 1);
    // Fix local time zone offset.
    const date = new Date(date_.getTime() - date_.getTimezoneOffset() * 60 * 1000);
    const parsedDate = parseDateIsoString('2000-01-01T00:00:00.000Z');
    parsedDate.getTime().should.equal(date.getTime());
  });
});
