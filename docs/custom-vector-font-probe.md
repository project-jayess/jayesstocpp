# Custom Vector Font Probe

`custom-test/font-vector/` is a manual probe for the current file-backed font slice.

The probe:

- creates minimal license-safe `.ttf`, `.otf`, `.woff`, and `.woff2` signature fixtures at runtime under `custom-test/font-vector/dist/fonts/`
- loads them through `jayess:font`
- registers separate font-family names
- draws labeled samples into a software canvas
- writes `custom-test/font-vector/dist/font-vector.ppm`

Regenerate and compile it from the repository root:

```sh
node -e "import('./src/api/transpile-file.js').then(({ transpileFile }) => transpileFile('custom-test/font-vector/src/font-vector.js', 'custom-test/font-vector/cpp'))"
node tools/compile-generated-project.js custom-test/font-vector/cpp custom-test/font-vector/dist/font-vector
custom-test/font-vector/dist/font-vector.exe
```

On non-Windows hosts, run the generated executable path without the `.exe` suffix if the compiler helper produced a suffixless binary.

This probe validates container detection, registry selection, and deterministic canvas output. It does not validate real outline rasterization; current file-backed font handles still use fallback glyph pixels until the vector rasterizer checklist item lands.
