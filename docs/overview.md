# Jayess Overview

This repository contains a small but working first milestone of the Jayess to C++ transpiler.

## Environment

- Node.js: validated on Node `v24`
- Compiler validation: currently uses installed `clang++`

## Supported Today

- `var` and `const`
- function declarations
- default parameters
- rest parameters
- arrow functions with expression bodies and block bodies
- trailing commas in parameter lists, argument lists, array literals, object literals, import lists, and export lists
- anonymous function expressions
- named function expressions
- async function expressions
- closure capture of outer local bindings
- lexical `this` capture in arrow functions
- async arrow functions
- class declarations
- constructor methods
- instance methods
- instance field declarations with optional initializers
- static methods
- static field declarations with optional initializers
- computed class member names such as `["name"]() {}` and `static ["name"] = value`
- static initialization blocks such as `static { ... }`
- single inheritance through `extends`
- `super(...)` inside derived constructors
- `super.method(...)` inside derived instance methods
- private instance field declarations with `#field`
- private instance methods with `#method()`
- private reads and writes inside the declaring class body
- `new` class construction
- `this` inside class methods
- `return`
- `if` / `else`
- `while`
- `do ... while`
- `for`
- `switch` with literal `case` labels and one optional `default`
- `try`, `catch`, and `finally` with direct C++ exception handling
- `throw expr;`
- `async function` declarations
- `await expr` inside async function bodies
- generator declarations
- generator function expressions
- `yield expr` and `yield* expr` inside generator declaration bodies
- `break` and `continue` inside loops
- numeric and string literals
- template literals with `${expr}` interpolation
- boolean literals
- null literals
- unary logical not: `!expr`
- unary plus: `+expr`
- unary minus: `-expr`
- compound assignment operators: `+=`, `-=`, `*=`, `/=`, `%=`, `**=`
- update expressions: prefix/postfix `++`, `--`
- logical operators with short-circuit evaluation: `&&`, `||`
- nullish coalescing: `left ?? right`
- optional chaining: `obj?.prop`, `obj?.[expr]`, `fn?.(...)`
- ternary conditional expressions: `condition ? whenTrue : whenFalse`
- strict equality operators: `===`, `!==`
- modulo operator: `%`
- exponentiation operator: `**`
- array literals
- object literals with identifier or string keys
- destructuring with nested array/object patterns, pattern defaults, final rest bindings, assignment destructuring into existing identifiers, and destructuring declarations in `for` initializers
- call spread in ordinary calls, optional calls, and `new` argument lists
- array spread in array literals
- object spread in object literals
- dot property access and bracket access for arrays/objects
- built-in `.length` access for arrays and strings
- array `.push(...)` calls
- primitive `.toString()` calls for strings, numbers, booleans, and null
- dot property assignment and bracket index assignment for arrays/objects
- binary operators: `+`, `-`, `*`, `/`, `%`, `**`, `>`, `<`, `>=`, `<=`, `==`, `!=`, `===`, `!==`, `&&`, `||`
- relative Jayess module imports
- extensionless relative imports such as `./math`
- bare package imports resolved from `node_modules`
- scoped package imports such as `@scope/pkg`
- native header imports such as `import { add } from "./native/math.hpp";`
- native source side-effect imports such as `import "./native/math.cpp";`
- C++ standard library imports such as `import "cpp:vector";`
- local export specifiers such as `export { add as sum };`
- named re-exports such as `export { add as sum } from "./mod.js";`
- export-all re-exports such as `export * from "./mod.js";`
- re-export chains across Jayess modules
- default exports of value expressions across modules
- named default-exported function declarations across modules
- anonymous default-exported function declarations across modules
- named default-exported class declarations across modules
- anonymous default-exported class declarations across modules
- default imports across modules
- optional shared-library-oriented output layout for `transpileFile(..., { projectKind: "shared-library" })`
- Jayess-owned system modules:
  - `jayess:fs`
  - `jayess:path`
  - `jayess:process`

