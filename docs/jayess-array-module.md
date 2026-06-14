# Jayess `jayess:array` Module

`jayess:array` provides explicit array helpers for common array operations.

## Exports

- `slice(items, start, end)`
- `concat(left, right)`
- `isArray(value)`
- `indexOf(items, needle)`
- `includes(items, needle)`
- `find(items, callback)`
- `findIndex(items, callback)`
- `some(items, callback)`
- `every(items, callback)`
- `join(items, separator)`
- `reverse(items)`
- `sort(items, callback?)`
- `map(items, callback)`
- `filter(items, callback)`
- `reduce(items, callback, initial)`

## Current Semantics

- every exported helper validates its own wrapper-level argument count before running array logic
- `slice(items, start)` returns from `start` to the end of the array.
- `slice(items, start, end)` returns from `start` up to `end`.
- negative slice indexes clamp to `0`.
- out-of-range slice indexes clamp to the array length.
- `slice(items, start, end, extra)` is rejected.
- `concat(left, right)` requires both arguments to be Jayess arrays and returns a new array.
- `isArray(value)` returns whether the value is a Jayess array.
- `indexOf(items, needle)` uses Jayess exact equality and returns `-1` when no match exists.
- `includes(items, needle)` uses Jayess exact equality and returns a boolean.
- `find(items, callback)` returns the first element whose callback result is truthy, or `null` when no element matches.
- `findIndex(items, callback)` returns the first matching index, or `-1` when no element matches.
- `some(items, callback)` returns whether any callback result is truthy.
- `every(items, callback)` returns whether every callback result is truthy.
- empty-array results are explicit:
  - `find` returns `null`
  - `findIndex` returns `-1`
  - `some` returns `false`
  - `every` returns `true`
  - `join` returns `""`
  - `reverse`, `sort`, `map`, and `filter` return new empty arrays
  - `reduce(items, callback, initial)` returns `initial`
- `join(items)` uses `,` as the separator.
- `join(items, separator)` uses the provided separator value converted through Jayess stringification.
- `reverse(items)` returns a new reversed array and does not mutate the input array.
- `sort(items)` returns a new array ordered by deterministic Jayess stringification.
- `sort(items, callback)` returns a new array ordered by a comparator callback that returns a number less than `0` when `left` should come before `right`.
- `map(items, callback)` returns a new array containing each callback return value.
- `filter(items, callback)` returns a new array containing elements whose callback result is truthy.
- `reduce(items, callback, initial)` calls the callback with an explicit accumulator and returns the final accumulator.
- callback helpers call the callback as `(value, index, items)`, except `reduce`, which calls `(accumulator, value, index, items)`.
- callback helpers validate the callback before iteration starts.
- callback exceptions are not swallowed; a thrown Jayess payload or native runtime error propagates through the helper call unchanged.

## Ownership Split

The module is split across:

- `stdlib/jayess/array/index.js`
- `stdlib/jayess/array/array-primitives.hpp`
- `src/cpp/runtime-array-source.js`
