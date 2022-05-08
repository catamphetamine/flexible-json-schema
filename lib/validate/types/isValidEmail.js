// // The "RFC" regexp below doesn't validate email addresses
// // with uppercase letters like `RC7389@ProNovaPartners.com`.
// // So it can be replaced it with a simpler one that accepts
// // both lowercase and uppercase letters.
// // This one is claimed to be "the regex used in type=”email” from W3C".
// // https://emailregex.com/
// export const URL_REGEXP = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

// Another possible email regexp (lax):
// https://www.regular-expressions.info/email.html

// General Email Regex (RFC 5322 Official Standard)
// Source: https://emailregex.com/
// The other one listed there (the simpler one) doesn't work for
// 0.01% cases like `example@domain.com2adfa`.
// Those cases aren't realistic, but are still officially possible.
//
// "A TLD label MUST be at least two characters long and MAY be as long as 63 characters - not counting any leading or trailing periods (.). It MUST consist of only ASCII characters from the groups "letters" (A-Z), "digits" (0-9) and "hyphen" (-), and it MUST start with an ASCII "letter", and it MUST NOT end with a "hyphen". Upper and lower case MAY be mixed at random, since DNS lookups are case-insensitive."
// https://tools.ietf.org/id/draft-liman-tld-names-00.html
//
// export const EMAIL_REGEXP = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

// // Reg Exp notes:
//
// // Username:
// (?:
//   [a-z0-9!#$%&'*+/=?^_`{|}~-]+
//   (?:
//     \.
//     [a-z0-9!#$%&'*+/=?^_`{|}~-]+
//   )*
//   |
//   "
//   (?:
//     [\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]
//     |
//     \\
//     [\x01-\x09\x0b\x0c\x0e-\x7f]
//   )*
//   "
// )
// @
// // Domain:
// (?:
//   // Either an alphanumeric domain name:
//   (?:
//     [a-z0-9]
//     (?:[a-z0-9-]*[a-z0-9])?
//     \.
//   )+
//   [a-z0-9]
//   (?:[a-z0-9-]*[a-z0-9])?
//   |
//   // Or a `host:port` combination:
//   \[
//     (?:
//       (?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}
//       (?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?
//       |
//       [a-z0-9-]*
//       [a-z0-9]
//       :
//       (?:
//         [\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]
//         |
//         \\
//         [\x01-\x09\x0b\x0c\x0e-\x7f]
//       )+
//     )
//   \]
// )

// This is the same regexp as above, but with a fix:
// it requires at least two characters in the "top level domain".
// For example, the regexp above would allow an invalid email address: "badrumheller@vwu.e".
export const EMAIL_REGEXP = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*)?[a-z0-9]|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

export default function isValidEmail(value) {
  return EMAIL_REGEXP.test(value);
}
