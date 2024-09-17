export default function filter(type, test) {
  return type.test(
    'is-valid',
    '${path} is not valid',
    (value) => {
      // `yup`'s `.test()` always calls the "test" function, regardless
      // of whether the `value` is `undefined` or `null` or contains some actual value.
      // But logically, the "test" function should only be run against a non-`null` and
      // non-`undefined` value, because it's how any sane person would assume that it works.
      // Yet, `yup`'s `.test()` always runs the "test" function, which is silly and illogical.
      // https://github.com/jquense/yup/issues/1055
      // To fix that issue of `yup`, here, it explicitly checks that the value
      // is not `null` and not `undefined` before running the "test" function against the value.
      if (value === undefined || value === null) {
        // Ignore `undefined` or `null` values:
        // those values should still pass the test
        // when the property is declared as `required: false` in a schema.
        // Otherwise, the schema validation function would throw an error
        // when the property value is `undefined` or `null`
        // even when the property itself is declared as optional.
        return true;
      }
      // Run the "test" function againts the value.
      return test(value);
    }
  );
}