## Current Non-Goals

- ambient Node.js built-ins inside Jayess source
- full JavaScript compatibility
- direct binary output from the transpiler

## Unsupported By Design

These JavaScript features are not treated as pending transpiler gaps. They are unsupported by Jayess language design:

- `let`
- JavaScript-style `undefined` as a separate first-class value distinct from `null`
- JavaScript `Promise` as a language/runtime surface
- dynamic `import()`
- `eval(...)`
- `Function(...)`
- `with`
- JavaScript-style hoisted/function-scoped `var`

The general rule is that Jayess should not adopt JavaScript features that depend on runtime source evaluation, runtime source-module discovery/loading, broken lexical resolution, or legacy hoisting behavior that conflicts with deterministic compiled lowering.

## Standard Library Direction

Jayess is intended to grow through a mix of:

- a **small C++ runtime** for primitives the language cannot express yet
- **Jayess-written standard-library and higher-level core modules**

When practical, standard-library and core-library behavior should be written in Jayess and transpiled together with user code as part of the generated C++ project.

The remaining larger language/runtime gaps are treated as active implementation work. Until a slice is actually shipped, the transpiler should keep explicit diagnostics rather than implying partial support.

Jayess also has explicit permanent non-goals that come from being a compiled language rather than a runtime source-evaluation environment. `let` is not part of the language because Jayess `var` already fills that role, and Jayess does not support dynamic `import()`, `eval(...)`, `Function(...)`, or `with`.

Jayess also does not aim to add a separate JavaScript-style `undefined` value. The current language direction is to keep `null` as the only built-in missing-value sentinel and keep equality/truthiness rules explicit rather than coercive.

That same null-only rule is also the intended direction for implicit function completion, missing object properties, missing array elements, and optional-chaining short-circuit behavior.

The current semantics direction is also explicit on truthiness and coercion:

- empty arrays, empty objects, empty maps, and empty sets are falsey
- equality is exact-type, with identity-based comparison for composites and runtime-handle values
- JavaScript-style numeric coercion is intentionally absent

See [../Jayess.md](../Jayess.md) for the current language-direction rules and explicit permanently unsupported JavaScript features.
See [javascript-feature-gaps.md](./javascript-feature-gaps.md) for a broader list of unsupported or intentionally different JavaScript features.
See [stdlib-and-core-model.md](./stdlib-and-core-model.md) for the intended split between low-level C++ runtime support and Jayess-written standard-library/core modules.
See [semantics.md](./semantics.md) for the current truthiness, equality, and numeric-operator rules that Jayess implements today.
See [generated-project-shape.md](./generated-project-shape.md) for the current `transpileFile()` output layout and file naming rules.
See [async-await-roadmap.md](./async-await-roadmap.md) for the implementation plan for `async` / `await`.
See [jayess-async-module.md](./jayess-async-module.md) for the first planned `jayess:async` core-module surface.
See [generators-roadmap.md](./generators-roadmap.md) for the implementation plan for generators and `yield`.
See [inheritance-roadmap.md](./inheritance-roadmap.md) for the current first-slice `extends` / `super` contract and remaining follow-up work.
See [private-fields-roadmap.md](./private-fields-roadmap.md) for the current first-slice private-member contract and remaining follow-up work.
See [class-members-roadmap.md](./class-members-roadmap.md) for the current first-slice contract and remaining follow-up work for computed class member names and static initialization blocks.
See [destructuring-roadmap.md](./destructuring-roadmap.md) for the current destructuring semantics and the remaining intentionally unsupported destructuring forms.
See [builtin-module-policy.md](./builtin-module-policy.md) for the repository-owned `jayess:*` namespace and built-in module resolution contract.
See [jayess-date-module.md](./jayess-date-module.md) for the first intended `jayess:date` module surface.
See [jayess-json-module.md](./jayess-json-module.md) for the first intended `jayess:json` module surface.
See [jayess-map-module.md](./jayess-map-module.md) for the current first intended module surface and runtime-boundary decision for `jayess:collections/map`.
See [jayess-set-module.md](./jayess-set-module.md) for the current runtime-boundary decision for `jayess:collections/set`.
See [jayess-object-module.md](./jayess-object-module.md) for the first shipped `jayess:object` helper surface.
See [jayess-number-module.md](./jayess-number-module.md) for the first shipped `jayess:number` parsing surface.
See [jayess-regex-module.md](./jayess-regex-module.md) for the first shipped `jayess:regex` helper surface.
See [regex-roadmap.md](./regex-roadmap.md) for the approved first direction for Jayess-owned regular-expression support.
See [runtime-builtins-roadmap.md](./runtime-builtins-roadmap.md) for the implementation plan for larger built-ins like `Date`, `Map`, `Set`, and `JSON`.
See [node-builtins-roadmap.md](./node-builtins-roadmap.md) for the implementation plan for Jayess-provided system modules instead of ambient Node compatibility.
See [jayess-system-modules.md](./jayess-system-modules.md) for the current first-slice `jayess:fs`, `jayess:path`, and `jayess:process` surface and ownership split.
See [module-resolution-roadmap.md](./module-resolution-roadmap.md) for the current hardening direction for `export *`, package-entry behavior, and later async module-initialization follow-up.

