# Jayess Regex Roadmap

Jayess now ships a narrow first regular-expression slice as a Jayess-owned standard-library/runtime feature.

The goal is not to reproduce ambient JavaScript `RegExp` behavior all at once. The goal is to add a small, explicit first slice that fits Jayess as a compiled language.

## Current Policy

Regex support is approved, but it should not land as:

- an ambient global `RegExp`
- parser-only literal syntax without a defined runtime story
- broad JavaScript compatibility by default

The first slice should stay module-owned and explicit.

## First Approved Surface

The first shipped regex surface is:

- module helpers only

The preferred module identity is:

- `jayess:regex`

That means the first slice does not start with:

- regex literal syntax like `/abc/`
- JavaScript-style `new RegExp(...)`
- ambient global constructors

Those are separate later decisions.

There is no active implementation milestone for regex literal syntax in the current checklist; literals remain outside the approved first Jayess regex slice.

## First Approved Operations

The first shipped operations are:

- `create(pattern)`
- `test(regex, text)`
- `exec(regex, text)`
- `isRegex(value)`

This keeps the first slice centered on:

- explicit construction
- boolean matching
- one explicit match-result operation
- narrow runtime introspection

The following stay separate later tasks:

- match-style convenience helpers over strings
- replacement helpers
- split helpers
- flags/options beyond whatever the first helper layer explicitly chooses

## Runtime Boundary Decision

The first regex slice uses:

- a narrow C++ native helper layer under a Jayess-owned module surface

It should not start with:

- a new general-purpose runtime value kind unless the first helper layer proves insufficient
- a pure Jayess wrapper that tries to implement regex behavior itself

This keeps the first slice small:

- the native layer owns actual pattern compilation and matching
- the public API stays in `jayess:regex`
- broader ergonomic helpers can be added later without changing the first boundary

## Current Shipped Result Shape

The shipped `exec(regex, text)` shape is:

- Jayess `null` when no match exists
- a Jayess array of strings when a match exists
- the full match at index `0`
- captured groups in later indices

## Why This Shape

This first shape fits Jayess better because:

- it avoids parser ambiguity and lexer complexity up front
- it avoids ambient-global compatibility work
- it keeps the compiled/runtime contract explicit
- it lets the transpiler add regex incrementally instead of claiming full JavaScript `RegExp`

## Later Separate Decisions

Keep these as separate later slices:

- regex literal syntax approval
- constructor-style creation approval
- replacement helpers
- match-array/result-shape policy
- flags support policy
- broader string/regex interop
