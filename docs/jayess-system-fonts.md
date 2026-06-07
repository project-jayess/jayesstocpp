# Jayess System Fonts

Jayess can ask the generated C++ runtime to discover a host system font for canvas and window text rendering.

## API

```js
import { registerSystemDefaultFont, systemDefaultFont } from "jayess:font";

var handle = systemDefaultFont(null);
registerSystemDefaultFont("system-ui", null);
```

`systemDefaultFont(options)` returns a font handle but does not register it. `registerSystemDefaultFont(name, options)` registers the handle under `name` so canvas text options can use `fontFamily: name`.

Returned handles include:

- `kind`
- `name`
- `family`
- `sourcePath`
- `sourceFormat`
- `systemFont`
- `platform`
- `fallbackUsed`
- `charWidth`, `charHeight`, `advance`, `baseline`, `lineHeight`, `ascent`, `descent`

When discovery fails, Jayess returns or registers a bitmap alias for `jayess-default-5x7` and sets `fallbackUsed` to `true`.

## Options

- `disabled`: when `true`, skips discovery and returns the bitmap fallback.
- `searchPaths`: array of directories to probe before platform defaults. Tests should use this for deterministic behavior.
- `candidates`: array of filenames to probe inside each search path.
- Metric fields such as `charWidth`, `charHeight`, `advance`, `baseline`, `lineHeight`, `ascent`, and `descent` are passed to the existing file-backed font handle path.
- `family` sets the returned family name for discovered vector fonts.

## Platform Search

The runtime probes common system font locations:

- Windows: `%WINDIR%/Fonts`, with candidates such as `segoeui.ttf`.
- macOS: `/System/Library/Fonts` and `/Library/Fonts`, with common Apple/system fallbacks.
- Linux: common DejaVu and Noto paths under `/usr/share/fonts`.

Jayess does not copy or mutate system font files. Discovered paths are used only for validation and runtime font metadata.

## Supported Formats

Discovered fonts use the same validation path as `loadFont(...)`:

- `.ttf`
- TrueType-style `.otf`
- `.woff`
- bounded `.woff2` support for the existing runtime decoder path

CFF/CFF2 outlines and unsupported web font transform data fall back with a diagnostic instead of silently rendering with a broken font.

## Metadata

Generated `jayess_build_hints.json` and `jayess_dependency_plan.json` include `systemFontDiscovery` metadata when `jayess:font` participates in the module graph. The metadata records the retained `font` runtime fragment and the possible fallback font.

## Non-Goals

System font discovery is not a fontconfig, CoreText, DirectWrite, or browser font stack clone. It probes deterministic paths and validates files through Jayess runtime font loading. Applications that need exact typography should ship explicit font files and use `loadFont(...)`.
