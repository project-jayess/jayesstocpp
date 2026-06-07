# Internal Developer Tools

This package exposes the JavaScript API as its public integration surface:

```js
import { transpile, transpileFile } from "jayesstocpp";
```

The repository also includes developer-only scripts under `tools/` for local testing and fixture work. These scripts are not public package entry points, are not npm `bin` commands, and are not included in the package `files` list.

## Transpile File Tool

Use `tools/transpile-file.js` to exercise `transpileFile()` from the repository checkout:

```powershell
node tools/transpile-file.js custom-test/simple-io/src/simple-io.js custom-test/simple-io/cpp
```

The first argument is the Jayess entry file. The second argument is the generated C++ target directory. The script prints JSON with the generated files relative to the target directory.

Keep generated manual-probe output under:

```text
custom-test/<feature>/cpp/
custom-test/<feature>/dist/
```

Use automated tests under `test/` when a manual probe exposes a behavior change or bug.

## Public CLI Boundary

Public CLI behavior belongs to the separate CLI project that consumes this package. Do not add `tools/transpile-file.js` to `package.json` `bin`, and do not expose it through package exports.
