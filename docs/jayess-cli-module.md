# `jayess:cli` Module

`jayess:cli` provides small command-line argument parsing helpers layered over `jayess:process`.

## Surface

- `parse(args)` parses an explicit argument array.
- `parseArgv()` parses `argv()` entries after the executable and script positions.
- `flag(parsed, name)` returns whether a flag is present.
- `option(parsed, name, defaultValue)` returns an option value or the default.
- `positional(parsed, index, defaultValue)` returns a positional value or the default.

## Parsing Rules

- `--name=value` becomes `options.name = value`.
- `--name value` becomes `options.name = value`.
- `--name` without a following value becomes `flags.name = true`.
- `-v` becomes `flags.v = true`.
- Other values are appended to `positionals`.

This module is not a full command-line framework. It keeps a small deterministic surface for native Jayess tools.
