# Runtime Built-Ins Implementation Plan

Jayess does not currently provide broad JavaScript runtime built-ins such as `Date`, `Map`, `Set`, or `JSON`.

This reflects the current implementation state. The current Jayess runtime is still a small value/runtime layer aimed at predictable transpilation, explicit semantics, and scope-based lifetime behavior.

## Current Repository Rule

The current policy is:

- do not add these as ambient global constructors by default
- do not emulate large parts of the JavaScript runtime ad hoc
- prefer small, explicit future slices over one large built-ins milestone

If these features land later, they should be treated as Jayess standard-library modules or narrowly-defined runtime helpers, not as accidental compatibility shims.

Where practical, the preferred direction is:

- low-level primitive support in the C++ runtime only when required
- higher-level built-in APIs written as Jayess standard-library/core modules

## Per-Built-In Decisions

### `Date`

`Date` should not be treated as core syntax or mandatory language support.

If Jayess adds date/time support later, it should start as a library-layer abstraction rather than a globally-assumed JavaScript-compatible object.

Decision:

- future date/time support belongs in a `jayess:date` library/module layer, not in core language syntax or ambient globals
- the first `jayess:date` slice should start with `now()`, `fromUnixMillis(value)`, `toUnixMillis(date)`, and `isDate(value)`
- the next bounded `jayess:date` follow-up should stay split into separate tasks for:
  - UTC ISO formatting through `toIsoString(date)`
  - UTC component extraction helpers
  - millisecond arithmetic helpers
  - explicit UTC-only timezone policy
  - narrow ISO parsing through `parseIso(text)`

### `Map` and `Set`

`Map` and `Set` should not be forced into the current object/array wrappers.

If they land later, they likely need either:

- new runtime value kinds, or
- a deliberate standard-library wrapper design with explicit semantics

They should not be approximated through plain objects or arrays just to claim support.

Decision:

- `Map` needs a deliberate runtime value kind or a standard-library wrapper; it should not be faked through plain objects
- `Set` needs a deliberate runtime value kind or a standard-library wrapper; it should not be faked through arrays or objects
- the current first-slice direction for `Map` is a dedicated runtime value kind exposed through `jayess:collections/map`; see [jayess-map-module.md](./jayess-map-module.md)
- the current first `Map` API direction is a narrow function-export module surface: `create`, `get`, `set`, `has`, `deleteKey`, `clear`, `size`, and `isMap`
- the current first-slice direction for `Set` is a dedicated runtime value kind exposed through `jayess:collections/set`; see [jayess-set-module.md](./jayess-set-module.md)
- the current first `Set` API direction is a narrow function-export module surface: `create`, `add`, `has`, `deleteValue`, `clear`, `size`, and `isSet`

### `JSON`

`JSON` should begin, if added, as a small helper module surface rather than broad global-object emulation.

That keeps parsing/serialization behavior explicit and avoids pretending Jayess already ships the wider JavaScript standard library.

Decision:

- `JSON` should start as a small helper module surface such as `jayess:json` rather than a global object
- the first `jayess:json` slice should start with `parse(text)`, `stringify(value)`, and `isJsonText(text)`
- the first `jayess:json` slice should use a small native parse/stringify helper layer under a Jayess-owned module surface
- the next bounded `jayess:json` follow-up should stay split into separate tasks for:
  - pretty-print formatting through `stringifyPretty(value, indent?)`
  - reviver/replacer-like transforms as separate later helpers instead of direct JavaScript compatibility
  - validation/failure diagnostics through a small `validate(text)` helper

### `Map` And `Set` Follow-Up

The shipped collection slices stay intentionally narrow. Follow-up work should continue to split module-level tasks instead of broad container compatibility pushes.

Shipped follow-up:

- the shipped `jayess:collections/map` follow-up helpers are:
  - iteration helpers `keys(map)`, `values(map)`, and `entries(map)` that return Jayess arrays
  - bulk construction through `fromEntries(entries)`
  - update helpers `setAll(map, entries)` and `deleteAll(map, keys)`
- the shipped `jayess:collections/set` follow-up helpers are:
  - iteration helpers `values(set)` and `entries(set)` that return Jayess arrays
  - bulk construction through `fromValues(values)`
  - set-operation helpers `union(left, right)`, `intersection(left, right)`, and `difference(left, right)`

## Planned Build Slices

Future work, if approved, should be split into separate checklist milestones under the repository-owned `jayess:*` built-in module policy:

1. `Date` module design
2. `Map` runtime design
3. `Set` runtime design
4. `JSON` helper module design

## Implementation Direction

While those slices are still incomplete:

- keep these built-ins out of the supported surface
- avoid adding ambient globals for them
- do not grow the runtime with broad compatibility helpers
- document any future addition as a bounded Jayess feature, not “JavaScript support” in general
- prefer Jayess-written library layers over large hardcoded runtime blobs whenever the needed primitives already exist
