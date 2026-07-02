# Canvas Window Probe

Manual live-window probe for Jayess canvas presentation. It renders an XML canvas scene, opens a native window through `jayess:window`, and keeps presenting until the window is closed.

```sh
node tools/transpile-file.js custom-test/canvas-window/src/canvas-window.js custom-test/canvas-window/cpp
node tools/compile-generated-project.js custom-test/canvas-window/cpp custom-test/canvas-window/dist/canvas-window
(cd custom-test/canvas-window/dist && ./canvas-window)
```

The compile helper builds a stripped, size-oriented executable by default.
Pass `--debug` before the generated C++ directory when native symbols are needed.

On Linux this requires a usable X11 or Wayland session with the required host libraries available.
