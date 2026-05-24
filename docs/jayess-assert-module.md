# Jayess `jayess:assert` Module

`jayess:assert` is a Jayess-owned standard module for explicit program assertions.

It is not ambient Node.js `assert`, and it is not a JavaScript global.

## Exports

The shipped exports are:

- `ok(value, message?)`
- `equal(left, right, message?)`
- `notEqual(left, right, message?)`
- `fail(message?)`
- `throws(callback, message?)`

## Semantics

- `ok(value, message?)` succeeds when `value` is truthy under Jayess truthiness rules.
- `equal(left, right, message?)` succeeds when `left !== right` is false under Jayess exact equality rules.
- `notEqual(left, right, message?)` succeeds when `left === right` is false under Jayess exact equality rules.
- `fail(message?)` always throws.
- `throws(callback, message?)` calls `callback` and returns the caught Jayess thrown value when it throws.
- `throws(callback, message?)` throws its assertion message when `callback` completes normally.
- omitted or `null` messages use the helper's default assertion text.

Assertion failures use Jayess `throw` and therefore follow the same thrown-value paths as ordinary Jayess code.

## Ownership Split

The shipped module is implemented as Jayess source:

- `stdlib/jayess/assert/index.js`

No native primitive bridge is required for this slice.
