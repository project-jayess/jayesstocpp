# Standard Library Expansion Roadmap

Jayess already ships a narrow built-in/runtime slice for:

- array `.length`, `.push(...)`, `.pop()`, `.join(...)`, and `.includes(...)`
- string `.length`, `.slice(...)`, `.substring(...)`, `.startsWith(...)`, `.includes(...)`, `.indexOf(...)`, and `.endsWith(...)`
- primitive `.toString()`

Further standard-library expansion should proceed through small, explicit families instead of broad “support more JavaScript built-ins” milestones.

## Current Follow-Up Policy

The next standard-library work should stay split into separate bounded slices:

1. one small array method family
2. one small string method family
3. one small object helper surface
4. one small numeric parsing surface

That keeps parser, semantic, runtime, API, and compile-validation changes reviewable.

## Next Approved Array Family

The newly shipped next array family is:

- `includes(value)`

Reasons:

- it is a single-method slice instead of a multi-method family
- it fits the current array runtime shape without changing array mutation or indexing rules
- it reuses the existing Jayess equality policy instead of inventing JavaScript coercive search behavior
- it is immediately useful and easier to validate than a broader `shift` / `unshift` or `slice` family

The shipped `array.includes(value)` slice now:

- keeps argument count fixed at exactly one
- uses Jayess equality semantics, not JavaScript coercive equality
- leaves later array families such as `shift` / `unshift` or `slice` separate

## Next Approved String Family

The newly shipped string family is:

- `includes(value)`
- `indexOf(value)`
- `endsWith(value)`

Reasons:

- they are one coherent search/comparison family
- they extend the current shipped `startsWith(...)` support naturally
- they do not require trimming, locale policy, or broad Unicode normalization decisions yet

The shipped string search/comparison slice now:

- adds `string.includes(value)`
- adds `string.indexOf(value)`
- adds `string.endsWith(value)`
- keeps argument shapes narrow and explicit
- keeps `trim` and broader normalization-heavy string behavior for later slices

## Object Helper Surface

`Object.keys`, `Object.values`, and `Object.entries` should land through a Jayess-owned module surface, not as ambient global-object emulation.

The preferred module identity is:

- `jayess:object`

The first shipped object helper surface is:

- `keys(value)`
- `values(value)`
- `entries(value)`

Reasons:

- this keeps Jayess aligned with explicit module-owned standard-library design
- it avoids pretending the full JavaScript global `Object` API exists
- it lets the transpiler expose only the narrow helper family that is actually implemented

The shipped object helper slice now:

- adds a repository-owned `jayess:object` module
- exposes `keys`, `values`, and `entries` as function exports
- keeps broader `Object` compatibility work separate

## Numeric Parsing Surface

`parseInt` and `parseFloat` should land through a Jayess-owned module surface, not as ambient globals.

The preferred module identity is:

- `jayess:number`

The first approved numeric parsing surface is:

- `parseInt(text)`
- `parseFloat(text)`

Reasons:

- this keeps parsing helpers explicit instead of growing ambient JavaScript global behavior
- it matches the Jayess-owned module direction already used for `date`, `json`, `map`, `set`, and system modules
- it keeps later numeric helpers separate from the first parsing slice

The first shipped numeric parsing slice now:

- add a repository-owned `jayess:number` module
- expose `parseInt` and `parseFloat` as function exports
- keep broader numeric helpers for later work
- keep parsing narrow and explicit instead of emulating JavaScript ambient globals

## Implementation Discipline

For each of these families:

- keep explicit semantic diagnostics for not-yet-implemented names until the real slice lands
- land one family at a time
- add parser, semantic, runtime, API, and compile-validation tests for each family separately
- update overview and limitations docs after each family actually ships
