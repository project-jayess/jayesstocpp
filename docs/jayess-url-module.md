# Jayess `jayess:url` Module

`jayess:url` is a Jayess-owned standard module for small URL parsing, formatting, path, and query helpers.

It does not expose ambient JavaScript `URL` instances or Node.js URL APIs. Helpers use strings and plain Jayess objects.

```js
import { getQuery, joinPath, parse, setQuery } from "jayess:url";
```

## Exports

- `parse(text)`
- `format(parts)`
- `joinPath(base, path)`
- `getQuery(url, key)`
- `setQuery(url, key, value)`

## Parsed Object Shape

`parse(text)` returns a plain Jayess object with string fields:

- `scheme`
- `host`
- `path`
- `query`
- `fragment`

Missing fields are returned as empty strings.

## Formatting Shape

`format(parts)` expects the same plain object shape. Each present field must be a string. Missing or `null` fields are treated as empty strings.

## Query Helpers

- `getQuery(url, key)` returns the first matching query value or Jayess `null`.
- `setQuery(url, key, value)` returns a new URL string with the query key added or updated.

The first slice keeps query handling deliberately small. It works on plain `key=value` pairs separated by `&`; percent-decoding belongs in `jayess:encoding`.

## Path Helper

`joinPath(base, path)` returns a new URL string with the path joined against the base URL path.

If `path` starts with `/`, it replaces the URL path. Otherwise it is appended relative to the base URL path's directory.

## Generated Output

The URL slice is split across:

- `stdlib/jayess/url/index.js`
- `stdlib/jayess/url/url-primitives.hpp`
- `src/cpp/runtime-url-source.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.
