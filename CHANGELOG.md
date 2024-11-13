0.13.5 / 13.11.2024
===================

* Added `allowEmpty: true` option as a counterpart for `nonEmpty: false`.

0.13.3 / 17.09.2024
===================

* Added custom type creation utility functions:
  * `conditional`
  * `depends`
  * `filter`
  * `oneOf`
  * `arrayOfOneOf`
  * `regexp`

* Fixed custom `date()` types not being parsed automatically when validating data.

0.13.0 / 02.08.2024
===================

* Partially rewrote some parts of the code in a cleaner way.
* Updated to `yup@1.x`.
* Added new `type`: `null`.

0.12.0 / 07.01.2023
===================

* (breaking change) Changed how `structure: "flat"` works with `JSON.stringify()`-ed objects and arrays: they no longer have to have all their "leaf" properties to be strings. In other words, the previously used "weird" behavior in that case was replaced with a non-"weird" one.

0.11.25 / 27.12.2022
===================

* Added `extends` feature.

0.11.8 / 08.05.2022
===================

* Refactored code.

* Added `any` type.

0.11.0 / 03.05.2022
===================

* (non-compatible change) In `when` condition, renamed `$present` to `$exists`.

* Added `oneOfType` type.

0.10.0 / 16.04.2022
===================

* Initial release
