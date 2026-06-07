# Window Canvas HTML Startup Diagnostics

`custom-test/window-canvas-html` includes startup timing logs for debugging first-frame latency.

The timing checkpoints cover:

- canvas creation
- native window creation
- native window show/title setup
- HTML/CSS parse
- HTML layout
- HTML paint
- first window present

The slow startup path was not system font discovery. The generated metadata can confirm this when `systemFontDiscovery.enabledByRuntimeFragment` is `false`.

The measured delay was in HTML paint. Two canvas operations were expensive when rendered through Jayess-level pixel loops:

- full-surface rectangle background and clipped rectangle fills
- full-window rectangle borders

Canvas rectangle fills now delegate to `jayess:image` native rectangle fill helpers after clipping. Rectangle strokes now paint as four filled border bands. Bitmap text paint also batches consecutive glyph pixels in each row into one rectangle fill.

For this probe, the useful timing signal is that parse and layout should finish quickly, and `startup: first present after ...` should stay close to the HTML paint timestamp. If first present becomes slow again, check paint primitives before re-enabling system font discovery.
