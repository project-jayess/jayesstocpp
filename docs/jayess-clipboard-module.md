# `jayess:clipboard` Module

`jayess:clipboard` is a platform-adapter-backed clipboard module for native GUI applications.

## Surface

- `readText()`
- `writeText(text)`
- `clear()`

The current shipped surface exposes the module, native bridge, and normalized unavailable diagnostic:

```text
Jayess clipboard host adapter is not available on this platform
```

Platform adapters should stay isolated by operating system.
