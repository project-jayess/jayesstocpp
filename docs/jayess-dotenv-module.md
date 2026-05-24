# `jayess:dotenv` Module

`jayess:dotenv` provides small `.env` text parsing and formatting helpers.

## Surface

- `parse(text)` returns an object of key/value string pairs.
- `stringify(values)` formats an object as newline-separated `KEY=value` text.

## Parsing Rules

- Empty lines are ignored.
- Lines beginning with `#` after trimming are ignored.
- The first `=` separates key from value.
- Keys and values are trimmed.

The current shipped surface keeps quoting and escape handling outside the helper surface.
