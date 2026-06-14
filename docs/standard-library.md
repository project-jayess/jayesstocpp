# Jayess Standard Library

Jayess standard-library modules live under the repository-owned `jayess:*` namespace. They are explicit imports, not ambient JavaScript or Node.js globals.

This document is the authoritative export index for shipped `jayess:*` modules. Use [standard-library-matrix.md](./standard-library-matrix.md) for the quick per-module summary table.

`node:*` imports remain unsupported in Jayess source. Use the matching `jayess:*` module when Jayess owns a portable surface for that behavior.

Generated project metadata records imported standard-library modules in `jayess_dependency_plan.json`, `jayess_module_manifest.json`, and `jayess_build_hints.json`. Native-backed modules also expose platform adapter and library requirements there, while pure Jayess modules remain ordinary generated stdlib sources under `generated-stdlib/jayess/`.

Database support is intentionally not shipped for now. The current standard library does not include `jayess:db`, `jayess:sqlite`, bundled SQLite adapters, or a repository-owned database runtime.

## Async And Sync Naming

`jayess:fs` uses default async names and `Sync` suffixed synchronous variants.

Examples:

- `readText(path)` returns a Jayess async handle.
- `await readText(path)` consumes the default async result.
- `readTextSync(path)` returns the direct synchronous value.

Other standard-library modules keep ordinary direct helper names unless their own module documentation says otherwise.

## Runtime Ownership

Some modules are mostly Jayess wrappers over a small native primitive layer:

- `jayess:assert`
- `jayess:array`
- `jayess:async`
- `jayess:bytes`
- `jayess:channel`
- `jayess:canvas`
- `jayess:clipboard`
- `jayess:compress`
- `jayess:color`
- `jayess:console`
- `jayess:cookie`
- `jayess:config`
- `jayess:crypto`
- `jayess:csv`
- `jayess:date`
- `jayess:dialog`
- `jayess:encoding`
- `jayess:events`
- `jayess:font`
- `jayess:form`
- `jayess:fs`
- `jayess:glob`
- `jayess:gpu`
- `jayess:html`
- `jayess:image`
- `jayess:ini`
- `jayess:iter`
- `jayess:json`
- `jayess:kv`
- `jayess:layout`
- `jayess:log`
- `jayess:markdown`
- `jayess:math`
- `jayess:mime`
- `jayess:number`
- `jayess:object`
- `jayess:os`
- `jayess:path`
- `jayess:process`
- `jayess:querystring`
- `jayess:regex`
- `jayess:string`
- `jayess:stream`
- `jayess:subprocess`
- `jayess:system`
- `jayess:test`
- `jayess:thread`
- `jayess:time`
- `jayess:toml`
- `jayess:url`
- `jayess:window`
- `jayess:xml`
- `jayess:yaml`
- `jayess:collections/map`
- `jayess:collections/set`
- `jayess:workqueue`

Native primitives stay narrow and explicit. Higher-level behavior should stay in Jayess modules where practical.

## Native Rendering Modules

Jayess should provide a cross-platform native rendering family through focused `jayess:*` modules:

- `jayess:color` for color values, parsing, conversion, blending, and palette helpers.
- `jayess:image` for pixel buffers, image dimensions, pixel access, and simple image file output.
- `jayess:canvas` for higher-level off-screen 2D drawing operations over image buffers and the Jayess-owned focused HTML/CSS renderer.
- `jayess:window` for live native windows, frame presentation, and input events.
- `jayess:gpu` for optional accelerated resources, pipelines, and draw commands.
- `jayess:gui` for the default Jayess-owned widget toolkit over layout, canvas-rendered documents, and normalized window events.

