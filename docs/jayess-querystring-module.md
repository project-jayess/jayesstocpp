# `jayess:querystring` Module

`jayess:querystring` provides small helpers for query-string style key/value data.

## Surface

- `parse(text)` returns a Jayess object.
- `stringify(values)` formats an object as `key=value&key=value` text.
- `get(values, key)` returns the value or `null`.
- `set(values, key, value)` mutates and returns the object.
- `has(values, key)` checks whether the key exists.

## Rules

- A leading `?` is ignored by `parse`.
- Empty segments are ignored.
- The first `=` separates key from value.
- Missing values parse as empty strings.
- Repeated keys use the last value.
- `+` and `%20` decode to spaces.
- Spaces encode as `+`, and `%` encodes as `%25`.

The module is Jayess-owned and does not adopt browser `URLSearchParams` object compatibility.
