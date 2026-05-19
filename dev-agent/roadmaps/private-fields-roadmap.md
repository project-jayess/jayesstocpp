# Private Fields Implementation Plan

Jayess now supports a narrow shipped private-member slice for JavaScript-style private instance members such as `#value`.

The shipped slice includes parser, semantic, runtime, and backend support for private instance field declarations, private instance methods, and private reads/writes/calls inside methods or field initializers of the declaring class.

## Required Build Areas

The current Jayess class model supports:

- constructors
- instance methods
- instance fields
- static methods
- static fields
- `this`

The current Jayess private-member model now implements:

- per-class private member identity
- cross-method and field-initializer access to the same private name
- duplicate private-name validation
- emitted hidden storage that does not flow through ordinary public object property lookup

It still does not implement:

- private static members

Because Jayess classes lower through a focused runtime object model, private members need an explicit visibility/storage design instead of being treated like ordinary string-keyed object properties.

## First Shipped Slice

The shipped private-member slice is intentionally narrow:

- support **private instance fields and private instance methods**
- use JavaScript-style `#field` syntax
- keep private static members out of the shipped slice
- keep ordinary public fields as the existing supported class-field mechanism
- keep explicit diagnostics for all unsupported private-member forms until later slices land

## First-Slice Decisions

### Surface Area

The shipped slice should support:

- private instance field declarations such as `class Box { #value = 1; }`
- private instance methods such as `class Box { #value() { return 1; } }`
- private instance reads, writes, and calls such as `this.#value`, `other.#value`, and `other.#value()` when the access occurs inside the declaring class body

The shipped slice should not support:

- private static fields
- private static methods
- private access outside methods/field initializers of the declaring class

### Private-Name Identity

Private names are **class-local identities**.

That means:

- `#value` declared in `class A` is distinct from `#value` declared in `class B`
- access is validated against the declaring class identity, not just the textual spelling
- one class body owns the private-name identity for each declared private field or private method

### Duplicate Names

Duplicate private member names inside the same class body are invalid.

The shipped slice should reject:

- two private instance fields with the same `#name` in one class
- two private instance methods with the same `#name` in one class
- a private field and a private method that reuse the same `#name` in one class

### Inheritance Behavior

Private members remain owned by the declaring class even when inheritance exists.

That means:

- a derived class does not gain direct access to a base class private field or private method through name matching
- `super` does not expose private storage
- a derived class may declare its own `#value`, and that private name is distinct from a base class `#value`

This keeps private access lexical/class-owned rather than inheritance-driven.

### Storage Model

The shipped slice uses **class-owned hidden runtime keys** rather than ordinary public object properties.

That means:

- private storage stays attached to instances in the runtime object model
- private values must not be readable through ordinary `get_property(...)`
- backend lowering should use dedicated private helpers, not public string-key lookup
- private instance methods lower as hidden per-instance bound callables stored through the same class-owned private storage model
- the runtime should treat private keys as non-public implementation detail, not Jayess-visible property names

## Implementation Direction

The remaining follow-up work should keep these rules intact:

- do not treat `#name` as an ordinary public identifier
- do not lower private fields through public object property helpers
- do not model private fields as inherited public properties

Private instance members should land through an intentional hidden-storage model in the class runtime.

## Follow-Up Policy

The next private-member follow-up work should stay split into separate slices:

1. private static fields
2. private static methods

Private static fields should remain a later separate slice because they need class-owned hidden storage on the class value rather than instance-owned hidden storage.

Private static methods should remain a further separate slice because they combine private-name visibility with class-side callable storage and class-side dispatch rules.