## Diagnostics Behavior

Public APIs throw `JayessError` when compilation fails.

Internal analysis can also be used in recoverable mode with `throwOnError: false` when tests or tooling need structured diagnostics without throwing immediately.

`export *` currently re-exports named bindings only. Default exports are not forwarded through export-all alias generation, and that remains the approved Jayess rule rather than pending broader JavaScript compatibility.

Current exception-handling note:

- `try/catch/finally` is supported in a narrow first slice
- `catch` currently supports no binding or a single identifier binding
- caught Jayess thrown values round-trip through a dedicated runtime exception carrier
- non-Jayess C++ exceptions currently lower into Jayess string values via `what()`

Current async note:

- `async function` declarations and `await expr` are supported in the first shipped slice
- async functions currently lower to Jayess-owned async handles with explicit runtime completion state
- `await` currently lowers through a single-evaluation helper over Jayess async handles
- async function expressions and async arrow functions are now supported and lower through the same Jayess async-handle machinery as async function declarations
- JavaScript `Promise` is unsupported by design; async composition stays Jayess-owned through `jayess:async`
- the first shipped `jayess:async` composition surface is `resolved`, `rejected`, `all`, `race`, and `isAsync`
- async methods remain a separate later class-model slice
- async constructors remain unsupported by design
- top-level `await` remains unsupported until Jayess defines explicit module-level async initialization ordering

Current generator note:

- generator declarations with direct `yield expr` and direct `yield* expr` are supported in the shipped slice
- `yield` legality is checked against generator-function context
- generator declarations and generator function expressions lower to Jayess-owned generator handles with explicit state-slot resume lambdas
- generator function expressions are supported in the current non-class generator slice
- generator methods, async generators, and broader generator/yield forms remain outside the current slice for now

Current private-member note:

- private instance fields are supported in a narrow first slice
- `#field` declarations lower through class-owned hidden runtime storage
- private instance methods are supported in the current shipped slice
- private reads, writes, and private method calls are allowed only inside methods or field initializers of the declaring class
- private static fields and private static methods remain later separate class-side slices

Current computed-class-member note:

- computed class member names are supported in a narrow first slice for instance methods, instance fields, static methods, and static fields
- computed class keys evaluate exactly once, left to right, during class definition
- static fields and static blocks run in one shared class-side source-ordered sequence
- static blocks currently use ordinary class-side name access such as `Point.value`; they do not currently introduce a special `this` binding
- broader follow-up work such as static inheritance and richer class-side semantics remains outside the current slice

Current system-module note:

