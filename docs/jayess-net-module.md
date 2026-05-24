# Jayess `jayess:net` Module

`jayess:net` is the Jayess-owned TCP networking module. It uses explicit socket handles and Jayess async handles instead of ambient Node.js `net` compatibility.

## Surface

- `connect(host, port, options)` opens a TCP client connection and returns a Jayess async handle that resolves to a socket handle.
- `connectWithCancellation(host, port, options, token)` opens a TCP client connection and rejects if the cancellation token wins first.
- `connectWithTimeout(host, port, options, milliseconds)` composes client connection with a Jayess async timeout.
- `connectWithTimeoutAndCancellation(host, port, options, milliseconds, token)` composes client connection with both timeout and cancellation.
- `listen(host, port, handler, options)` starts a TCP server and returns a server handle. `handler(socket)` receives accepted socket handles.
- `read(socket)` returns a Jayess async handle that resolves to a `jayess:bytes` payload or `null` when the peer closes cleanly.
- `readWithCancellation(socket, token)` composes socket read with a cancellation token.
- `write(socket, data)` writes a `jayess:bytes` payload and returns a Jayess async handle for completion.
- `writeWithCancellation(socket, data, token)` composes socket write with a cancellation token.
- `localAddress(socketOrServer)` returns the host-provided local address for an open socket or server.
- `localPort(socketOrServer)` returns the host-provided local port for an open socket or server.
- `remoteAddress(socket)` returns the peer address for an open connected socket.
- `remotePort(socket)` returns the peer port for an open connected socket.
- `close(socket)` closes a socket or server handle and returns `null`.

## First Slice

The implemented first slice provides a focused TCP adapter:

- client connections through `connect`
- server sockets through `listen`
- accepted socket callbacks through the `handler(socket)` argument
- byte-oriented `read` and `write`
- local and remote socket metadata inspection
- explicit `close` for socket and server handles
- Jayess async handles for `connect`, `read`, and `write`
- Jayess async timeout/cancellation wrappers for client connect, read, and write operations

The current native adapter includes POSIX sockets and a guarded Windows Winsock path. Hosts without an implemented adapter report a Jayess runtime diagnostic instead of silently emitting incompatible behavior.

## Options

- `timeoutMillis` for connection timeout behavior
- `backlog` for server listen backlog
- `reuseAddress` for server socket reuse when the host platform supports it

`connect(host, port, { timeoutMillis })` uses a non-blocking host connect attempt with a bounded wait when `timeoutMillis` is present. A timed-out connection rejects the Jayess async handle with a `Jayess net connect timed out` runtime diagnostic.

`read` and `write` currently perform bounded work on the runtime async scheduler but do not expose separate per-operation timeout options.

## Diagnostics

The module should throw Jayess runtime errors for:

- invalid `host` values
- invalid or out-of-range `port` values
- invalid socket or server handles
- local or remote metadata reads on closed handles
- non-`jayess:bytes` write payloads
- host adapter failures such as connection refused, bind failure, timeout, or peer reset
- unavailable host adapters with `Jayess net host adapter is not available on this platform` when no platform implementation is compiled

## Implementation

- Jayess wrappers live in `stdlib/jayess/net/index.js`.
- Native bridge declarations live in `stdlib/jayess/net/net-primitives.hpp`.
- Portable C++ runtime helpers live in `src/cpp/runtime-net-source.js`.
- Platform socket helpers live in `src/cpp/runtime-net-platform-source.js`.
- Socket and server handles are runtime handle values with explicit close behavior.
- The module depends on `jayess:bytes` for binary payloads and Jayess async runtime handles for async operations.

## Portability Boundary

`jayess:net` keeps the Jayess-facing API independent from host socket details:

- public runtime functions validate values and schedule async work in `runtime-net-source.js`
- POSIX socket setup, cleanup, connect, listen, read, write, metadata, and close behavior live behind `#ifndef _WIN32`
- Windows socket setup, cleanup, connect, listen, read, write, metadata, and close behavior live behind the guarded Winsock path
- unimplemented host adapters fail through one diagnostic string instead of operation-specific placeholder errors

Both implemented platform paths use the same platform helper names so the Jayess module surface and platform-neutral validation remain unchanged.
