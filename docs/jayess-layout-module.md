# `jayess:layout` Module

`jayess:layout` provides deterministic rectangle helpers for GUI and canvas code.

## Surface

- `rect(x, y, width, height)`
- `contains(rect, x, y)`
- `intersect(a, b)`
- `inset(rect, amount)`
- `row(area, count)`
- `column(area, count)`
- `grid(area, columns, rows)`

Rectangles use `{ x, y, width, height }`. Negative rectangle dimensions raise a focused diagnostic.
