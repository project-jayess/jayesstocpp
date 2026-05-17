# Jayess System Modules Implementation Plan

Jayess source does not currently support ambient Node built-in imports such as:

- `node:fs`
- `node:path`
- `node:url`
- `node:process`

Those imports now fail with explicit diagnostics instead of being treated like ordinary package resolution failures.

## Current Repository Rule

The current rule is intentional:

- the transpiler implementation may use Node built-ins internally
- Jayess source code may not import Node built-ins directly
- `node:` imports are not treated as Jayess standard-library modules

This preserves the distinction between:

- JavaScript/Node implementation code for the transpiler
- Jayess source-language APIs
- native C/C++ interop through headers, sources, and libraries

## Implementation Direction

Jayess should not grow by inheriting ambient Node compatibility. Filesystem, path, and process features should land through deliberate Jayess-owned modules or adapter-backed native modules.

The current first planned Jayess-owned namespace is:

- `jayess:fs`
- `jayess:path`
- `jayess:process`

That is a standard-library and runtime design problem, not just a module-resolution tweak. See [jayess-system-modules.md](./jayess-system-modules.md) for the first planned module boundary and ownership split.

## Current Shipped Direction

The first Jayess-owned system-module slice now lands through:

- `jayess:fs`
- `jayess:path`
- `jayess:process`

`node:` imports still remain explicitly unsupported in Jayess source, and their diagnostics now point users toward the Jayess-owned system-module namespace instead of ambient Node compatibility.

## Contributor Guidance

- keep `node:` imports explicitly unsupported in Jayess source
- do not treat Node built-ins as ordinary npm packages
- do not add one-off runtime shims for individual Node APIs
- extend host-facing behavior through Jayess-owned modules and small native adapter primitives instead