The current canvas implementation renders off-screen, can save deterministic image files, and can be presented through `jayess:window` where a host adapter is available. The Linux/X11 window adapter uploads validated software canvas pixels through dynamically loaded X11 image functions. The shipped layering is `jayess:color` under `jayess:image` under `jayess:canvas`, with `jayess:window` presenting canvas buffers to real native windows. `jayess:canvas` owns higher-level drawing commands and should own the focused HTML/CSS renderer over image/font/layout primitives. `jayess:gui` sits above `jayess:layout`, `jayess:canvas`, and `jayess:window` as the default Jayess-owned widget-toolkit slice; it consumes canvas-rendered documents for interaction, invalidation, action queues, and presentation. `jayess:image` owns the raster buffer and image-manipulation layer. `jayess:gpu` remains a separate optional acceleration layer rather than a requirement for `jayess:canvas` or `jayess:gui`. The portable implementation favors software rendering and deterministic image output. Live window and GPU rendering stay behind narrow runtime adapters and platform-isolated native code.

## Module Index

### `jayess:array`

Exports: `slice`, `concat`, `indexOf`, `includes`, `find`, `findIndex`, `some`, `every`, `join`, `reverse`, `sort`, `map`, `filter`, `reduce`.

### `jayess:archive`

Exports: `createTar`, `extractTar`, `createTarFromDirectory`, `createTarFromDirectorySync`, `extractTarToDirectory`, `extractTarToDirectorySync`, `writeTar`, `writeTarSync`, `readTar`, `readTarSync`. The shipped tar slice supports regular file and directory entries, deterministic relative path validation, unique normalized entry paths, mode/mtime metadata, directory-to-tar helpers, tar-to-directory helpers, and default async file helpers layered over `jayess:fs`. See [jayess-archive-module.md](./jayess-archive-module.md).

### `jayess:assert`

Exports: `ok`, `equal`, `notEqual`, `fail`, `throws`.

### `jayess:async`

Exports: `resolved`, `rejected`, `all`, `allSettled`, `any`, `race`, `sleep`, `timeout`, `withTimeout`, `catchError`, `finallyDo`, `delay`, `retry`, `isAsync`, `createCancellationToken`, `cancel`, `isCancelled`, `cancellationReason`, `whenCancelled`, `withCancellation`, `sleepWithCancellation`, `timeoutWithCancellation`.

### `jayess:bytes`

Exports: `fromUtf8`, `fromArray`, `toArray`, `toUtf8`, `length`, `get`, `set`, `fill`, `slice`, `concat`, `equals`, `secureEquals`, `compare`, `startsWith`, `endsWith`, `isBytes`.

### `jayess:buffer`

Exports: `create`, `fromBytes`, `toBytes`, `length`, `read`, `write`, `concat`.

### `jayess:channel`

Exports: `create`, `send`, `receive`, `close`, `isClosed`. See [jayess-channel-module.md](./jayess-channel-module.md).

### `jayess:clipboard`

Exports: `readText`, `writeText`, `clear`. See [jayess-clipboard-module.md](./jayess-clipboard-module.md).

### `jayess:compress`

Exports: `deflate`, `inflate`, `gzip`, `gunzip`. See [jayess-compress-module.md](./jayess-compress-module.md).

### `jayess:canvas`

Exports: `create`, `clear`, `width`, `height`, `getPixel`, `copy`, `saveState`, `restoreState`, `setFillColor`, `setStrokeColor`, `setStrokeWidth`, `setTextColor`, `setTextSize`, `translate`, `scale`, `fillRect`, `clipRect`, `currentClip`, `pushClip`, `popClip`, `fillRectClipped`, `fillRectAlpha`, `strokeRect`, `drawImage`, `drawImageClipped`, `drawCanvas`, `fillCircle`, `strokeCircle`, `fillEllipse`, `strokeEllipse`, `line`, `polyline`, `quadraticCurve`, `bezierCurve`, `fillPolygon`, `strokePolygon`, `measureText`, `text`, `drawTextBox`, `parseHtml`, `parseCss`, `createHtmlDocument`, `layoutHtml`, `hitTestHtml`, `drawHtml`, `savePpm`, `saveImage`. See [jayess-canvas-module.md](./jayess-canvas-module.md) and [jayess-canvas-html-css.md](./jayess-canvas-html-css.md).

