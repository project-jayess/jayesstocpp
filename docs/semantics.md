# Current Jayess Semantics

This document records the current Jayess runtime semantics that are already implemented today.

It is intentionally descriptive, not aspirational. If behavior changes, update this file and the matching regression tests together.

## Truthiness

Jayess truthiness is narrower and more explicit than JavaScript truthiness.

Final current rule:

- `null` is falsey
- `false` is falsey and `true` is truthy
- numbers are truthy only when not equal to `0.0`
- strings are truthy only when non-empty
- arrays are truthy only when non-empty
- objects are truthy only when they have at least one stored field
- callable values are always truthy
- async handles are always truthy
- generator handles are always truthy
- maps are truthy only when non-empty
- sets are truthy only when non-empty

Important differences from JavaScript:

- empty arrays are falsey in current Jayess
- empty objects are falsey in current Jayess
- empty maps are falsey in current Jayess
- empty sets are falsey in current Jayess
- there is no separate `undefined` value model; Jayess keeps `null` as its only built-in missing-value sentinel

## Equality

Jayess equality is exact-type equality today.

Final current rule:

- values of different runtime kinds compare unequal immediately
- `null == null` and `null === null` are true
- numbers compare by numeric equality
- booleans compare by boolean equality
- strings compare by string equality
- arrays compare by shared runtime identity, not deep structural equality
- objects compare by shared runtime identity, not deep structural equality
- callables compare by shared runtime identity
- async handles compare by shared runtime identity
- generator handles compare by shared runtime identity
- maps compare by shared runtime identity
- sets compare by shared runtime identity

Current operator note:

- `==` and `===` lower through the same exact-type helper
- `!=` and `!==` lower through the same exact-type negated helper

This means JavaScript-style coercive equality is intentionally not implemented.

Important strictness note:

- `null` is not equal to `false`
- `null` is not equal to `0`
- `null` is not equal to the empty string
- Jayess does not implement JavaScript-style coercive equality around `null`

## Numeric Operators

Jayess numeric operators intentionally avoid JavaScript-style coercion.

Final current rule:

- unary `+` reads a numeric value directly
- unary `-` lowers through numeric subtraction from zero
- `-`, `*`, `/`, `%`, and `**` operate on numeric values only
- comparison helpers `>`, `<`, `>=`, and `<=` operate on numeric values only
- mixed string/number arithmetic is not part of the language contract
- booleans, `null`, arrays, objects, callables, async handles, generator handles, maps, and sets do not participate in numeric coercion

If a non-numeric runtime value reaches these helpers, the generated runtime path is intentionally outside the language contract rather than an emulation of JavaScript coercion.

## Addition

Current `+` support is intentionally narrow:

- number + number
- string + string

Mixed-type addition such as string-plus-number is not implemented as JavaScript coercion.
`"5" + 1`, `"5" - 1`, `true + 1`, and similar JavaScript coercive behavior are intentionally absent.

## Nullish Coalescing

Current `??` support is intentionally narrow:

- `left ?? right` returns `left` when `left` is not `null`
- `left ?? right` returns `right` when `left` is `null`
- only Jayess `null` participates in nullish-coalescing today

There is no separate `undefined` value model, so JavaScript-style `undefined ?? right` behavior is not part of the current contract.

## Optional Chaining

Current optional-chaining support is intentionally narrow:

- `obj?.prop` returns `null` when `obj` is `null`
- `obj?.[expr]` returns `null` when `obj` is `null`
- `fn?.(...)` returns `null` when `fn` is `null`
- otherwise the property, index, or call behaves like the non-optional form

Current contract notes:

- Jayess uses `null` as the optional-chaining short-circuit sentinel
- arguments to `fn?.(...)` are not evaluated when the callee is `null`
- computed index expressions for `obj?.[expr]` are not evaluated when the receiver is `null`

## Missing Values And Implicit Results

Jayess uses `null` as its only built-in missing-value sentinel.

Current language-direction rules:

- there is no separate `undefined` runtime value
- omitted arguments do not create a separate `undefined` value
- missing object properties do not create a separate `undefined` value
- missing array elements do not create a separate `undefined` value
- falling off the end of a function without `return expr` does not create a separate `undefined` value

Current runtime contract:

- missing object-property lookups yield Jayess `null`
- missing array-element lookups yield Jayess `null`
- declaration destructuring missing elements/properties yield Jayess `null`
- optional chaining short-circuits to Jayess `null`
- nullish coalescing tests only against Jayess `null`

