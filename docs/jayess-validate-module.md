# `jayess:validate` Module

`jayess:validate` provides small runtime validation helpers for Jayess values. It is useful at module boundaries, HTTP handlers, configuration loading, and command-line parsing.

## Surface

- `string()`, `number()`, `boolean()`, `array()`, `object()`
- `nullable(schema)`
- `optional(schema)`
- `arrayOf(schema)`
- `objectOf(shape)`
- `oneOf(values)`
- `validate(schema, value)`
- `assertValid(schema, value)`

`validate(schema, value)` returns `{ ok, value, errors }`. `assertValid(schema, value)` returns the original value or throws a focused `jayess:validate` diagnostic.

`optional(schema)` accepts missing object fields and `null` values. `nullable(schema)` accepts `null` values while still validating present non-null values.

The implementation is mostly Jayess source. A narrow runtime primitive supplies value type names because Jayess does not expose a general `typeof` operator.
