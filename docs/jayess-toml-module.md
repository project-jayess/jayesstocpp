# `jayess:toml` Module

`jayess:toml` provides focused parsing and formatting for common TOML config files.

## Surface

- `parse(text)` returns a Jayess object.
- `stringify(data)` formats sectioned TOML text.

## Supported Parse Shapes

- section headers such as `[package]`
- key/value assignments
- dotted keys inside the current section
- quoted strings
- booleans
- numbers
- simple comma-separated arrays
- comments starting with `#` outside quoted strings

The parser is intentionally small. Inline tables, multiline strings, date/time literals, and full TOML compatibility are outside this module slice.

## Formatting

`stringify(data)` writes top-level object keys as sections and formats scalar values as strings or booleans.
