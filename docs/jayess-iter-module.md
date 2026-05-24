# Jayess `jayess:iter` Module

Jayess exposes generator-handle helpers through an explicit module:

- `jayess:iter`

This module is Jayess-owned. It is not JavaScript iterator-protocol emulation.

## Exports

- `next(generator)`
- `toArray(generator)`
- `take(generator, count)`
- `map(generator, callback)`
- `filter(generator, callback)`
- `forEach(generator, callback)`
- `reduce(generator, callback, initial)`
- `some(generator, callback)`
- `every(generator, callback)`
- `find(generator, callback)`
- `chain(left, right)`
- `range(start, end, step)`

## Semantics

- `next(generator)` resumes a Jayess generator and returns the next yielded value.
- `next(generator)` returns Jayess `null` once the generator is complete.
- `toArray(generator)` consumes the generator and returns an array of yielded values.
- `take(generator, count)` consumes up to `count` yielded values and returns an array.
- `map(generator, callback)` consumes the generator and returns an array of callback results.
- `filter(generator, callback)` consumes the generator and returns yielded values whose callback result is truthy.
- `forEach(generator, callback)` consumes the generator and calls the callback for each yielded value.
- `reduce(generator, callback, initial)` consumes the generator and returns the final accumulator.
- `some(generator, callback)` stops at the first truthy callback result and returns a boolean.
- `every(generator, callback)` stops at the first falsey callback result and returns a boolean.
- `find(generator, callback)` returns the first yielded value with a truthy callback result or Jayess null.
- `chain(left, right)` returns a generator handle that yields all values from `left`, then all values from `right`.
- `range(start, end, step)` returns a generator handle for a numeric half-open range. Positive steps stop before `end`; negative steps stop after passing `end`.
- `count` must be a non-negative integer Jayess number.
- `range` arguments must be numeric and `step` must be non-zero.
- callbacks must be callable Jayess values.

Generator failure still propagates through the existing Jayess thrown-value path.

## Ownership Split

The iterator module is split across:

- `stdlib/jayess/iter/index.js`
- `stdlib/jayess/iter/iter-primitives.hpp`
- `src/cpp/runtime-iter-source.js`