The shipped state slice includes a clip stack, save/restore, fill/stroke/text defaults, and focused translate/scale transforms. Pixel-writing helpers route through active clip and transform state. The HTML/CSS renderer belongs to `jayess:canvas` and exposes focused document parsing, CSS parsing, descendant selector matching, min/max box-model layout metadata, margin/padding shorthand metadata, `overflow: hidden` clipping, adjacent inline text wrapping, disabled control metadata, hit-testing, and paint helpers for GUI and off-screen use.
The shipped stroke-style slice is `strokeWidth` only; caps and joins stay separate later slices.

### `jayess:collections/map`

Exports: `create`, `get`, `set`, `has`, `deleteKey`, `clear`, `size`, `keys`, `values`, `entries`, `fromEntries`, `setAll`, `deleteAll`, `isMap`.

### `jayess:collections/set`

Exports: `create`, `add`, `has`, `deleteValue`, `clear`, `size`, `values`, `entries`, `fromValues`, `union`, `intersection`, `difference`, `isSet`.

### `jayess:cli`

Exports: `parse`, `parseArgv`, `flag`, `option`, `positional`.

### `jayess:color`

Exports: `rgb`, `rgba`, `parse`, `toHex`, `mix`, `lighten`, `darken`, `withAlpha`. See [jayess-color-module.md](./jayess-color-module.md).

### `jayess:console`

Exports: `log`, `error`, `write`, `writeLine`, `readLine`, `readStdin`, `prompt`.

### `jayess:cookie`

Exports: `parse`, `serialize`, `get`, `set`. See [jayess-cookie-module.md](./jayess-cookie-module.md).

### `jayess:config`

Exports: `load`, `loadSync`, `loadJson`, `loadJsonSync`, `loadToml`, `loadTomlSync`, `loadIni`, `loadIniSync`, `loadDotenv`, `loadDotenvSync`, `merge`, `get`, `requireKey`. See [jayess-config-module.md](./jayess-config-module.md).

### `jayess:crypto`

Exports: `sha256`, `sha512`, `sha1`, `hmacSha256`, `hmacSha512`, `hmacSha1`, `hkdfSha256`, `certificateFromPem`, `certificateFingerprint`, `certificateVerificationMetadata`, `findTrustAnchorByFingerprint`, `certificateValidityAt`, `certificateChainMetadata`, `certificateMetadata`, `certificateSubject`, `certificateIssuer`, `certificateSerialNumber`, `certificateValidityStart`, `certificateValidityEnd`, `privateKeyFromPem`, `privateKeyMetadata`, `privateKeyKind`, `privateKeyEncodedLength`, `trustAnchorsFromPem`, `validateTrustAnchors`, `createHash`, `updateHash`, `digestHash`, `randomBytes`. `sha1`, `hmacSha1`, and `createHash("sha1")` are legacy-only compatibility helpers; prefer the SHA-256 or SHA-512 surface for new code. The PEM helpers return normalized Jayess-owned certificate/private-key/trust-anchor containers plus focused metadata, fingerprints, explicit-time validity metadata, trust-anchor lookup, and metadata-only chain summaries for HTTP TLS option validation. They do not create TLS transports or perform host trust-store verification. See [jayess-crypto-module.md](./jayess-crypto-module.md).

### `jayess:csv`

Exports: `parse`, `stringify`. See [jayess-csv-module.md](./jayess-csv-module.md).

### `jayess:date`

Exports: `now`, `fromUnixMillis`, `toUnixMillis`, `toIsoString`, `getUtcYear`, `getUtcMonth`, `getUtcDay`, `getUtcHour`, `getUtcMinute`, `getUtcSecond`, `getUtcMillisecond`, `addMillis`, `diffMillis`, `parseIso`, `isDate`.

