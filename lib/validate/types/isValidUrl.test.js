import isValidUrl from './isValidUrl.js';

describe('isValidUrl', function() {
  it('should validate a URL', function() {
    isValidUrl('/abc?def=ghi').should.equal(false);
    isValidUrl('https://domain.com/abc?def=ghi').should.equal(true);
    isValidUrl('https://d36jn619e2o9pu.cloudfront.net/Lee+University/1-GSCI-121_(2022D)StudentSyllabus[2].pdf').should.equal(true);
  });
});
