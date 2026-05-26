# Jayess Overview

This repository contains a working Jayess to C++ transpiler with a broad but intentionally curated language and standard-library surface.

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
- `super[expr](...)` inside derived instance methods
- `super.method(...)` calls inside derived static methods
- `super.name` reads inside derived static methods
- `super[expr](...)` calls and `super[expr]` reads inside derived static or instance methods
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
- destructuring with nested array/object patterns, array elisions, pattern defaults, final rest bindings, assignment destructuring into existing identifiers and public member targets, destructuring declarations in `for` initializers, and destructured parameters
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
- selected shipped Jayess-owned system modules:
  - `jayess:fs`
  - `jayess:os`
  - `jayess:path`
  - `jayess:process`
  - `jayess:system`
  - `jayess:thread`
  - `jayess:timers`
- selected shipped Jayess-owned standard-library modules:
  - `jayess:assert`
  - `jayess:array`
  - `jayess:async`
  - `jayess:bytes`
  - `jayess:buffer`
  - `jayess:console`
  - `jayess:crypto`
  - `jayess:date`
- `jayess:encoding`
- `jayess:gui`
- `jayess:iter`
  - `jayess:json`
  - `jayess:math`
  - `jayess:number`
  - `jayess:object`
  - `jayess:regex`
  - `jayess:string`
  - `jayess:time`
  - `jayess:url`
  - `jayess:collections/map`
  - `jayess:collections/set`

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

Jayess's default GUI direction is now explicit too: a Jayess-owned toolkit over `jayess:layout`, `jayess:canvas`, and `jayess:window`, not browser DOM compatibility and not Node.js GUI-package compatibility.

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
See [feature-matrix.md](./feature-matrix.md) for the authoritative quick syntax-support matrix.
See [standard-library.md](./standard-library.md) for the authoritative `jayess:*` export index.
See [standard-library-matrix.md](./standard-library-matrix.md) for the authoritative quick standard-library/module matrix.
See [runtime-verification.md](./runtime-verification.md) for the local executable checks that compile generated C++ and run selected exported functions.
See [feature-matrix.md](./feature-matrix.md), [standard-library-matrix.md](./standard-library-matrix.md), [unsupported-by-design.md](./unsupported-by-design.md), and [generated-project-layout.md](./generated-project-layout.md) for concise project indexes.
See [semantics.md](./semantics.md) for the current truthiness, equality, and numeric-operator rules that Jayess implements today.
See [generated-project-shape.md](./generated-project-shape.md) for the current `transpileFile()` output layout and file naming rules.
See [jayess-async-module.md](./jayess-async-module.md) for the shipped `jayess:async` core-module surface and generated async module-init entry point.
See [module-resolution.md](./module-resolution.md) for package import resolution, including the Jayess-specific package export condition.
See [jayess-assert-module.md](./jayess-assert-module.md) for the shipped `jayess:assert` assertion helper surface.
See [builtin-module-policy.md](./builtin-module-policy.md) for the repository-owned `jayess:*` namespace and built-in module resolution contract.
See [jayess-array-module.md](./jayess-array-module.md) for the shipped `jayess:array` helper surface.
See [jayess-string-module.md](./jayess-string-module.md) for the shipped `jayess:string` helper surface.
See [jayess-stream-module.md](./jayess-stream-module.md) for the shipped `jayess:stream` byte-stream surface.
See [jayess-object-module.md](./jayess-object-module.md) for the shipped `jayess:object` helper surface.
See [jayess-number-module.md](./jayess-number-module.md) for the shipped `jayess:number` parsing surface.
See [jayess-math-module.md](./jayess-math-module.md) for the shipped `jayess:math` helper surface.
See [jayess-date-module.md](./jayess-date-module.md) for the shipped `jayess:date` module surface.
See [jayess-json-module.md](./jayess-json-module.md) for the shipped `jayess:json` module surface.
See [jayess-map-module.md](./jayess-map-module.md) for the shipped `jayess:collections/map` module surface and runtime-boundary decision.
See [jayess-set-module.md](./jayess-set-module.md) for the shipped `jayess:collections/set` module surface and runtime-boundary decision.
See [jayess-regex-module.md](./jayess-regex-module.md) for the shipped `jayess:regex` helper surface.
See [regex-roadmap.md](./regex-roadmap.md) for the current regex boundary and shipped first expansion slice.
See [jayess-console-module.md](./jayess-console-module.md) for the shipped `jayess:console` output surface.
See [jayess-bytes-module.md](./jayess-bytes-module.md) for the shipped `jayess:bytes` binary-data surface.
See [jayess-buffer-module.md](./jayess-buffer-module.md) for the shipped `jayess:buffer` range-checked byte-buffer surface.
See [jayess-encoding-module.md](./jayess-encoding-module.md) for the shipped `jayess:encoding` helper surface.
See [jayess-events-module.md](./jayess-events-module.md) for the shipped `jayess:events` callback-emitter surface.
See [jayess-crypto-module.md](./jayess-crypto-module.md) for the shipped `jayess:crypto` helper surface.
See [jayess-url-module.md](./jayess-url-module.md) for the shipped `jayess:url` helper surface.
See [jayess-iter-module.md](./jayess-iter-module.md) for the shipped `jayess:iter` generator-helper surface.
See [jayess-time-module.md](./jayess-time-module.md) for the shipped `jayess:time` monotonic duration surface.
See [jayess-system-modules.md](./jayess-system-modules.md) for the shipped `jayess:fs`, `jayess:os`, `jayess:path`, `jayess:process`, `jayess:system`, and `jayess:thread` surfaces and ownership split.
See [jayess-timers-module.md](./jayess-timers-module.md) for the shipped `jayess:timers` helper surface.
See [jayess-os-module.md](./jayess-os-module.md) for the shipped `jayess:os` operating-system information surface.

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
- async instance and static class methods are supported through the same Jayess async-handle machinery
- JavaScript `Promise` is unsupported by design; async composition stays Jayess-owned through `jayess:async`
- the shipped `jayess:async` composition surface is `resolved`, `rejected`, `all`, `allSettled`, `any`, `race`, `sleep`, `timeout`, `catchError`, `finallyDo`, `delay`, `retry`, and `isAsync`
- async constructors remain unsupported by design
- top-level `await` remains unsupported; generated modules expose `jayess_module_init_async()` as a resolved async-handle wrapper around synchronous module initialization

