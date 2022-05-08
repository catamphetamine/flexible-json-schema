// URL regexp explanation:
//
// /^
//
//  (?:
//    // Matches optional "http(s):" or "ftp:":
//    (?:
//      (?:https?|ftp):
//    )?
//
//    // Matches "//" (required):
//    \/\/
//  )
//
//  // Matches a valid non-local IP address:
//  (?:
//    (?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])
//    (?:
//      \.
//      (?:1?\d{1,2}|2[0-4]\d|25[0-5])
//    ){2}
//    (?:
//      \.
//      (?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4])
//    )
//
//    // Or,
//    |
//
//    // Matches an alpha-numeric domain name.
//    (?:
//      (?:
//        [a-z0-9\u00a1-\uffff]
//        [a-z0-9\u00a1-\uffff_-]{0,62}
//      )?
//      [a-z0-9\u00a1-\uffff]
//      \.
//    )*
//    (?:
//      // Domain zone: "com", "net", etc (required):
//      [a-z\u00a1-\uffff]{2,}
//    )
//  )
//
//  // Matches a colon and a port number:
//  (?::\d{2,5})?
//
//  // Matches everything after the "origin":
//  // * pathname
//  // * query
//  // * hash
//  (?:[/?#]\S*)?
//
// $/i

export const URL_REGEXP = /^(?:(?:(?:https?|ftp):)?\/\/)(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)*(?:[a-z\u00a1-\uffff]{2,}))(?::\d{2,5})?(?:[/?#]\S*)?$/i;

export default function isValidUrl(value) {
  return URL_REGEXP.test(value);
}

// The following URL validation regexp from `yup` didn't work on:
// "https://d36jn619e2o9pu.cloudfront.net/Lee+University/1-GSCI-121_(2022D)StudentSyllabus[2].pdf"
//
// // Copy-pasted from `yup` URL validation regexp:
// // https://github.com/jquense/yup/blob/acbb8b4f3c24ceaf65eab09abaf8e086a9f11a73/src/string.ts#L11
// const URL_REGEXP_PROTOCOL = '((https?|ftp):)?\/\/';
// const GENERIC_ALPHA_CHARACTER_CLASS = '[a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]';
// const GENERIC_ALPHA_CHARACTER = `(${GENERIC_ALPHA_CHARACTER_CLASS})`;
// const GENERIC_CHARACTER = `(${GENERIC_ALPHA_CHARACTER_CLASS}|\d|-|\.|_|~)`;
// const ENCODED_CHARACTER = '(%[\da-f]{2})';
// const SPECIAL_CHARACTER = "[!\$&'\(\)\*\+,;=]";
// const URL_REGEXP_QUERY_OR_HASH_CHARACTER = `(${GENERIC_CHARACTER}|${ENCODED_CHARACTER}|${SPECIAL_CHARACTER}|:|@)|\/|\?`;
// const URL_REGEXP_QUERY = `(\?(${URL_REGEXP_QUERY_OR_HASH_CHARACTER}|[\uE000-\uF8FF])*)?`;
// const URL_REGEXP_HASH = `(\#(${URL_REGEXP_QUERY_OR_HASH_CHARACTER})*)?`;
// const IP_V4_ADDRESS = '((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))';
// const URL_REGEXP_USERNAME_AT = `((${GENERIC_CHARACTER}|${ENCODED_CHARACTER}|${SPECIAL_CHARACTER}|:)*@)?`;
// const URL_REGEXP_PORT = '(:\d*)?';
// const URL_REGEXP_PATH_ELEMENT = `(${GENERIC_CHARACTER}|${ENCODED_CHARACTER}|${SPECIAL_CHARACTER}|:|@)`;
// const URL_REGEXP_PATH = `(\/(${URL_REGEXP_PATH_ELEMENT}+(\/${URL_REGEXP_PATH_ELEMENT}*)*)?)?`;
// const GENERIC_ALPHA_CHARACTER_OR_DIGIT = `(\d|${GENERIC_ALPHA_CHARACTER_CLASS})`;
// const SECOND_LEVEL_DOMAIN = `(${GENERIC_ALPHA_CHARACTER_OR_DIGIT}|(${GENERIC_ALPHA_CHARACTER_OR_DIGIT}${GENERIC_CHARACTER}*${GENERIC_ALPHA_CHARACTER_OR_DIGIT}))\.`;
// const TOP_LEVEL_DOMAIN = `(${GENERIC_ALPHA_CHARACTER}|(${GENERIC_ALPHA_CHARACTER}${GENERIC_CHARACTER}*${GENERIC_ALPHA_CHARACTER}))`;
// const URL_REGEXP_DOMAIN = `(${SECOND_LEVEL_DOMAIN})+${TOP_LEVEL_DOMAIN}`;
// export const URL_REGEXP = new RegExp(`^${URL_REGEXP_PROTOCOL}(${URL_REGEXP_USERNAME_AT}(${IP_V4_ADDRESS}|${URL_REGEXP_DOMAIN}\.?)${URL_REGEXP_PORT})${URL_REGEXP_PATH}${URL_REGEXP_QUERY}${URL_REGEXP_HASH}$`, 'i');
//
// // Extracted from `URL_REGEXP` above.
// export const RELATIVE_URL_REGEXP = /^(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