### `jayess:dialog`

Exports: `openFile`, `saveFile`, `openDirectory`, `message`. The current shipped host-backed slices are Win32 and Cocoa. Linux is kept on the explicit `xdg-desktop-portal` adapter family boundary and reports the focused unavailable-host diagnostic when that host path cannot be used. Picker dialogs normalize cancellation to `null`; `openFile({ multiple: true })` returns an array of selected paths, while single-select `openFile(...)`, `saveFile(...)`, and `openDirectory(...)` return one path string. File filters use `{ name, extensions }` entries, `saveFile(...)` accepts `defaultName`, and `message(...)` accepts `detail` text while normalizing results to `"ok"`, `"cancel"`, `"yes"`, or `"no"`. See [jayess-dialog-module.md](./jayess-dialog-module.md).

### `jayess:dotenv`

Exports: `parse`, `stringify`.

### `jayess:encoding`

Exports: `base64Encode`, `base64Decode`, `hexEncode`, `hexDecode`, `asciiEncode`, `asciiDecode`, `utf16Encode`, `utf16Decode`, `uriEncode`, `uriDecode`.

### `jayess:events`

Exports: `create`, `on`, `once`, `off`, `emit`, `listenerCount`.

### `jayess:font`

Exports: `defaultFont`, `createFont`, `registerFont`, `getFont`, `setDefaultFont`, `loadFont`, `fontMetrics`, `measureGlyph`, `measureText`, `lineHeight`, `charWidth`, `drawText`, `drawTextAligned`. The current module supports deterministic bitmap JSON fonts plus file-backed TTF, TrueType-style OTF, WOFF, and WOFF2 handles for metrics and registry selection. See [jayess-font-module.md](./jayess-font-module.md).

### `jayess:form`

Exports: `parseUrlEncoded`, `stringifyUrlEncoded`, `field`, `setField`. See [jayess-form-module.md](./jayess-form-module.md).

### `jayess:fs`

Default async exports: `exists`, `readText`, `readBytes`, `writeText`, `writeBytes`, `appendText`, `copy`, `copyRecursive`, `createDirectories`, `remove`, `removeRecursive`, `list`, `walk`, `rename`, `stat`.

Synchronous exports: `existsSync`, `readTextSync`, `readBytesSync`, `writeTextSync`, `writeBytesSync`, `appendTextSync`, `copySync`, `copyRecursiveSync`, `createDirectoriesSync`, `removeSync`, `removeRecursiveSync`, `listSync`, `walkSync`, `renameSync`, `statSync`.

Recursive tree helpers return deterministic walk entry objects and reject empty paths, traversal segments, unsupported options, and copy targets inside the source tree. See [jayess-fs-module.md](./jayess-fs-module.md).

### `jayess:glob`

Exports: `matches`, `globSync`. See [jayess-glob-module.md](./jayess-glob-module.md).

### `jayess:gpu`

Exports: `createDevice`, `createSurface`, `createBuffer`, `uploadBuffer`, `createTexture`, `uploadImage`, `createShader`, `createPipeline`, `beginFrame`, `clear`, `draw`, `endFrame`. Runtime handles record backend capability metadata, deterministic buffer bytes, shader/pipeline metadata, texture pixels, descriptor-backed draw bindings, and command/frame lifecycle shapes before broader real-backend adapters are available. See [jayess-gpu-module.md](./jayess-gpu-module.md).

### `jayess:gui`