- Jayess-owned `jayess:fs`, `jayess:path`, and `jayess:process` modules are supported in a narrow first slice
- `jayess:fs` currently exports `exists`, `readText`, `writeText`, `createDirectories`, `remove`, `list`, `rename`, and `stat`
- `jayess:path` currently exports `join`, `dirname`, `basename`, `extname`, `normalize`, `resolve`, `relative`, and `isAbsolute`
- `jayess:process` currently exports `argv`, `cwd`, `getEnv`, and `exit`
- these modules resolve through the built-in module graph and lower through explicit native adapter primitives
- ambient `node:*` imports remain explicitly unsupported
- the current shipped follow-up work now includes `jayess:fs` `remove` / `list` / `rename` / narrow `stat`, `jayess:path` `resolve` / `relative` / `isAbsolute`, and `jayess:process` `argv()`
- env mutation, subprocess spawning, and additional modules such as `jayess:os`, `jayess:url`, and `jayess:timers` remain separate later decisions

Current module/export hardening note:

- `export *` permanently excludes default exports; default forwarding must stay explicit
- package `exports` support remains intentionally narrow rather than trying to emulate full Node conditional-exports behavior in the next slice
- top-level `await` is still unsupported, so async module-initialization cycle rules remain a separate later milestone rather than an active resolver rule today
- the next diagnostic-hardening work should distinguish missing packages, unsupported file types, and installed JavaScript-oriented packages that are not valid Jayess packages
- mixed graphs that combine named re-exports and `export *` are supported in the current shipped hardening slice
- duplicate exported names now fail explicitly
- packages that expose only unsupported conditional export branches now fail with focused diagnostics

Current regex note:

- a narrow helper-only `jayess:regex` slice is now shipped
- the shipped exports are `create`, `test`, `exec`, and `isRegex`
- regex literals and ambient/global `RegExp` remain unsupported

Current next-stdlib-slice note:

- `jayess:date` now also ships UTC ISO formatting, UTC component extraction, millisecond arithmetic, and narrow ISO parsing; broader timezone/formatting work stays separate
- `jayess:json` now also ships pretty-printing and small validation/failure-diagnostics helpers; reviver/replacer-like work stays separate
- `jayess:collections/map` now also ships array-producing `keys` / `values` / `entries`; bulk construction and update helpers stay separate
- `jayess:collections/set` now also ships array-producing `values` / `entries`; bulk construction and pure set-operation helpers stay separate

## Output Shape

`transpile(source)` returns a single C++ translation unit string.

`transpileFile(entryFilename, targetDirname)` writes:

- generated `.hpp` and `.cpp` files for Jayess modules
- `runtime/jayess_runtime.hpp`
- `runtime/jayess_runtime.cpp`
- copied native headers and sources under the target directory when imported

Repository-defined Jayess standard-library/core modules may also be transpiled into the output when they participate in the resolved module graph.

The preferred future built-in-module direction is a Jayess-owned namespace such as `jayess:*`, kept distinct from `node:*` and `cpp:*`.

See [standard-library-expansion-roadmap.md](./standard-library-expansion-roadmap.md) for the next approved built-in family slices beyond the currently shipped array/string helpers.

The generated project is meant to be compiled later by an external compiler such as `clang++`.

## Current Composite Value Model

- arrays lower to Jayess runtime wrappers backed by C++ `std::vector`
- objects lower to Jayess runtime wrappers backed by C++ `std::unordered_map`
- current support includes literals, dot/bracket lookup, direct member assignment, array/string `.length`, array `.push(...)`, and primitive `.toString()`
- current support also includes array `.pop()` / `.join(...)` / `.includes(...)` and string `.slice(...)` / `.substring(...)` / `.startsWith(...)` / `.includes(...)` / `.indexOf(...)` / `.endsWith(...)` through focused runtime helpers
- spread arguments and array spread currently require Jayess arrays and flatten left-to-right through explicit temporary vectors
- object spread currently copies fields from Jayess objects and callables through an explicit temporary field vector before final object construction
- assignment into object properties and array indexes uses conservative escape marking for the assigned value
- values passed into array `.push(...)` are treated as conservatively escaping for lifetime analysis

