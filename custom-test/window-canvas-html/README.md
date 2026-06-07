# Window + Canvas HTML Manual Probe

This probe renders a small HTML/CSS document through `jayess:canvas`, saves the off-screen image as a PPM file, and presents frames through `jayess:window`.

The executable runs an explicit `pollEvents(...)` loop so the native window remains responsive. Use the native close button to exit. Run it from `custom-test/window-canvas-html/dist` so the PPM output is written beside the executable.

```powershell
node tools/transpile-file.js custom-test/window-canvas-html/src/window-canvas-html.js custom-test/window-canvas-html/cpp
node tools/compile-generated-project.js custom-test/window-canvas-html/cpp custom-test/window-canvas-html/dist/window-canvas-html
custom-test/window-canvas-html/dist/window-canvas-html.exe
```

Or from the executable directory:

```powershell
cd custom-test/window-canvas-html/dist
.\window-canvas-html.exe
```

On hosts without an available native window adapter, the executable may fail at runtime after the PPM render succeeds. That is expected for manual probing; automated host-conditional window checks live under `test/runtime/`.
