# `jayess:yaml` Module

`jayess:yaml` provides a config-oriented YAML subset for simple Jayess configuration files.

## Exports

- `parse(text)` parses shallow mappings and one level of two-space nested mappings.
- `stringify(data)` formats section-like objects with one nested mapping level.

## Supported YAML Subset

- `key: value` mappings
- `section:` followed by two-space indented child keys
- booleans: `true`, `false`
- `null`
- numbers through `jayess:number` parsing
- double-quoted strings
- bare strings
- inline arrays such as `[native, cpp]`
- `#` comments outside double-quoted strings

## Diagnostics

The module throws focused string diagnostics for malformed mapping lines and empty mapping keys.

## Boundaries

This module is not a full YAML implementation. It does not support anchors, aliases, tags, block scalars, multi-document streams, arbitrary indentation, or complex inline objects.
