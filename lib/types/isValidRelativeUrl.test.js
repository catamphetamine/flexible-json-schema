import isValidRelativeUrl from './isValidRelativeUrl.js';

describe('isValidRelativeUrl', function() {
  it('should validate a relative URL', function() {
    isValidRelativeUrl('/abc?def=ghi').should.equal(true);
    isValidRelativeUrl('https://domain.com/abc?def=ghi').should.equal(false);
  });
});
