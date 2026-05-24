# `jayess:color` Module

`jayess:color` is the color foundation for Jayess native rendering. It is a pure Jayess standard-library module, so imported color helpers are transpiled with user code.

## Value Shape

Color values are plain objects:

```js
{
  red: 255,
  green: 0,
  blue: 0,
  alpha: 1
}
```

`red`, `green`, and `blue` must be integer byte channels from `0` through `255`. `alpha` must be from `0` through `1`.

## Exports

- `rgb(red, green, blue)` creates an opaque color.
- `rgba(red, green, blue, alpha)` creates a color with explicit alpha.
- `parse(text)` accepts `#rgb`, `#rrggbb`, `rgb(...)`, and `rgba(...)`.
- `toHex(color)` returns lowercase `#rrggbb`.
- `withAlpha(color, alpha)` returns a copy with a different alpha value.
- `mix(left, right, amount)` linearly blends two colors.
- `lighten(color, amount)` blends toward white.
- `darken(color, amount)` blends toward black.

## Role

This module should provide deterministic color values for `jayess:image` and `jayess:canvas`.

Color parsing starts with small, explicit formats. Named color tables should be ordinary data if they are added, not parser special cases spread through rendering modules.

## Implementation Direction

Keep color helpers in Jayess source. Use native primitives only where future image or canvas modules need packed byte-level interop.
