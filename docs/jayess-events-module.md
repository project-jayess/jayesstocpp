# Jayess Events Module

`jayess:events` provides a narrow event-emitter surface for Jayess callbacks. It is a Jayess-owned module, not a Node.js `EventEmitter` compatibility layer.

## Surface

- `create()`
- `on(emitter, name, callback)`
- `once(emitter, name, callback)`
- `off(emitter, name, callback)`
- `emit(emitter, name, ...args)`
- `listenerCount(emitter, name)`

## Behavior

`create()` returns an event emitter handle.

`on(emitter, name, callback)` registers a persistent listener and returns the emitter.

`once(emitter, name, callback)` registers a one-shot listener and returns the emitter. One-shot listeners are removed before their first callback invocation completes.

`off(emitter, name, callback)` removes listeners that match both the event name and callable identity. It returns the number of removed listeners.

`emit(emitter, name, ...args)` invokes matching listeners in registration order and returns the number of invoked listeners. Arguments are forwarded to each callback.

`listenerCount(emitter, name)` returns the number of listeners currently registered for an event name.

## Implementation Shape

- Jayess wrappers live in `stdlib/jayess/events/index.js`.
- Native bridge declarations live in `stdlib/jayess/events/events-primitives.hpp`.
- Runtime support lives in `src/cpp/runtime-events-source.js`.
- Event emitters are explicit runtime handles with identity-based equality.
- Listener removal uses callable identity instead of source-text or function-name matching.
