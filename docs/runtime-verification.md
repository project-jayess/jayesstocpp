# Runtime Verification

Executable runtime tests live under `test/runtime/`.

These tests transpile focused Jayess fixtures into a managed project directory under `temp/test-output/`, compile the generated C++ with a tiny C++ `main`, and run the executable. The harness is intentionally small: each test calls a real exported Jayess function and checks the returned `jayess::value` shape from C++.

The covered surfaces include:

- `jayess:fs` async defaults
- `jayess:fs` `Sync` helpers
- `jayess:bytes` with `jayess:encoding`
- `jayess:events`
- `jayess:stream` read/write/copy/text/tee helpers
- `jayess:timers` sleep and timeout helpers
- `jayess:thread` spawn/join helpers
- `jayess:async` cancellation tokens
- `jayess:channel` queue-style communication helpers
- `jayess:workqueue` worker helper layer
- `jayess:subprocess` result and output stream helpers
- `jayess:net` loopback exchange
- `jayess:http` request/response exchange, multi-request server lifecycle, close diagnostics, route params, and static file serving
- workflow fixtures that combine CLI parsing, config loading, filesystem output, HTTP JSON/static serving, subprocess pipelines, stream reads, glob scanning, hashing, and async subprocess cancellation helpers
- high-level stdlib helpers layered over existing modules
- generator resume behavior
- class inheritance with `super`

Network runtime tests accept `Jayess net host adapter is not available on this platform` as a clean local skip so unsupported host adapters do not look like compiler or runtime regressions.

Workflow fixtures are kept in `test/fixtures/runtime/` and should model compact user flows rather than exhaustive API matrices:

- `workflow-cli-config-main.js` parses CLI-style arguments, loads JSON config, writes output, and reads it back.
- `workflow-http-main.js` serves a JSON route and a static file through `jayess:http`.
- `workflow-subprocess-pipeline-main.js` transforms text through `jayess:subprocess` and reads the result through `jayess:stream`.
- `workflow-fs-glob-hash-main.js` scans a directory with `jayess:glob` and hashes matching files.
- `workflow-async-cancellation-main.js` verifies async subprocess helpers that accept cancellation and timeout primitives.

Do not add GitHub workflow coverage for these tests. They are local executable validation tests and use the same compiler discovery policy as existing compile-validation tests.
