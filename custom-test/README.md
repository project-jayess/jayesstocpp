# Manual Jayess Feature Probes

`custom-test/` is for hands-on Jayess programs that exercise language and standard-library features outside the automated `test/` suite.

Use one directory per feature:

```text
custom-test/<feature>/src/   # Jayess source
custom-test/<feature>/cpp/   # generated C++ from transpileFile()
custom-test/<feature>/dist/  # compiled binaries and run artifacts
```

Keep generated `cpp/` and `dist/` outputs local unless a task explicitly asks to check them in. When a manual probe exposes a bug, add focused automated coverage under `test/` with the fix.
