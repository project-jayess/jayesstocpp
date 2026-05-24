# `jayess:uuid` Module

`jayess:uuid` provides UUID helpers layered over `jayess:crypto`, `jayess:bytes`, and `jayess:encoding`.

## Surface

- `v4()` returns a random UUID version 4 string.
- `isUuid(text)` checks the stable UUID text shape: 36 characters with separators at positions 8, 13, 18, and 23.

The current shipped surface validates shape only. It does not perform broad RFC validation of every hexadecimal character.
