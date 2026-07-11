# Jayess to C++ Transpiler Checklist

This file contains the active remaining milestones for the Jayess transpiler.

Completed milestones through section 424 were moved to [archived-checklist.md](./archived-checklist.md) to keep the working checklist small and focused.

## Active Buildout Rule

The active checklist tracks implementation progress only.

The language boundaries are defined by [Jayess.md](./Jayess.md) and [Agents.md](./Agents.md).

Each active slice should:

- implement one narrow user-visible feature surface
- add only the parser, semantic, runtime, module, lowering, and docs work that the feature actually needs
- keep source files and tests small and focused
- place tests under `test/`
- place documentation under `docs/`
- keep diagnostics aligned with `Jayess.md` and `Agents.md`

## Active Items

### 425. CPU-efficient canvas XML scrolling

- [x] Add a focused `jayess:image` copy-rect primitive that copies a rectangular region within the same image buffer, handles overlapping source and destination regions safely, clips to image bounds, and reports clear diagnostics for non-integer or invalid dimensions.
- [x] Expose the copy-rect primitive through `jayess:image` and wire the generated C++ runtime feature metadata so projects using `jayess:canvas` can include it without pulling unrelated runtime code.
- [x] Add focused runtime tests under `test/` for image copy-rect behavior, including vertical overlap, horizontal overlap, clipped copies, transparent pixels, and invalid argument diagnostics.
- [x] Refactor canvas scroll redraw helpers into a small focused module or helper section so root scroll, nested shape scroll, scrollbar repainting, and dirty-region repainting do not keep growing `stdlib/jayess/canvas/core.js`.
- [x] Implement nested scroll-pane pixel scrolling for text-backed shapes: copy the existing visible content by the scroll delta, repaint only the newly exposed strip, and repaint the scrollbar gutter/thumb.
- [x] Preserve the existing text layout cache and text bitmap cache while adding scroll-copy behavior, so text measurement and text-layer generation do not rerun on ordinary wheel scroll.
- [x] Add fallback behavior for large jumps, resized panes, changed text/style, changed scrollbar image/style, or invalid caches that repaints the full scroll area instead of using copy-rect.
- [x] Implement root scene scroll acceleration with a retained root backing image or tile cache that can present the current viewport without redrawing the full scene on every wheel event.
- [x] Keep fixed-position scene elements out of the root backing scroll layer and repaint them separately after viewport presentation so fixed bottom-right overlays stay stable.
- [x] Add cache invalidation for root backing/tile caches when XML element attributes change, scene size changes, canvas size changes, images/fonts change, or antialias/render options change.
- [x] Add event coalescing for wheel, mouse-move, resize, and scrollbar-drag events so app code presents at most once per frame while still keeping pointer state current.
- [x] Add a small hit-test cache or draw-list cache for XML scenes so ordinary mouse move and wheel routing do not repeatedly scan or recompute avoidable shape data.
- [x] Add focused executable-runtime tests under `test/` for nested vertical scroll, nested horizontal scroll, root vertical scroll, fixed-position overlays during root scroll, and hover/click hit testing after scroll offsets change.
- [x] Add a low-end CPU manual probe under `custom-test/canvas-window/src/` that exercises long root content, nested scroll panes, image scrollbar thumbs, fixed overlays, and rapid wheel input.
- [x] Add lightweight scroll performance counters or optional debug logging for the manual probe that can distinguish full redraw, dirty-region redraw, copy-rect scroll, and cache-present paths.
- [x] Update `docs/jayess-canvas-xml-scenes.md` with the retained-scene scrolling model, cache invalidation rules, scrollbar behavior, and guidance for designing CPU-friendly Jayess canvas GUIs.
- [x] Transpile and compile `custom-test/canvas-window` after the slice lands.
- [x] Verify low-end-friendly behavior in `custom-test/canvas-window/dist/canvas-window.exe` with the smoke path: root scrolling uses cache-present, nested scrolling uses copy-rect, fixed overlays remain hittable, hover/click routing survives scroll offsets, and ordinary scroll avoids full-scene repaint.

