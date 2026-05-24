# Jayess `jayess:glob` Module

`jayess:glob` layers simple path pattern matching over `jayess:fs.walkSync` and `jayess:path`.

## Surface

- `matches(path, pattern)` returns whether a relative path matches a glob pattern.
- `globSync(root, pattern)` walks `root` and returns matching relative entries.

## Rules

- `*` matches zero or more characters inside one path segment.
- `?` matches one character inside one path segment.
- `**` matches zero or more path segments.
- Paths are normalized to `/` for matching.
- `globSync` returns the relative paths produced by `jayess:fs.walkSync`.

This module intentionally stays small and deterministic; it does not implement shell expansion, brace expansion, extglob, or runtime module discovery.
