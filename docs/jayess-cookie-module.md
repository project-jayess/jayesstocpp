# `jayess:cookie` Module

`jayess:cookie` provides focused HTTP cookie parsing and `Set-Cookie` formatting helpers for Jayess HTTP applications.

It is a pure Jayess standard-library module layered over `jayess:http` and `jayess:string`. It is not Node.js cookie middleware compatibility.

## Exports

- `parse(header)`
- `serialize(name, value, options)`
- `get(request, name)`
- `set(response, name, value, options)`

## Cookie Parsing

`parse(header)` accepts a Cookie header string and returns a plain Jayess object keyed by cookie name.

Empty or `null` headers return an empty object.

## Cookie Serialization

`serialize(name, value, options)` returns one `Set-Cookie` header value.

Supported options:

- `path`
- `domain`
- `maxAge`
- `expires`
- `httpOnly`
- `secure`
- `sameSite`

Names and option tokens are validated as focused cookie tokens. Values reject semicolons so generated headers remain deterministic.

## HTTP Helpers

`get(request, name)` reads the request `Cookie` header through `jayess:http`.

`set(response, name, value, options)` writes a `Set-Cookie` header through `jayess:http`.
