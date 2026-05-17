# Private Fields Implementation Plan

Jayess now supports a narrow first private-member slice for JavaScript-style private instance fields such as `#value`.

The shipped slice includes parser, semantic, runtime, and backend support for private instance field declarations plus private reads/writes inside methods or field initializers of the declaring class.

## Required Build Areas

The current Jayess class model supports:

- constructors
- instance methods
- instance fields
- static methods
- static fields
- `this`

The current Jayess private-member model now implements:

- per-class private field identity
- cross-method and field-initializer access to the same private name
- duplicate private-name validation
- emitted hidden storage that does not flow through ordinary public object property lookup

It still does not implement:

- private static members
- private methods

Because Jayess classes lower through a focused runtime object model, private fields need an explicit visibility/storage design instead of being treated like ordinary string-keyed object properties.

## First Shipped Slice

The first shipped private-member slice is intentionally narrow:

- support **private instance fields only**
- use JavaScript-style `#field` syntax
- keep private methods and private static members out of the first slice
- keep ordinary public fields as the existing supported class-field mechanism
- keep explicit diagnostics for all unsupported private-member forms until later slices land

## First-Slice Decisions

### Surface Area

The first slice should support:

- private instance field declarations such as `class Box { #value = 1; }`
- private instance reads and writes such as `this.#value` and `other.#value` when the access occurs inside the declaring class body

The first slice should not support:

- private instance methods
- private static fields
- private static methods
- private access outside methods/field initializers of the declaring class

### Private-Name Identity

Private names are **class-local identities**.

That means:

- `#value` declared in `class A` is distinct from `#value` declared in `class B`
- access is validated against the declaring class identity, not just the textual spelling
- one class body owns the private-name identity for each declared private field

### Duplicate Names

Duplicate private field names inside the same class body are invalid.

The first slice should reject:

- two private instance fields with the same `#name` in one class

The first slice does not yet need to define shared-name interactions with private methods or private static members because those forms remain outside the slice.

### Inheritance Behavior

Private fields remain owned by the declaring class even when inheritance exists.

That means:

- a derived class does not gain direct access to a base class private field through name matching
- `super` does not expose private storage
- a derived class may declare its own `#value`, and that private name is distinct from a base class `#value`

This keeps private access lexical/class-owned rather than inheritance-driven.

### Storage Model

The first slice should use **class-owned hidden runtime keys** rather than ordinary public object properties.

That means:

- private storage stays attached to instances in the runtime object model
- private values must not be readable through ordinary `get_property(...)`
- backend lowering should use dedicated private helpers, not public string-key lookup
- the runtime should treat private keys as non-public implementation detail, not Jayess-visible property names

## Implementation Direction

The remaining follow-up work should keep these rules intact:

- do not treat `#name` as an ordinary public identifier
- do not lower private fields through public object property helpers
- do not model private fields as inherited public properties

Private fields should land through an intentional hidden-storage model in the class runtime.
