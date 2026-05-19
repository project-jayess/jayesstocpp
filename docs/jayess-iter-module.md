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

## Semantics

- `next(generator)` resumes a Jayess generator and returns the next yielded value.
- `next(generator)` returns Jayess `null` once the generator is complete.
- `toArray(generator)` consumes the generator and returns an array of yielded values.
- `take(generator, count)` consumes up to `count` yielded values and returns an array.
- `map(generator, callback)` consumes the generator and returns an array of callback results.
- `filter(generator, callback)` consumes the generator and returns yielded values whose callback result is truthy.
- `count` must be a non-negative integer Jayess number.
- callbacks must be callable Jayess values.

Generator failure still propagates through the existing Jayess thrown-value path.

## Ownership Split

The iterator module is split across:

- `stdlib/jayess/iter/index.js`
- `stdlib/jayess/iter/iter-primitives.hpp`
- `src/cpp/runtime-iter-source.js`