The intended language direction is that implicit function completion also yields Jayess `null`, keeping one consistent missing-value sentinel across the language.

## Switch Statements

Current switch support is intentionally narrow:

- `switch` discriminants may be any Jayess expression
- `case` labels must be literal values in this slice
- `default` may appear at most once
- case matching lowers through the current exact-type equality helper
- Jayess switch uses explicit non-fallthrough semantics

Current implications:

- matching a clause executes only that clause body
- `break` is valid directly inside switch clauses
- clause-local declarations stay scoped to the matched clause body in semantic analysis

## Try, Catch, Finally

Current exception-handling support is intentionally narrow:

- Jayess `try/catch/finally` maps directly onto C++ exception handling in this slice
- `try/catch`, `try/finally`, and `try/catch/finally` are supported
- `catch` may omit a binding or use a single identifier binding such as `catch (err)`
- Jayess `throw expr;` is supported and may throw any current Jayess runtime value
- Jayess-thrown values currently travel through a dedicated runtime exception carrier
- non-Jayess C++ exceptions currently lower to Jayess string values via `std::exception::what()`

Current control-flow note:

- `finally` is guaranteed to run when control leaves the try/catch region through normal completion, `return`, `break`, `continue`, or C++ exception unwinding
- this is currently lowered through a focused RAII finalizer helper
- to keep that lowering explicit and correct, `return`, `break`, and `continue` are intentionally rejected inside `finally` blocks in this slice

## Async And Await

Current async support is intentionally narrow:

- `async function` declarations are supported
- async function expressions are supported
- async arrow functions are supported
- `await expr` is supported only inside async function bodies
- async functions return Jayess-owned async handles
- `await` evaluates its operand exactly once
- `await` returns non-async values unchanged
- `await` runs the current Jayess async scheduler when an async handle is still pending
- `await` returns the resolved value of a settled async handle
- `await` rethrows the rejection payload of a rejected async handle as a Jayess thrown value

Current limitations:

- async constructors are not supported
- top-level `await` is not supported
- the first slice uses explicit Jayess async handles rather than ambient JavaScript `Promise` behavior

## Generators And Yield

Current generator support is intentionally narrow:

- `function*` declarations are supported
- generator function expressions are supported
- generator class methods are supported
- `yield expr` is supported inside generator bodies
- `yield* expr` is supported inside generator bodies
- `yield expr` can appear inside nested blocks, `if` / `else` branches, `while` loops, and `for` loops
- selected expression-yield forms are supported, including `return yield value`, binary expressions, call arguments, and simple assignment right-hand sides
- generator-local array and object destructuring declarations are supported
- generator calls return Jayess-owned generator handles
- generator handles store explicit suspended/completed/failed state in the runtime
- generator resumption uses explicit state-slot dispatch in generated C++

Current first-slice behavior:

- direct `yield expr` stores one current yielded value and suspends
- expression `yield` resumes with the value supplied by `generator_resume_with(...)`; ordinary `generator_resume(...)` resumes with Jayess `null`
- direct `yield* expr` repeatedly resumes the delegated generator handle and re-yields its current values
- `return expr` stores one final completion value
- falling off the end completes the generator with Jayess `null`
- failed delegated resume or explicit runtime generator failure rethrows through the Jayess thrown-value path

Current limitations:

- async generators are not supported
- short-circuit expression-yield forms such as `left && (yield value)` are not supported

## Inheritance And `super`

Current inheritance support is intentionally narrow:

- `class Derived extends Base { ... }` is supported
- the base must resolve to a Jayess class value
- only single inheritance is supported
- `super(...)` is supported only inside derived constructors
- `super.method(...)` is supported only inside derived instance methods

Current first-slice construction behavior:

- constructing a derived instance first links the fresh instance shell to the derived class
- `super(...)` runs the base constructor against that same derived instance shell
- derived field initializers run after the base constructor finishes
- the remaining derived constructor body runs after derived field initialization
- if a derived class omits an explicit constructor, the current backend synthesizes a zero-argument base-constructor call

Current dispatch behavior:

- instance methods are stored in a class-side method table rather than copied onto each instance
- instance property lookup first checks direct object fields
- if a direct object field is missing, lookup falls back through the instance's class link and the base-class chain
- public static member lookup first checks the derived class value, then walks the base-class chain
- own static fields and methods take precedence over inherited static members
- `super.method(...)` skips derived methods and resolves directly against the base-class chain
- the resolved base method is called with the current derived instance bound as `this`

