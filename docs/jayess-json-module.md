# Jayess JSON Module

This document defines the current shipped API surface for the repository-owned `jayess:json` module.

## Module Identity

The first JSON surface belongs to:

- `jayess:json`

It is a Jayess standard-library module, not an ambient global `JSON` object.

## Current Shipped API

The shipped `jayess:json` slice stays narrow and explicit.

Current exports:

- `parse(text)`
- `stringify(value)`
- `stringifyPretty(value, indent?)`
- `validate(text)`
- `isJsonText(text)`

## Current Semantics

### `parse(text)`

- parses one JSON text input into Jayess values
- expects one string argument
- returns Jayess primitives, arrays, objects, booleans, numbers, strings, or `null`
- rejects malformed JSON with a clear runtime exception instead of permissive JavaScript-style fallbacks

### `stringify(value)`

- serializes one Jayess value into JSON text
- expects one supported Jayess value
- returns one string result
- rejects unsupported Jayess values such as callables, async handles, generator handles, and class values

### `stringifyPretty(value, indent?)`

- serializes one supported Jayess value into formatted JSON text
- accepts one required value and one optional numeric indent width
- keeps the same supported-value and key-ordering rules as `stringify(value)`

### `validate(text)`

- returns `null` when `text` is valid for the shipped parser contract
- returns one small Jayess object when invalid
- the invalid-result object currently uses `message`, `line`, and `column`

### `isJsonText(text)`

- returns `true` when `text` is valid JSON for the supported first-slice parser
- returns `false` otherwise
- expects one string argument

## Deliberate Non-Goals For The First Slice

The first `jayess:json` slice should not try to emulate the full JavaScript global `JSON` object surface.

Out of scope for the first slice:

- ambient global `JSON`
- `JSON.stringify(value, replacer, space)` compatibility
- `JSON.parse(text, reviver)` compatibility
- permissive parsing extensions
- stream-oriented parsing or incremental serializers
- special treatment for class instances beyond ordinary object fields

Those can land later as separate bounded slices after the core parse/stringify path is stable.

## Intended Layering

The first API surface is intentionally small so the module can start with a narrow primitive substrate and a thin Jayess wrapper layer.

## Current Planned Module Shape

The intended Jayess-owned module source location is:

- `stdlib/jayess/json/index.js`

The current native primitive bridge for that module lives at:

- `stdlib/jayess/json/json-primitives.hpp`

The Jayess module stays intentionally thin and forwards directly into the primitive layer.

Current resolution behavior:

- `transpileFile()` resolves `jayess:json` through the repository-owned stdlib tree
- `transpile()` string mode still requires explicit resolver support and rejects `jayess:json` by default

## Primitive Boundary Decision

The first `jayess:json` slice should use mixed ownership.

### Needs Native Primitive Support

- one narrow JSON parser entry point that turns JSON text into Jayess values
- one narrow JSON serializer entry point that turns supported Jayess values into JSON text
- one shared validation path used by `isJsonText(text)`
- one explicit rejection path for unsupported Jayess values such as callables, async handles, generator handles, and class values

These should land as a small native helper layer rather than as a pure Jayess implementation. The current Jayess language does not have enough string-processing and recursive structure-building primitives to make a small, correct, reviewable JSON parser or serializer a good fit in Jayess source first.

The first primitive layer now uses runtime-native helper entry points:

- `json_parse_text(const std::string&)`
- `json_stringify_value(const value&)`
- `is_json_text(const std::string&)`

### Can Live In Jayess Module Code

- the public `jayess:json` export surface
- thin wrapper functions that forward to the primitive layer
- later convenience helpers built on top of `parse(text)` and `stringify(value)`

The first slice should keep the Jayess module thin and let it forward into a small native helper.

## Current Primitive Direction

- `parse(text)` is the primary ingestion path
- `stringify(value)` is the primary emission path
- `stringifyPretty(value, indent?)` is the shipped formatting extension path
- `validate(text)` is the shipped validation/diagnostics helper
- `isJsonText(text)` exists as a small validation helper over the same parser contract
- the public `jayess:json` module file should be written in Jayess
- the parse/stringify substrate should land as a small native helper instead of a broad runtime-wide compatibility layer

## Remaining Follow-Up

Later work still needs to decide:

- reviver/replacer-like transforms as separate later helpers instead of direct JavaScript callback compatibility
- any broader diagnostics surface beyond `validate(text)`
- where parse/stringify argument validation belongs between the Jayess module and the primitive layer
