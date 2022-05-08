// URL regexp explanation:
//
// /^
//
//  // Matches everything after the "origin":
//  // * pathname
//  // * query
//  // * hash
//  (?:[/?#]\S*)?
//
// $/i

export const RELATIVE_URL_REGEXP = /^(?:[/?#]\S*)?$/i;

export default function isValidRelativeUrl(value) {
  return RELATIVE_URL_REGEXP.test(value);
}
