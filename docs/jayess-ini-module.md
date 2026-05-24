# Jayess `jayess:ini` Module

`jayess:ini` provides focused sectioned INI parsing and formatting helpers.

## Surface

- `parse(text)` returns an object. Root key/value pairs are stored on the root object, and `[section]` blocks become nested objects.
- `stringify(data)` writes one section per top-level key. Use an empty-string key for root-level pairs.

## Rules

- Blank lines are ignored.
- Lines starting with `#` or `;` are comments.
- Section headers use `[name]`.
- Key/value lines split at the first `=`.
- Keys and values are trimmed.

The formatter expects section values to be objects containing string-compatible values.