## Current Built-In Surface

- built-ins currently lower through focused runtime-recognized property/method handling rather than broad JavaScript standard-library emulation
- the long-term preferred direction is to move higher-level standard-library/core behavior into Jayess modules where the required primitives already exist
- supported today:
  - array `.length`
  - string `.length`
  - array `.push(...)`
  - array `.pop()`
  - array `.join(separator?)`
  - array `.includes(value)`
  - string `.slice(start, end?)`
  - string `.substring(start, end?)`
  - string `.startsWith(prefix)`
  - string `.includes(value)`
  - string `.indexOf(value)`
  - string `.endsWith(value)`
  - primitive `.toString()` for strings, numbers, booleans, and null
  - `jayess:object` module exports `keys(value)`, `values(value)`, and `entries(value)`
  - `jayess:number` module exports `parseInt(text)` and `parseFloat(text)`
  - `jayess:date` module exports `now()`, `fromUnixMillis(value)`, `toUnixMillis(date)`, `toIsoString(date)`, UTC component helpers, `addMillis(date, amount)`, `diffMillis(left, right)`, `parseIso(text)`, and `isDate(value)`
  - `jayess:json` module exports `parse(text)`, `stringify(value)`, `stringifyPretty(value, indent?)`, `validate(text)`, and `isJsonText(text)`
  - `jayess:collections/map` module exports `create`, `get`, `set`, `has`, `deleteKey`, `clear`, `size`, `keys`, `values`, `entries`, and `isMap`
  - `jayess:collections/set` module exports `create`, `add`, `has`, `deleteValue`, `clear`, `size`, `values`, `entries`, and `isSet`
  - `jayess:regex` module exports `create(pattern)`, `test(regex, text)`, `exec(regex, text)`, and `isRegex(value)`
- still not implemented in the current slice:
  - broad `Array.prototype` coverage
  - broad `String.prototype` coverage
  - broader numeric helper coverage
  - regex literal syntax
  - ambient/global `Date`, `Map`, `Set`, and `JSON` compatibility

## Current Closure Model

- anonymous function expressions lower to Jayess runtime callable values
- named function expressions lower through the same callable runtime path
- arrow functions lower through the same callable runtime path with implicit returns for expression bodies
- anonymous default-exported functions use the same callable lowering
- captured outer locals are copied into generated C++ lambda capture lists
- arrow functions capture outer `this` lexically when used inside methods or field initializers
- named function-expression self-bindings remain local to the function body
- captured bindings are treated as escaping for lifetime analysis

## Current Class Model

- class declarations lower to callable factory values
- named default-exported class declarations use the same class factory lowering
- anonymous default-exported class declarations use the same class factory lowering
- instance fields lower to property initialization inside the class factory
- private instance fields lower to dedicated hidden-storage initialization inside the class factory
- static members lower to properties stored on the class callable value
- computed class member keys lower through one-shot class-definition temporaries
- static initialization blocks lower as explicit class-side scoped blocks inside class construction
- `new Point(...)` lowers to a runtime call into the class factory
- constructor bodies populate `this` through runtime property setters
- field initializers run during object construction before constructor body emission
- instance methods are stored on the class value through an explicit class-side method table
- instance property lookup falls back through the instance's class link and base-class chain when a direct object property is missing
- the first inheritance slice supports one Jayess class base through `class Derived extends Base`
- derived construction links the instance to the derived class, runs the base constructor against that same instance shell, then runs derived field initializers and the remaining derived constructor body
- `super.method(...)` lowers through explicit base-class lookup and binds the current derived instance as `this`
- private instance fields use class-owned hidden runtime keys and do not participate in ordinary public property lookup
- computed class-side writes currently reuse the same property/index runtime path as other class-value property writes
- static inheritance is still outside the current slice
- `super` property assignment forms remain unsupported
