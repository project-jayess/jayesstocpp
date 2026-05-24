# `jayess:terminal` Module

`jayess:terminal` provides small CLI display helpers for terminal escape sequences and terminal-size metadata.

## Surface

- `ansi(style)`
- `stripAnsi(text)`
- `cursorTo(row, column)`
- `clearScreen()`
- `clearLine()`
- `size()`

`ansi(style)` returns a focused ANSI SGR escape sequence. Supported styles are `reset`, `bold`, `dim`, `italic`, `underline`, foreground colors `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, and matching background styles such as `bgRed`.

`stripAnsi(text)` removes focused CSI escape sequences from text.

`cursorTo(row, column)` uses positive one-based terminal coordinates.

`size()` returns `{ columns, rows }` when terminal dimensions are available through the runtime fallback, otherwise `null`.

## Role

This module is for terminal display strings and simple terminal metadata. It does not own process output; use `jayess:console` for writing text.
