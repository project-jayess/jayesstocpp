# Custom Window Canvas HTML Probe

`custom-test/window-canvas-html` is a manual feature probe for the Jayess rendering stack.

The probe keeps its Jayess source, HTML, and CSS together under `custom-test/window-canvas-html/src/`. The Jayess entry uses `loadHtml` and `loadCss` from `jayess:canvas` to read `../src/window-canvas-html.html` and `../src/window-canvas-html.css`, then passes those strings into `htmlRenderer` from `jayess:gui/html-renderer`. The renderer owns canvas creation, document layout, resize coalescing, event polling, presentation, and close handling, but callers choose whether HTML/CSS text comes from runtime loading, compile-time packing, or another source.

It exercises:

- `jayess:gui/html-renderer` browser-window-style orchestration over existing Jayess modules
- `jayess:canvas` HTML/CSS parsing, layout, painting, and deterministic PPM output
- `jayess:window` native window creation, show, title update, canvas presentation, event polling, close request, and close
- generated C++ project compilation through the internal `tools/compile-generated-project.js` helper

The program intentionally runs an explicit event loop after `present(window, canvas)` so the native window remains visible and responsive during manual testing. It repeatedly calls `pollEvents(window)`, coalesces resize events, handles simple left-click hit tests against the rendered HTML document, presents the canvas, and sleeps briefly. Use the native close button to exit.

The Win32 software-buffer path presents the canvas at 1:1 pixels. Resizing the native window should not stretch fixed CSS dimensions or font pixels. Responsive behavior should come from explicit resize-event handling and a new layout pass against the desired viewport bounds, not from implicit bitmap scaling.

Run the executable from `custom-test/window-canvas-html/dist` when testing manually. The probe writes `window-canvas-html.ppm` relative to the current working directory so the image lands beside the executable.

This probe also validates that runtime property probes used by canvas box-style helpers, such as reading `value.top` when `value` is numeric, return `null` instead of crashing generated C++.

The canvas HTML layout path must use Jayess standard-library string helpers such as `split(...)` and `slice(...)`; it must not depend on ambient JavaScript string methods like `text.split(...)` because generated C++ has no hidden JavaScript runtime.

Run it from the repository root:

```powershell
node tools/transpile-file.js custom-test/window-canvas-html/src/window-canvas-html.js custom-test/window-canvas-html/cpp
node tools/compile-generated-project.js custom-test/window-canvas-html/cpp custom-test/window-canvas-html/dist/window-canvas-html
custom-test/window-canvas-html/dist/window-canvas-html.exe
```

The saved image is written to:

```text
custom-test/window-canvas-html/dist/window-canvas-html.ppm
```

Hosts without a supported native window adapter may still compile successfully but fail or report adapter unavailability at runtime. That is acceptable for this manual probe; automated host-conditional window adapter checks belong under `test/runtime/`.
