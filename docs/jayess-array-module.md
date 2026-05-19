# Jayess `jayess:array` Module

`jayess:array` provides explicit array helpers for common array operations.

## Exports

- `slice(items, start, end)`
- `concat(left, right)`
- `indexOf(items, needle)`
- `includes(items, needle)`
- `join(items, separator)`
- `map(items, callback)`
- `filter(items, callback)`
- `reduce(items, callback, initial)`

## Current Semantics

- `slice(items, start)` returns from `start` to the end of the array.
- `slice(items, start, end)` returns from `start` up to `end`.
- negative slice indexes clamp to `0`.
- out-of-range slice indexes clamp to the array length.
- `concat(left, right)` requires both arguments to be Jayess arrays and returns a new array.
- `indexOf(items, needle)` uses Jayess exact equality and returns `-1` when no match exists.
- `includes(items, needle)` uses Jayess exact equality and returns a boolean.
- `join(items)` uses `,` as the separator.
- `join(items, separator)` uses the provided separator value converted through Jayess stringification.
- `map(items, callback)` returns a new array containing each callback return value.
- `filter(items, callback)` returns a new array containing elements whose callback result is truthy.
- `reduce(items, callback, initial)` calls the callback with an explicit accumulator and returns the final accumulator.
- callback helpers call the callback as `(value, index, items)`, except `reduce`, which calls `(accumulator, value, index, items)`.
- callback helpers validate the callback before iteration starts.

## Ownership Split

The module is split across:

- `stdlib/jayess/array/index.js`
- `stdlib/jayess/array/array-primitives.hpp`
- `src/cpp/runtime-array-source.js`
