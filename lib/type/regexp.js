import { string } from '../core.js';

// When passed two arguments, the first one should be a `yup` type
// and the second one should be a regular expression.
// When passed one argument, it should be a regular expression,
// and the `yup` type defaults to a `string().min(1)`.
export default function regexp(arg1, arg2, arg3) {
  let stringType;
  let regExp;
  let options;

  if (arg2 instanceof RegExp) {
    stringType = arg1;
    regExp = arg2;
    options = arg3;
  } else {
    stringType = string();
    regExp = arg1;
    options = arg2;

    // If empty strings are not allowed.
    if (!(options && options.nonEmpty === false)) {
      stringType = stringType.min(1);
    }
  }

  // There's also an alternative method signature — `.regexp(regExp, { excludeEmptyString: true })` —
  // where `{ excludeEmptyString: true }` option enables an empty-string value to always be valid.
  //
  // In the default case though, there's no requirement for an empty-string value to always pass the validation,
  // so that option is not passed by default.
  //
  return stringType.matches(regExp, {
    // If empty strings are allowed.
    excludeEmptyString: options && options.nonEmpty === false
  });
}