Exports: `createApplication`, `createWindowState`, `setRoot`, `invalidate`, `needsRedraw`, `drainActions`, `createLabel`, `createButton`, `createTextInput`, `createCheckbox`, `createRadio`, `value`, `setValue`, `selection`, `accessibility`, `checked`, `setChecked`, `formState`, `createPanel`, `createStack`, `createColumn`, `createRow`, `layout`, `update`, `draw`, `runGuiFrame`, `attachHtmlDocument`, `updateHtmlDocument`, `drawHtmlDocument`. The `jayess:gui/html-renderer` submodule exports `htmlRenderer`, `runHtmlRenderer`, `updateHtmlRenderer`, `reloadHtmlRenderer`, `showHtmlRenderer`, `shouldCloseHtmlRenderer`, `closeHtmlRenderer`, and `drainHtmlRendererActions`; callers pass HTML/CSS text from `loadHtml`, `loadCss`, `packHtml`, `packCss`, or another source. See [jayess-gui-module.md](./jayess-gui-module.md).

The first shipped slice is a pure Jayess-owned software toolkit layer. It records click, text `input`, text `change`, checkbox/radio `change`, HTML click, HTML submit, HTML input focus, HTML input, and HTML change actions through an explicit action queue instead of hiding a broad callback/runtime loop, and it stays above `jayess:layout`, `jayess:canvas`, and normalized `jayess:window` events without depending on `jayess:gpu`. Disabled canvas-rendered HTML controls expose metadata and skip interaction actions. `runGuiFrame(...)` is a one-frame helper for explicit event/update/callback/draw/present flow and reports deterministic render/present/close/action metadata. Text inputs expose collapsed selection metadata, and widgets expose plain accessibility-style metadata without binding to browser or OS accessibility APIs. GUI should use the `jayess:canvas` HTML/CSS renderer for document-style UI rather than owning a separate browser DOM or renderer.

### `jayess:html`

Exports: `escapeText`, `escapeAttribute`, `sanitizeSubset`, `fragment`, `tag`. See [jayess-html-module.md](./jayess-html-module.md).

### `jayess:hash`

Exports: `sha256Bytes`, `sha1Bytes`, `sha256Text`, `sha1Text`, `sha256File`, `sha1File`, `sha256FileSync`, `sha1FileSync`, `sha256TextFile`, `sha256TextFileSync`, `streamSha256`, `streamSha1`.

### `jayess:http`

Exports: `request`, `requestWithCancellation`, `requestWithTimeout`, `requestWithTimeoutAndCancellation`, `text`, `bytes`, `json`, `textBody`, `bytesBody`, `jsonBody`, `method`, `path`, `url`, `pathname`, `query`, `queryParam`, `params`, `headers`, `header`, `body`, `bodyText`, `bodyBytes`, `collectBody`, `createServer`, `close`, `state`, `setStatus`, `status`, `setHeader`, `write`, `end`, `sendText`, `sendJson`, `sendBytes`, `sendTextStream`, `sendBytesStream`, `notFound`, `redirect`, `sendFile`, `serveStatic`, `serveFiles`, `route`, `router`, `match`, `handle`, `compose`, `signSession`, `verifySession`, `getSignedCookie`, `setSignedCookie`.

The current shipped data path is plain HTTP plus a host-backed HTTPS client hook. Platform-neutral HTTPS/TLS option validation covers `https://` requests and `createServer(..., { tls })`. Valid TLS option shapes use Jayess-owned certificate/private-key/trust-anchor containers from `jayess:crypto`; client requests then either use a registered `host-tls` adapter or report the normalized unavailable-backend diagnostic. The server/runtime path now has both Unix/POSIX and Windows/Winsock-backed slices for the same focused HTTP/1.1 close-per-connection behavior.
The current production claim is limited to that explicit plain-HTTP data path, client HTTPS hook boundary, TLS option validation boundary, and deliberate diagnostics. Server guardrails include configurable header/body byte limits, configurable idle/header/body read timeouts, graceful close behavior, and a small `state(server)` helper for lifecycle inspection. Server-side live TLS, host trust-store integration, ALPN, and HTTP/2 are outside the current shipped transport path.

See [jayess-http-module.md](./jayess-http-module.md) and [jayess-https-transport.md](./jayess-https-transport.md).

