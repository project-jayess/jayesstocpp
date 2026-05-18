# Inheritance Implementation Plan

Jayess now supports a narrow first inheritance slice through `extends`, `super(...)`, and `super.method(...)`.

The remaining work is follow-up expansion, not “whether inheritance exists”.

## Current Shipped Surface

The current Jayess class runtime now supports:

- constructors
- instance methods
- instance fields
- static methods
- static fields
- `this`
- one Jayess class base through `extends`
- `super(...)` inside derived constructors
- `super.method(...)` inside derived instance methods
- method dispatch through an explicit base-class chain

That runtime still does not yet define a safe, complete model for:

- base-constructor invocation order
- `super(...)` constructor chaining
- `super.method(...)` lookup and binding
- inherited field initialization order
- static inheritance behavior
- method dispatch through a base-class chain
- lifetime and closure interactions for broader inherited callable/property forms

Because Jayess lowers classes through a focused runtime object model rather than direct JavaScript emulation, inheritance needs explicit runtime and semantic work instead of ad hoc parser support.

## Current Repository Rule

The current rule is intentionally narrow:

- only single inheritance is supported
- the base must resolve to a Jayess class value
- `super(...)` is valid only in derived constructors
- `super.method(...)` is valid only in derived instance methods
- static inheritance is still out of scope for this slice

## Planned Build Questions

The first inheritance slice is now defined narrowly:

1. support only **single inheritance**
2. allow only **Jayess class values** as legal bases in the first slice
3. use explicit constructor and field ordering instead of JavaScript-emulation shortcuts
4. bind `super.method(...)` against the current derived instance `this`
5. keep **static inheritance outside the first shipped slice**
6. build inherited lookup through an explicit base-class link in the class runtime instead of copying members eagerly

## First Supported Surface

The first shipped inheritance slice should support:

- `class Derived extends Base { ... }`
- one direct base class only
- ordinary instance methods on the base class
- `super(...)` inside derived constructors
- `super.method(...)` inside derived instance methods

The first slice should not support:

- multiple inheritance
- non-class base expressions
- static inheritance
- `super` property assignment forms
- `super` outside derived constructors or derived instance methods

## Base-Class Eligibility

The first slice should accept only Jayess class values as legal bases.

That means:

- `extends Base` is valid only when `Base` resolves to a Jayess class declaration/class value
- native headers, native library imports, plain objects, callables, and arbitrary expressions are not legal first-slice bases
- cross-module Jayess classes remain valid as long as normal module/export resolution can identify them as Jayess class values

This keeps the runtime model bounded while constructor chaining and inherited dispatch are being added.

## Initialization Order

The first slice should use this instance-construction order:

1. allocate the derived instance shell
2. initialize base instance fields
3. run the base constructor body
4. initialize derived instance fields
5. run the derived constructor body after `super(...)`

Implications:

- base field initializers always run before derived field initializers
- derived field initializers always run before the remaining derived constructor body after `super(...)`
- a derived constructor cannot observe derived field initialization before `super(...)` completes

This keeps the ordering explicit and compatible with the current “fields before constructor body” class model while extending it through one base layer.

## `super(...)` Constructor Semantics

The first slice should keep `super(...)` explicit and narrow:

- `super(...)` is allowed only inside a derived constructor
- a derived constructor must call `super(...)` exactly once
- the call must occur before any use of `this` in the derived constructor body
- `super(...)` runs the base constructor body against the current derived instance shell, not against a separate temporary object
- if a derived class omits an explicit constructor, the transpiler may synthesize a zero-argument base-constructor call only when the base constructor also takes no required arguments

The first slice should prefer a focused semantic diagnostic over implicit JS-style flexibility when these rules are violated.

## `super.method(...)` Lookup And `this` Binding

The first slice should define `super.method(...)` as:

- look up `method` on the direct base-class method chain
- skip same-named methods on the derived class
- call the resolved base method with the current derived instance bound as `this`

This means `super.method(...)` is a base-method dispatch form, not a separate object exposing an independently bound receiver.

## Static Inheritance Policy

Static inheritance stays out of the first shipped slice.

That means:

- derived classes do not inherit static methods automatically in the first slice
- `super.staticMethod(...)` in static contexts is not part of the initial implementation
- class-side lookup can remain simpler while instance-side inheritance lands first

The next class follow-up policy should keep static inheritance as a separate later slice rather than bundling it into the next inheritance expansion by default.

## Implementation Direction

The first slice has already landed through an intentional expansion of the class runtime shape:

- explicit base-class links on class values
- explicit constructor storage/calling
- class-side method tables
- instance lookup fallback through class/base chains
- explicit base-method binding for `super.method(...)`

The remaining work should preserve that model rather than reverting to eager method copying or JavaScript-emulation shortcuts.

## Follow-Up Policy

The current follow-up policy is:

- keep static inheritance separate from instance-side inheritance follow-up work
- keep computed `super[expr]` outside the next inheritance slice
- keep `super` property assignment forms unsupported instead of treating them as pending parser work
- keep non-identifier and non-local base expressions rejected for now, rather than widening the base-expression surface before the class model is ready
- keep the current class backend unchanged for these forms until one of them is explicitly approved as a real shipped slice

This keeps inheritance follow-up aligned with Jayess's explicit class runtime instead of drifting toward broad JavaScript class flexibility by accident.
