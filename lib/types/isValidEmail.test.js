import isValidEmail from './isValidEmail.js';

describe('isValidEmail', function() {
  it('should validate an email address', function() {
    isValidEmail('admin@example.com').should.equal(true);
    isValidEmail('test.com').should.equal(false);
    isValidEmail('badrumheller@vwu.e').should.equal(false);
    isValidEmail('badrumheller@vwu.edu').should.equal(true);
  });
});
