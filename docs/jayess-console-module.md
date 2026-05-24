# Jayess `jayess:console` Module

`jayess:console` is a small Jayess-owned standard module for terminal output.

It does not expose ambient JavaScript `console` or Node.js globals. Jayess source imports the helpers explicitly:

```js
import { error, log, write, writeLine } from "jayess:console";
```

## Exports

- `log(value)`
- `error(value)`
- `write(text)`
- `writeLine(text)`

## Semantics

- `log(value)` writes the Jayess string representation of `value` to standard output and appends a newline.
- `error(value)` writes the Jayess string representation of `value` to standard error and appends a newline.
- `write(text)` writes a string to standard output without appending a newline.
- `writeLine(text)` writes a string to standard output and appends a newline.
- `write(text)` and `writeLine(text)` require string input.
- all helpers return Jayess `null`.

The value formatting used by `log(value)` and `error(value)` follows the current Jayess runtime string conversion rules. Primitive strings, numbers, booleans, and `null` are supported by that conversion.

## Generated Output

The module is split across:

- `stdlib/jayess/console/index.js`
- `stdlib/jayess/console/console-primitives.hpp`
- `src/cpp/runtime-console-source.js`

`transpileFile()` resolves the module through the built-in module graph, emits the Jayess wrapper module into the generated project, and copies the native bridge header under the generated `native/` directory.
