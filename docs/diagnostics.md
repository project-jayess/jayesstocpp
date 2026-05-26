# Jayess Diagnostics

Jayess diagnostics should report the failing language layer and the concrete unsupported shape. The goal is to make invalid source actionable without treating unsupported-by-design features as roadmap tasks.

Every diagnostic carries:

- `phase`: the exact compiler phase label
- `category`: a stable family such as `parser`, `semantic`, `module`, `emitter`, or `runtime`
- `code`: a stable diagnostic code such as `JY_PARSE_DYNAMIC_IMPORT`
- `message`: the human-readable explanation
- optional source location and related path metadata

## Code Families

- `JY_PARSE_*` for parser diagnostics
- `JY_SEMANTIC_*` for semantic diagnostics
- `JY_MODULE_*` for module-resolution diagnostics
- `JY_EMIT_*` for generated C++ emission diagnostics
- `JY_RUNTIME_*` for runtime validation diagnostics

Generic fallback codes such as `JY_PARSE_ERROR` and `JY_MODULE_ERROR` are used when a more focused code has not been assigned yet.

## Parser Diagnostics

Parser diagnostics cover malformed or unsupported syntax before semantic analysis runs.

Current focused parser diagnostic families include:

- unsupported-by-design declarations such as `let`
- unsupported-by-design dynamic `import()`
- unsupported-by-design `with`
- unsupported-by-design regex literal syntax such as `/abc/`
- malformed control-flow clauses such as detached `catch` or `finally`
- invalid expression starts such as empty initializers, repeated commas, standalone spread, or bare `=>`
- unsupported spread/rest placement outside accepted literal, call, parameter, or binding positions
- unsupported tagged template literals

## Semantic Diagnostics

Semantic diagnostics cover syntax that parsed successfully but cannot be lowered with Jayess rules.

Current focused semantic diagnostic families include:

- undefined identifiers and unsupported ambient built-ins, including direct `jayess:*` replacement guidance for ambient JavaScript globals such as `parseInt`, `Object`, `Date`, `JSON`, `Map`, `Set`, `Promise`, and `RegExp`
- unsupported-by-design `undefined` usage, because Jayess keeps `null` as the only built-in missing-value sentinel
- unsupported-by-design runtime source evaluation through `eval` or `Function`
- invalid assignment/update targets
- unsupported binary, unary, or assignment operators before C++ emission
- const reassignment or update
- unsupported `super` member forms
- unsupported bare `super` expressions outside `super(...)` constructor calls or `super.name`/`super[expr]` member access
- derived constructors whose first statement is not `super(...)`
- generator `yield` forms that cannot be lowered into valid resumable C++
- generator statement forms that cannot currently be lowered inside generator bodies, such as nested function or class declarations
- async generator declarations and methods that remain outside Jayess-owned async semantics
- invalid loop control outside loops or switches

The main hardening codes for C++-emission prevention are:

- `JY_SEMANTIC_GENERATOR_UNSUPPORTED`
- `JY_SEMANTIC_UNDEFINED_UNSUPPORTED`
- `JY_SEMANTIC_SUPER_UNSUPPORTED`
- `JY_SEMANTIC_DESTRUCTURING_UNSUPPORTED`
- `JY_SEMANTIC_OPERATOR_UNSUPPORTED`

## Module Diagnostics

Module diagnostics keep Jayess source graphs closed and deterministic.

Current focused module diagnostic families include:

- rejected Node built-in imports such as `node:*`
- missing packages or package entry files
- package export targets that point outside the package root
- package export/import mappings with unsupported target shapes
- package export/import arrays that have no supported transpileable target, including per-entry skip reasons
- package self-reference exports that resolve through unsupported condition branches or unusable array entries
- imports or re-exports of missing exported names
- missing native header, native source, shared library, or static library artifacts copied during project generation
- invalid native import binding shapes such as binding imports from native source or library artifacts instead of the matching header import

## Runtime Diagnostics

Runtime diagnostics cover invalid values passed to generated standard-library handles and host adapters.

Current focused runtime diagnostic families include:

- invalid HTTP response, request, and server handler handles
- invalid net socket or server handles, including closed handles
- invalid stream handles and closed stream handles
- invalid subprocess handles
- invalid thread handles
- invalid crypto certificate, trust-anchor, and explicit certificate-validity timestamp helper inputs
- invalid GPU handles, buffer uploads, shader descriptors, pipeline descriptors, draw resource descriptors, and frame lifecycle operations
- unavailable HTTPS/TLS transport backends and unsupported TLS ALPN options
- unavailable host adapters for runtime-backed modules such as clipboard and window
- unsupported array, map, set, string, spread, and destructuring sources
- unsupported operands for explicit non-coercive operators
- unsupported net, HTTP, and subprocess option keys
- unsupported string conversion and template interpolation values

Generated runtime handle diagnostics use consistent message shapes:

- invalid handle type: `Jayess <module> expected a <handle> handle`
- closed handle: `Jayess <module> <handle> handle is closed`
- completed handle: `Jayess <module> <handle> handle is already <state>`
- wrong stream direction: `Jayess stream <operation> requires a <direction> stream`
- timeout: `Jayess <module> operation timed out`
- unavailable HTTPS/TLS backend: `Jayess http HTTPS transport backend is not available on this host`
- unsupported TLS ALPN: `Jayess http TLS ALPN is unsupported in the current transport slice`
- HTTPS/TLS host hook failure: `Jayess http TLS handshake failed: ...`
- HTTPS/TLS verification failure: `Jayess http TLS certificate verification failed: ...`
- GPU buffer upload bounds: `Jayess GPU uploadBuffer data exceeds buffer size`
- GPU shader stage policy: `Jayess GPU createShader stage must be vertex or fragment`
- GPU pipeline primitive policy: `Jayess GPU createPipeline primitive must be triangles or lines`
- GPU draw resource policy: `Jayess GPU draw texture binding requires an initialized texture`
- GPU draw backend policy: `Jayess GPU draw requires buffer backend to match the active frame backend`

Generated runtime validation diagnostics use these additional message shapes:

- unsupported receiver: `Jayess <module> <operation> requires <receiver> receiver`
- unsupported option key: `Jayess <module> option is unsupported: <key>`
- unsupported string conversion: `Jayess string conversion does not support <value-kind>`
- unsupported template interpolation: `Jayess template interpolation does not support this value`
- unsupported operands: `Jayess <operation> operands are unsupported`
- unsupported destructuring source: `Jayess <pattern> destructuring requires <source-kind>`
- unsupported spread source: `Jayess <spread-kind> spread requires <source-kind>`

Host-adapter runtime diagnostics use these additional message shapes:

- generic unavailable host path: `Jayess <module> host adapter is not available on this platform (...)`
- focused adapter path: `Jayess <module> host adapter is not available on this platform (<platform> <adapter> adapter is not available on this host ...)`

For `jayess:window`, unavailable-host diagnostics should preserve the stable prefix while including the adapter family and concrete missing capability where the runtime knows it, such as X11 display opening, Wayland required globals, input-seat support, or shared-memory buffer creation. Event-shape support is not a diagnostic: unsupported focus/minimize notifications are omitted until they have deterministic cross-adapter shapes, while close, resize, key, text-input, pointer, and mouse-button events are normalized through the shared event helpers.

Diagnostics should preserve filename, line, and column information when source text includes a filename. New diagnostics should be added with focused tests under `test/` and should not add GitHub workflow files.
