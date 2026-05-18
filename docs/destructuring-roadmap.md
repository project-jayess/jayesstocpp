# Destructuring Implementation State

Jayess now supports a broader first destructuring slice across declarations, assignments, and `for` initializers:

- nested array and object patterns
- pattern defaults that trigger only on Jayess `null`
- final rest bindings such as `[head, ...tail]` and `{ name, ...rest }`
- assignment destructuring into already-existing identifiers
- destructuring declarations in `for` initializers

## Current Semantics

The current destructuring rules are:

- the source expression evaluates exactly once for each destructuring operation
- missing array elements and missing object properties resolve through Jayess `null`
- defaults run only when the matched value is Jayess `null`
- nested defaults compose without re-evaluating the outer source
- rest bindings remain final within their immediate pattern level
- assignment destructuring currently targets already-existing identifiers only
- destructuring in `for` initializers follows the same loop-scope and duplicate-binding rules as ordinary `for` declarations

Examples of the currently supported surface:

```js
var [head = 1, { value, nested: [left = 2, ...tail] } = fallback] = values;
({ meta: { name = "Jayess" } = info, score: total = 0 } = data);

for (var [current, ...rest] = values; current; current = current - 1) {
}
```

This keeps destructuring aligned with Jayess's null-only value model rather than a JavaScript `undefined` model.

## Current Limits

The destructuring surface is still intentionally narrower than full JavaScript:

- array elisions remain unsupported
- arbitrary member targets inside assignment destructuring remain unsupported
- destructured parameters remain unsupported

Any further destructuring expansion should stay split into small follow-up slices instead of being treated as one large “full JavaScript destructuring” milestone.
