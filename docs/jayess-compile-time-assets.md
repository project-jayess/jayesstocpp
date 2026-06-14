# Jayess Compile-Time Assets

`transpileFile()` supports a focused compile-time asset embedding path for canvas HTML/CSS programs.

Jayess source can import:

```js
import { packHtml, packCss } from "jayess:canvas";
```

and use static relative filenames:

```js
var html = packHtml("./window.html");
var css = packCss("./window.css");
```

During `transpileFile()`, those calls are replaced with string literals containing the file contents. The generated C++ executable contains the HTML and CSS text directly; it does not read those files from the generated `dist` directory at startup.

Rules:

- `packHtml()` accepts one static string filename ending in `.html`.
- `packCss()` accepts one static string filename ending in `.css`.
- Paths must be relative to the Jayess source file that calls the loader.
- Assets must stay inside the `transpileFile()` project root.
- Dynamic filenames are intentionally unsupported in this compile-time path.

The `jayess:canvas` pack helpers exist for source ergonomics and diagnostics. Valid `transpileFile()` output should not call them at runtime.

## Runtime Loading

`jayess:canvas` also provides explicit runtime file loaders for development workflows:

```js
import { loadHtml, loadCss } from "jayess:canvas";

var html = loadHtml("../src/window.html");
var css = loadCss("../src/window.css");
```

`loadHtml()` and `loadCss()` read the files only when user code calls them. They do not watch, poll, or compare file contents. A windowed probe can implement manual reload by calling them again, recreating the HTML document, laying it out, and repainting the canvas. Unlike `packHtml()` and `packCss()`, runtime loaders require the files to exist at the path visible to the running process.