### `jayess:image`

Exports: `create`, `width`, `height`, `metadata`, `metadataFromFile`, `getPixel`, `setPixel`, `fill`, `copy`, `savePpm`, `saveBmp`, `savePgm`, `saveTga`, `loadPpm`, `loadBmp`, `loadPgm`, `loadTga`, `encodePpm`, `decodePpm`, `crop`, `resizeNearest`, `blit`, `flipHorizontal`, `flipVertical`, `rotate90`, `transparentBlit`, `isImage`. See [jayess-image-module.md](./jayess-image-module.md).

### `jayess:iter`

Exports: `next`, `toArray`, `take`, `map`, `filter`, `forEach`, `reduce`, `some`, `every`, `find`, `chain`, `range`.

### `jayess:json`

Exports: `parse`, `stringify`, `stringifyPretty`, `validate`, `isJsonText`.

### `jayess:kv`

Exports: `open`, `get`, `getSync`, `set`, `setSync`, `has`, `hasSync`, `deleteKey`, `deleteKeySync`, `keys`, `keysSync`. See [jayess-kv-module.md](./jayess-kv-module.md).

### `jayess:layout`

Exports: `rect`, `contains`, `intersect`, `inset`, `row`, `column`, `grid`. See [jayess-layout-module.md](./jayess-layout-module.md).

### `jayess:log`

Exports: `debug`, `info`, `warn`, `error`, `withLevel`, `formatJson`. See [jayess-log-module.md](./jayess-log-module.md).

### `jayess:ini`

Exports: `parse`, `stringify`. See [jayess-ini-module.md](./jayess-ini-module.md).

### `jayess:markdown`

Exports: `tokenize`, `toHtml`, `toSafeHtml`. See [jayess-markdown-module.md](./jayess-markdown-module.md).

### `jayess:math`

Exports: `abs`, `floor`, `ceil`, `round`, `min`, `max`, `sqrt`, `pow`.

### `jayess:mime`

Exports: `lookup`, `extension`, `isText`, `charset`. See [jayess-mime-module.md](./jayess-mime-module.md).

### `jayess:net`

Surface: `connect`, `connectWithCancellation`, `connectWithTimeout`, `connectWithTimeoutAndCancellation`, `listen`, `read`, `readWithCancellation`, `write`, `writeWithCancellation`, `localAddress`, `localPort`, `remoteAddress`, `remotePort`, `close`. See [jayess-net-module.md](./jayess-net-module.md).

The native adapter currently includes POSIX sockets and a guarded Windows Winsock implementation behind the same Jayess-owned TCP surface.

### `jayess:number`

Exports: `isInteger`, `isFinite`, `parseInt`, `parseFloat`.

### `jayess:object`

Exports: `has`, `keys`, `values`, `entries`, `fromEntries`, `assign`.

### `jayess:os`

Exports: `platform`, `arch`, `homeDir`, `tmpDir`, `hostname`, `newline`.

### `jayess:path`

Exports: `join`, `dirname`, `basename`, `extname`, `normalize`, `parse`, `format`, `separator`, `delimiter`, `resolve`, `relative`, `isAbsolute`. See [jayess-path-module.md](./jayess-path-module.md).

### `jayess:process`

Exports: `argv`, `cwd`, `getEnv`, `hasEnv`, `envKeys`, `envEntries`, `exit`. See [jayess-process-module.md](./jayess-process-module.md).

### `jayess:querystring`

Exports: `parse`, `stringify`, `get`, `set`, `has`. See [jayess-querystring-module.md](./jayess-querystring-module.md).

### `jayess:regex`

Exports: `create`, `test`, `exec`, `split`, `matchAll`, `replaceFirst`, `replaceAll`, `isRegex`.

### `jayess:string`

Exports: `trim`, `startsWith`, `endsWith`, `includes`, `indexOf`, `slice`, `split`, `replaceFirst`, `replaceAll`, `padStart`, `padEnd`, `repeat`, `toLower`, `toUpper`.

