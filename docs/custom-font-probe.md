# Custom Font Probe

`custom-test/font` is a manual feature probe for loading a deterministic bitmap font asset and rendering it through `jayess:canvas`.

It exercises:

- `jayess:font` `loadFont(...)` from a JSON bitmap font file
- `setDefaultFont(...)` and `fontFamily` selection
- `jayess:canvas` bitmap text rendering
- generated C++ project compilation through the internal `tools/compile-generated-project.js` helper

Run it from the repository root:

```powershell
node tools/transpile-file.js custom-test/font/src/font.js custom-test/font/cpp
node tools/compile-generated-project.js custom-test/font/cpp custom-test/font/dist/font
custom-test/font/dist/font.exe
```

The executable writes:

```text
custom-test/font/dist/font.ppm
```

The JSON font file uses the documented `jayess:font` shape: top-level metrics plus a `glyphs` object whose glyph rows are `0` / `1` bitmap strings.
