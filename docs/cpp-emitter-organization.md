# C++ Emitter Organization

The C++ emitter is organized as small helper files around one lowering responsibility where practical.

Current focused helpers include:

- `src/cpp/emit-assignment.js` for ordinary assignment, destructuring assignment, member assignment, and compound assignment lowering.
- `src/cpp/emit-call.js` for ordinary calls, optional calls, `new` call lowering, spread argument assembly, and `super(...)` constructor forwarding.
- `src/cpp/emit-member.js` for ordinary and optional member reads, namespace-import member reads, private-member reads, `super.method` reads, and built-in `.length` reads.
- `src/cpp/emit-operators.js` for unary operators, binary operators, logical short-circuiting, and nullish coalescing expression lowering.
- `src/cpp/emit-control-flow.js` for return, throw, break, continue, and block statement emission.
- `src/cpp/emit-export-aliases.js` for local export aliases, named re-export aliases, and export-all alias collection.
- `src/cpp/emit-module-declarations.js` for module-level function declarations, extern value declarations, and global value definition wiring.
- `src/cpp/emit-parameters.js` for ordinary, rest, defaulted, and destructured parameter initialization.
- `src/cpp/emit-try.js` for `try` / `catch` / `finally` statement emission and finally-control signal handlers.
- `src/cpp/emit-update.js` for identifier, member, computed member, private member, and private static update-expression lowering.
- `src/cpp/emit-variable-declaration.js` for ordinary and destructuring variable declaration statement emission.
- `src/cpp/module-imports.js` for import binding maps and native/header include collection.
- `src/cpp/module-init.js` for `jayess_module_init()` and `jayess_module_init_async()` emission.
- `src/cpp/runtime-core-value-source.js` for runtime truthiness, null checks, string conversion, and exact equality helpers.
- `src/cpp/runtime-core-composite-source.js` for runtime destructuring, spread, array push, and member/index assignment helpers.
- `src/cpp/runtime-async-scheduler-source.js` for async scheduler queues, timers, async handle validation, and cancellation token validation used by the async runtime fragment.
- `src/cpp/runtime-async-core-source.js` for async handle creation, settlement, continuations, and synchronous await helpers.
- `src/cpp/runtime-async-cancellation-source.js` for cancellation token creation, cancellation state, and `whenCancelled` behavior.
- `src/cpp/runtime-async-combinators-source.js` for async composition helpers such as `all`, `race`, `timeout`, `catchError`, `finallyDo`, and retry.
- `src/cpp/runtime-http-request-source.js` for HTTP request accessor functions used by the HTTP runtime fragment.
- `src/cpp/runtime-http-response-source.js` for HTTP response runtime state and response mutation/output functions used by the HTTP runtime fragment.
- `src/cpp/runtime-http-server-source.js` for HTTP server runtime state and server lifecycle functions used by the HTTP runtime fragment.
- `src/cpp/runtime-image-file-source.js` for image metadata, PPM/PGM/BMP/TGA file handling, and PPM byte encoding helpers used by the image runtime fragment.
- `src/cpp/runtime-net-state-source.js` for TCP socket/server runtime state used by the net runtime fragment.
- `src/cpp/runtime-net-posix-source.js` for POSIX socket adapter helpers used by the net runtime fragment.
- `src/cpp/runtime-net-windows-source.js` for Winsock adapter helpers used by the net runtime fragment.
- `src/cpp/runtime-net-platform-source.js` for combining focused net platform adapter fragments in deterministic order.
- `src/cpp/runtime-layout.js` for runtime include lists and fragment rendering order.
- `src/cpp/generator-try-shapes.js` for focused generator `try` shape classification used by generator lowering.

`src/cpp/emit-module.js` remains the module-level orchestration layer. It owns the main expression and statement dispatch, export declaration body emission, and context wiring passed into the focused helpers.

Behavior-preserving emitter extractions should keep helper APIs narrow:

- pass rendering callbacks instead of importing the full module emitter back into helper files
- keep C++ output stable unless the active checklist slice intentionally changes behavior
- verify assignment, call, member, optional chaining, private member, runtime-source, `super`, and compile-validation coverage after extraction