Current generator note:

- generator declarations with direct `yield expr` and direct `yield* expr` are supported
- direct `yield expr` can appear inside nested blocks, `if` / `else` branches, `while` loops, `do` / `while` loops, `for` loops, and `switch` statements
- selected expression-yield forms are supported, including `return yield value`, binary expressions, short-circuit expressions, call arguments, and simple assignment right-hand sides
- generator-local array and object destructuring declarations are supported
- `yield` legality is checked against generator-function context
- generator declarations and generator function expressions lower to Jayess-owned generator handles with explicit state-slot resume lambdas
- generator function expressions and generator class methods are supported in the current generator slice
- async generators remain unsupported

Current private-member note:

- private instance fields are supported in a narrow first slice
- `#field` declarations lower through class-owned hidden runtime storage
- private instance methods are supported in the current shipped slice
- private static fields and private static methods are supported through hidden class-side storage
- private reads, writes, and private method calls are allowed only inside methods or field initializers of the declaring class

Current computed-class-member note:

- computed class member names are supported in a narrow first slice for instance methods, instance fields, static methods, and static fields
- computed class keys evaluate exactly once, left to right, during class definition
- static fields and static blocks run in one shared class-side source-ordered sequence
- static blocks currently use ordinary class-side name access such as `Point.value`; they do not currently introduce a special `this` binding
- public static member inheritance is supported; richer class-side semantics remain outside the current slice

Current system-module note:

- Jayess-owned `jayess:*` standard-library modules are supported through explicit imports
- system-facing modules include `jayess:fs`, `jayess:os`, `jayess:path`, `jayess:process`, `jayess:system`, `jayess:thread`, and `jayess:timers`
- `jayess:fs` currently exports default async filesystem helpers plus matching `Sync` variants for `exists`, `readText`, `readBytes`, `writeText`, `writeBytes`, `appendText`, `copy`, `createDirectories`, `remove`, `list`, `rename`, and `stat`
- `jayess:os` currently exports `platform`, `arch`, `homeDir`, `tmpDir`, `hostname`, and `newline`
- `jayess:path` currently exports `join`, `dirname`, `basename`, `extname`, `normalize`, `resolve`, `relative`, and `isAbsolute`
- `jayess:process` currently exports `argv`, `cwd`, `getEnv`, and `exit`
- `jayess:system` currently exports `args`, `cwd`, `getEnv`, `hasEnv`, and `exitCode`
- `jayess:thread` currently exports `spawn`, `join`, `sleep`, `hardwareConcurrency`, and `currentId`
- `jayess:timers` currently exports `sleep`, `setTimeout`, `clearTimeout`, `setInterval`, and `clearInterval`
- `jayess:fs` includes explicit recursive file-tree helpers: `walk`, `copyRecursive`, and `removeRecursive`, plus matching `Sync` variants
- `jayess:path` includes path-structure helpers: `parse`, `format`, `separator`, and `delimiter`
- `jayess:process` includes read-only environment inspection: `hasEnv`, `envKeys`, and `envEntries`
- the next active host-module implementation slice is `jayess:timers`
- `jayess:stream` currently exports `openRead`, `openWrite`, `openReadSync`, `openWriteSync`, `readChunk`, `writeChunk`, `close`, `pipe`, `pipeAll`, `pipeWithCancellation`, `copy`, `tee`, `chunks`, `readText`, `readAllBytes`, `readAllText`, `toBytes`, `toText`, `collectBytes`, `collectText`, `readLines`, `writeText`, `writeLine`, and `pipeText`
- `jayess:assert` currently exports `ok`, `equal`, `notEqual`, `fail`, and `throws`
- `jayess:console` currently exports `log`, `error`, `write`, and `writeLine`
- `jayess:bytes` currently exports `fromUtf8`, `fromArray`, `toArray`, `toUtf8`, `length`, `get`, `set`, `fill`, `slice`, `concat`, `equals`, `secureEquals`, `compare`, `startsWith`, `endsWith`, and `isBytes`
- `jayess:buffer` currently exports `create`, `fromBytes`, `toBytes`, `length`, `read`, `write`, and `concat`
- `jayess:encoding` currently exports `base64Encode`, `base64Decode`, `hexEncode`, `hexDecode`, `asciiEncode`, `asciiDecode`, `utf16Encode`, `utf16Decode`, `uriEncode`, and `uriDecode`
- `jayess:events` currently exports `create`, `on`, `once`, `off`, `emit`, and `listenerCount`
- `jayess:crypto` currently exports `sha256`, `sha512`, `sha1`, `hmacSha256`, `hmacSha512`, `hmacSha1`, `hkdfSha256`, `certificateFromPem`, `privateKeyFromPem`, `trustAnchorsFromPem`, `createHash`, `updateHash`, `digestHash`, and `randomBytes`; SHA-1 remains legacy-only for compatibility, while the shipped PEM certificate/key/trust-anchor containers feed the current `jayess:http` HTTPS/TLS option validation boundary
- `jayess:url` currently exports `parse`, `format`, `joinPath`, `getQuery`, and `setQuery`
- `jayess:time` currently exports `millis`, `seconds`, `minutes`, `elapsed`, and `formatDuration`
- `jayess:iter` currently exports `next`, `toArray`, `take`, `map`, `filter`, `forEach`, `reduce`, `some`, `every`, `find`, `chain`, and `range` for Jayess generator handles
- `jayess:array` currently exports `slice`, `concat`, `indexOf`, `includes`, `find`, `findIndex`, `some`, `every`, `join`, `reverse`, `sort`, `map`, `filter`, and `reduce`
- `jayess:string` currently exports `trim`, `startsWith`, `endsWith`, `includes`, `indexOf`, `slice`, `split`, `replaceFirst`, `replaceAll`, `padStart`, `padEnd`, `repeat`, `toLower`, and `toUpper`
- `jayess:object` currently exports `has`, `keys`, `values`, `entries`, `fromEntries`, and `assign`
- `jayess:number` currently exports `isInteger`, `isFinite`, `parseInt`, and `parseFloat`
- `jayess:math` currently exports `abs`, `floor`, `ceil`, `round`, `min`, `max`, `sqrt`, and `pow`
- `jayess:json` currently exports `parse`, `stringify`, `stringifyPretty`, `validate`, and `isJsonText`
- `jayess:date` currently exports `now`, `fromUnixMillis`, `toUnixMillis`, `toIsoString`, UTC component readers, millisecond arithmetic, `parseIso`, and `isDate`
- `jayess:regex` currently exports `create`, `test`, `exec`, `split`, `matchAll`, `replaceFirst`, `replaceAll`, and `isRegex`
- `jayess:subprocess` currently exports `run`, `runText`, `runBytes`, `runJson`, `runWithCancellation`, `runWithTimeout`, `runWithTimeoutAndCancellation`, `spawn`, `spawnPipeline`, `join`, `kill`, `stdout`, `stderr`, `ok`, and `requireSuccess`
- these modules resolve through the built-in module graph and lower through explicit native adapter primitives
- ambient `node:*` imports remain explicitly unsupported
- env mutation remains outside the current system-module surface
- subprocess execution is provided by the concrete [`jayess:subprocess`](./jayess-subprocess-module.md) module slice
- Jayess ships a real native-rendering family surface through `jayess:color`, `jayess:image`, `jayess:canvas`, `jayess:window`, and `jayess:gpu`; `jayess:image` owns raster/image manipulation while `jayess:canvas` owns higher-level drawing over that buffer; see [jayess-native-gui.md](./jayess-native-gui.md)

