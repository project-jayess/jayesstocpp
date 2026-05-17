# Class Members Implementation Plan

Jayess now supports a narrow first slice of:

- computed class member names such as `["name"]() {}`
- static initialization blocks such as `static { ... }`

The remaining work is follow-up work around broader class-side semantics, not parser-only deferral.

## Current Class Surface

The current Jayess class runtime supports:

- named instance methods
- named instance fields
- named static methods
- named static fields
- single inheritance through `extends`
- `super(...)` inside derived constructors
- `super.method(...)` inside derived instance methods

Computed class names and static blocks now have a deliberate first-slice class-evaluation model and backend/runtime support.

## First-Slice Contract

The shipped first computed-member/static-block slice follows these rules.

### Computed Key Timing

- computed class member keys evaluate exactly once, left to right, in source order within the class body
- each computed key expression runs during class definition, not lazily at later instance construction time
- a computed key may observe earlier completed class-side work, but not later class members
- side effects from computed key expressions are part of class definition order and must remain deterministic

### Static Initialization Ordering

- static field initializers and static initialization blocks run in one shared class-side sequence
- that sequence is the exact source order of static entries in the class body
- instance fields and instance methods do not run during class definition
- a static block may observe earlier static field initialization, but not later static fields or later static blocks

### Interaction With Inheritance

- a base class must finish its own class-side initialization before the derived class starts its class-side initialization
- computed keys inside a derived class evaluate only after the base class is fully defined
- `super.method(...)` remains an instance-method feature; computed keys and static blocks do not gain ad hoc `super` semantics in the first slice
- the first slice should not add static inheritance dispatch beyond the existing base-before-derived class-definition order

## Implementation Direction

Because class lowering is explicit and runtime-backed, future follow-up work should preserve these rules instead of bypassing them.

Remaining follow-up direction:

- do not add static inheritance through ad hoc emitter-only shortcuts
- do not add broader class-side `this` or `super` semantics without defining them explicitly first
- keep later extensions aligned with the class-definition ordering rules above