### `jayess:stream`

Exports: `openRead`, `openWrite`, `openReadSync`, `openWriteSync`, `readChunk`, `writeChunk`, `close`, `pipe`, `pipeAll`, `pipeWithCancellation`, `copy`, `tee`, `chunks`, `readText`, `readAllBytes`, `readAllText`, `toBytes`, `toText`, `collectBytes`, `collectText`, `readLines`, `writeText`, `writeLine`, `pipeText`.

### `jayess:subprocess`

Exports: `run`, `runText`, `runBytes`, `runJson`, `runWithCancellation`, `runWithTimeout`, `runWithTimeoutAndCancellation`, `spawn`, `spawnPipeline`, `join`, `kill`, `stdout`, `stderr`, `ok`, `requireSuccess`.

See [`jayess:subprocess` Module](./jayess-subprocess-module.md) for the API shape.

The subprocess slice uses executable-plus-args calls rather than shell-by-default execution. Child-process options are explicit object data such as `cwd`, `env`, `stdin`, `stdinBytes`, and `timeoutMillis`. Child `env` options do not mutate the current Jayess process environment. Completion data includes `stdout`, `stderr`, `exitCode`, `killed`, and `timedOut`.

### `jayess:system`

Exports: `args`, `cwd`, `getEnv`, `hasEnv`, `exitCode`.

### `jayess:terminal`

Exports: `ansi`, `stripAnsi`, `cursorTo`, `clearScreen`, `clearLine`, `size`. See [jayess-terminal-module.md](./jayess-terminal-module.md).

### `jayess:test`

Exports: `test`, `run`, `assertEqual`, `assertNotEqual`, `assertOk`, `assertThrows`. See [jayess-test-module.md](./jayess-test-module.md).

### `jayess:thread`

Exports: `spawn`, `join`, `sleep`, `hardwareConcurrency`, `currentId`.

### `jayess:timers`

Exports: `sleep`, `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval`.

Next active host-module slice: `jayess:timers`.

### `jayess:toml`

Exports: `parse`, `stringify`. See [jayess-toml-module.md](./jayess-toml-module.md).

### `jayess:time`

Exports: `millis`, `seconds`, `minutes`, `elapsed`, `formatDuration`.

### `jayess:url`

Exports: `parse`, `format`, `joinPath`, `getQuery`, `setQuery`.

### `jayess:validate`

Exports: `string`, `number`, `boolean`, `array`, `object`, `nullable`, `optional`, `arrayOf`, `objectOf`, `strictObjectOf`, `config`, `oneOf`, `validate`, `assertValid`. See [jayess-validate-module.md](./jayess-validate-module.md).

### `jayess:uuid`

Exports: `v4`, `isUuid`.

### `jayess:watch`

Exports: `watch`, `poll`, `close`, `isWatcher`. See [jayess-watch-module.md](./jayess-watch-module.md).

### `jayess:window`

Exports: `create`, `show`, `close`, `shouldClose`, `requestClose`, `pollEvents`, `requestFrame`, `cancelFrame`, `runFrame`, `present`, `width`, `height`, `setTitle`. `pollEvents` drains normalized close, resize, key, text-input, pointer, and mouse-button events from the host adapter where available. Generated metadata records those event families alongside the compiled `win32`, `cocoa`, `x11`, and `wayland` adapter families. See [jayess-window-module.md](./jayess-window-module.md).

### `jayess:xml`

Exports: `parse`, `stringify`. See [jayess-xml-module.md](./jayess-xml-module.md).

### `jayess:yaml`

Exports: `parse`, `stringify`. See [jayess-yaml-module.md](./jayess-yaml-module.md).

### `jayess:workqueue`

Exports: `run`, `runAll`, `joinAll`. See [jayess-workqueue-module.md](./jayess-workqueue-module.md).
