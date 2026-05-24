# `jayess:channel` Module

`jayess:channel` provides explicit queue-style communication handles.

## Surface

- `create()` creates a channel handle.
- `send(channel, value)` pushes a value into the channel.
- `receive(channel)` returns the next queued value or `null` when the queue is empty.
- `close(channel)` marks the channel closed.
- `isClosed(channel)` reports whether the channel is closed.

## Rules

Channels are Jayess-owned runtime handles. Invalid channel handles and sending to a closed channel raise focused runtime diagnostics.

The first slice is intentionally small: `receive` is non-blocking and returns `null` for an empty queue. Blocking receives and async receive handles can be layered on top of this handle model.
