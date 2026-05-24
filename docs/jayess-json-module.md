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

## Current Non-Goals

The shipped `jayess:json` module does not emulate the full JavaScript global `JSON` object surface.

Out of scope for the current module surface:

- ambient global `JSON`
- `JSON.stringify(value, replacer, space)` compatibility
- `JSON.parse(text, reviver)` compatibility
- permissive parsing extensions
- stream-oriented parsing or incremental serializers
- special treatment for class instances beyond ordinary object fields

## Current Layering

The current API surface is intentionally small and uses a narrow primitive substrate with a thin Jayess wrapper layer.

## Current Module Shape

The Jayess-owned module source location is:

- `stdlib/jayess/json/index.js`

The current native primitive bridge for that module lives at:

- `stdlib/jayess/json/json-primitives.hpp`

The Jayess module stays intentionally thin and forwards directly into the primitive layer.

Current resolution behavior:

- `transpileFile()` resolves `jayess:json` through the repository-owned stdlib tree
- `transpile()` string mode still requires explicit resolver support and rejects `jayess:json` by default

## Primitive Boundary

The shipped `jayess:json` module uses mixed ownership.

### Needs Native Primitive Support

- one narrow JSON parser entry point that turns JSON text into Jayess values
- one narrow JSON serializer entry point that turns supported Jayess values into JSON text
- one shared validation path used by `isJsonText(text)`
- one explicit rejection path for unsupported Jayess values such as callables, async handles, generator handles, and class values

These live in a small native helper layer rather than as a pure Jayess implementation. The current Jayess language does not have enough string-processing and recursive structure-building primitives to make a small, correct, reviewable JSON parser or serializer a good fit in Jayess source.

The first primitive layer now uses runtime-native helper entry points:

- `json_parse_text(const std::string&)`
- `json_stringify_value(const value&)`
- `is_json_text(const std::string&)`

### Can Live In Jayess Module Code

- the public `jayess:json` export surface
- thin wrapper functions that forward to the primitive layer

The Jayess module stays thin and forwards into a small native helper.

## Current Primitive Direction

- `parse(text)` is the primary ingestion path
- `stringify(value)` is the primary emission path
- `stringifyPretty(value, indent?)` is the shipped formatting extension path
- `validate(text)` is the shipped validation/diagnostics helper
- `isJsonText(text)` exists as a small validation helper over the same parser contract
- the public `jayess:json` module file is written in Jayess
- the parse/stringify substrate is a small native helper instead of a broad runtime-wide compatibility layer

## Current Boundaries

The shipped `jayess:json` module keeps these boundaries explicit:

- no reviver/replacer callback compatibility
- no broader diagnostics surface beyond `validate(text)`
- parse/stringify validation is split between the Jayess module surface and primitive layer