Current limitations:

- `super.staticMethod(...)` is not supported
- `super[expr]` is not supported
- `super` property assignment forms are not supported
- non-class base expressions are rejected
- the current backend requires `super(...)` to be the first statement in a derived constructor

## Private Members

Current private-member support is intentionally narrow:

- private instance field declarations such as `#value = 1` are supported
- private instance reads and writes such as `this.#value`, `other.#value = next`, `other.#value += 1`, and `other.#value++` are supported when they occur inside methods or field initializers of the declaring class
- private static field declarations such as `static #value = 1` are supported
- private static methods such as `static #read() { ... }` are supported
- private static access uses the declaring class name or class-side `this`
- each class owns its own private-name identity, so `#value` in one class is distinct from `#value` in another
- duplicate private field names inside one class are rejected

Current runtime behavior:

- private storage is attached to instances separately from ordinary public object properties
- private static storage is attached to the class value separately from ordinary public static properties
- private lowering uses dedicated runtime helpers instead of `get_property(...)` / `set_property(...)`
- inherited classes do not gain private access through name matching
- `super` does not expose private storage

Current limitations:

- private access outside methods or field initializers of the declaring class is rejected

## Computed Class Members And Static Blocks

Current computed-class-member support is intentionally narrow:

- computed class member names are supported for instance methods, instance fields, static methods, and static fields
- `static { ... }` blocks are supported
- computed class keys evaluate exactly once, left to right, during class definition
- computed class keys are not re-evaluated during instance construction

Current class-side ordering behavior:

- static fields and static blocks run in one shared class-side sequence
- that sequence follows source order in the class body
- a static block may observe earlier static field writes or earlier static-block writes
- later static fields and later static blocks are not visible until their own class-side step runs
- base-class class-side initialization finishes before derived-class class-side initialization begins

Current runtime behavior:

- computed class keys lower through one-shot temporary Jayess values created during class definition
- computed instance fields reuse those key temporaries later during constructor-time instance initialization
- computed static fields and computed static methods lower through the ordinary class-value index/property runtime helpers
- inherited public static fields and methods are resolved through the base-class chain when the derived class has no own class-side member with that key
- static blocks lower as explicit class-side scoped blocks inside class construction

Current limitations:

- static blocks do not currently introduce a special `this` binding
- broader JavaScript class edge cases around computed keys and class-side evaluation are still outside the current slice

## Destructuring

Current destructuring support includes:

- declaration destructuring such as `var [left, right] = value;` and `const { name, score: total } = value;`
- nested patterns such as `var [head, { nested: [left, right] }] = value;`
- pattern defaults such as `var [left = 1] = value;` and `const { name = "Jayess" } = value;`
- final rest bindings such as `var [head, ...tail] = value;` and `const { name, ...rest } = value;`
- assignment destructuring into existing identifiers such as `([left, right] = value);`
- destructuring declarations in `for` initializers
- the source expression is evaluated exactly once for each destructuring operation
- missing array elements or object properties yield Jayess `null`
- defaults trigger only when the matched value is Jayess `null`

Current limitations:

- rest bindings must remain final within their immediate pattern level and bind to a single identifier
- assignment destructuring still targets existing identifiers only
- array elisions are not supported
- destructured parameters are not supported

## Rest Parameters

Current rest-parameter support is intentionally narrow:

- rest parameters are supported in functions, methods, constructors, closures, and parenthesized arrow functions
- a rest parameter must be the final parameter
- rest parameters do not support default values
- rest parameters lower to a Jayess array containing all remaining call arguments from the rest position onward

Current limitations:

- single-identifier arrow shorthand such as `value => value` remains distinct from parenthesized rest syntax like `(...items) => items`

## Coercions Jayess Does Not Currently Implement

Current intentionally missing JavaScript coercions include:

- string-to-number coercion for arithmetic
- number-to-string coercion for mixed `+`
- coercive `==` behavior across different runtime kinds
- `undefined` participation in equality or truthiness
- JavaScript object-to-primitive coercion rules

## Contributor Guidance

- treat these semantics as current contract, not just implementation detail
- if you widen or change them, update:
  - `docs/semantics.md`
  - `docs/limitations.md`
  - relevant tests under `test/`