Current module/export hardening note:

- `export *` permanently excludes default exports; default forwarding must stay explicit
- package `exports` support remains focused: Jayess accepts root and explicit subpath targets plus `jayess`, `import`, and `default` conditions
- top-level `await` is still unsupported, so source module initialization remains closed and compile-time ordered
- package diagnostics distinguish missing packages, unsupported file types, missing package entry files, package entries outside the package root, and unsupported conditional export maps
- generated dependency metadata records module dependencies, built-in modules, selected package roots/entries, and selected package export conditions
- mixed graphs that combine named re-exports and `export *` are supported in the current shipped hardening slice
- duplicate exported names now fail explicitly
- packages that expose only unsupported conditional export branches now fail with focused diagnostics

Current regex note:

- a narrow helper-only `jayess:regex` slice is now shipped
- the shipped exports are `create`, `test`, `exec`, `split`, `matchAll`, `replaceFirst`, `replaceAll`, and `isRegex`
- regex literals and ambient/global `RegExp` are unsupported by Jayess language direction; regex stays module-owned through `jayess:regex`

Current standard-library expansion note:

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

The built-in-module direction is a Jayess-owned namespace such as `jayess:*`, kept distinct from `node:*` and `cpp:*`.

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
  - `jayess:assert` module exports `ok(value)`, `equal(left, right)`, `notEqual(left, right)`, `fail(message?)`, and `throws(callback)`
  - `jayess:object` module exports `keys(value)`, `values(value)`, and `entries(value)`
  - `jayess:number` module exports `parseInt(text)` and `parseFloat(text)`
  - `jayess:date` module exports `now()`, `fromUnixMillis(value)`, `toUnixMillis(date)`, `toIsoString(date)`, UTC component helpers, `addMillis(date, amount)`, `diffMillis(left, right)`, `parseIso(text)`, and `isDate(value)`
  - `jayess:json` module exports `parse(text)`, `stringify(value)`, `stringifyPretty(value, indent?)`, `validate(text)`, and `isJsonText(text)`
  - `jayess:array` module exports `slice`, `concat`, `indexOf`, `includes`, `find`, `findIndex`, `some`, `every`, `join`, `reverse`, `sort`, `map`, `filter`, and `reduce`
  - `jayess:collections/map` module exports `create`, `get`, `set`, `has`, `deleteKey`, `clear`, `size`, `keys`, `values`, `entries`, `fromEntries`, `setAll`, `deleteAll`, and `isMap`
  - `jayess:collections/set` module exports `create`, `add`, `has`, `deleteValue`, `clear`, `size`, `values`, `entries`, `fromValues`, `union`, `intersection`, `difference`, and `isSet`
  - `jayess:regex` module exports `create(pattern, ...flags)`, `test(regex, text)`, `exec(regex, text)`, `split(regex, text)`, `matchAll(regex, text)`, `replaceFirst(regex, text, replacement)`, `replaceAll(regex, text, replacement)`, and `isRegex(value)`
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
- generator, async, class, thread, and module-exported values that outlive their defining scope are retained through the same scope-based lifetime model

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
- instance `super.method(...)` lowers through explicit base-class lookup and binds the current derived instance as `this`
- computed instance `super[expr](...)` uses the same base method lookup after converting the computed key to a Jayess property key
- static `super.method(...)` lowers through class-side base lookup and calls the inherited public static callable
- static `super.name` reads lower through class-side base lookup
- private instance fields use class-owned hidden runtime keys and do not participate in ordinary public property lookup
- computed class-side writes currently reuse the same property/index runtime path as other class-value property writes
- public static member lookup falls back through the base-class chain, with own static fields and methods taking precedence
- `super` property assignment forms remain unsupported
