# Jayess Standard Library

Jayess standard-library modules live under the repository-owned `jayess:*` namespace. They are explicit imports, not ambient JavaScript or Node.js globals.

`node:*` imports remain unsupported in Jayess source. Use the matching `jayess:*` module when Jayess owns a portable surface for that behavior.

Generated project metadata records imported standard-library modules in `jayess_dependency_plan.json`, `jayess_module_manifest.json`, and `jayess_build_hints.json`. Native-backed modules also expose platform adapter and library requirements there, while pure Jayess modules remain ordinary generated stdlib sources under `generated-stdlib/jayess/`.

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

## Planned Native Rendering Modules

Jayess should provide a cross-platform native rendering family through focused `jayess:*` modules:

- `jayess:color` for color values, parsing, conversion, blending, and palette helpers.
- `jayess:image` for pixel buffers, image dimensions, pixel access, and simple image file output.
- `jayess:canvas` for higher-level off-screen 2D drawing operations over image buffers.
- `jayess:window` for live native windows, frame presentation, and input events.
- `jayess:gpu` for optional accelerated resources, pipelines, and draw commands.

The current canvas implementation renders off-screen, can save deterministic PPM files, and can be presented through `jayess:window` where a host adapter is available. The Linux/X11 window adapter uploads validated software canvas pixels through dynamically loaded X11 image functions. The planned layering is `jayess:color` under `jayess:image` under `jayess:canvas`, with `jayess:window` presenting canvas buffers to real native windows. `jayess:gpu` should be a separate optional acceleration layer rather than a requirement for `jayess:canvas`. The portable implementation should favor software rendering and deterministic image output. Live window and GPU rendering should stay behind narrow runtime adapters and platform-isolated native code.

## Module Index

### `jayess:array`

Exports: `slice`, `concat`, `indexOf`, `includes`, `find`, `findIndex`, `some`, `every`, `join`, `reverse`, `sort`, `map`, `filter`, `reduce`.

### `jayess:archive`

Exports: `createTar`, `extractTar`, `writeTar`, `writeTarSync`, `readTar`, `readTarSync`. See [jayess-archive-module.md](./jayess-archive-module.md).

### `jayess:assert`

Exports: `ok`, `equal`, `notEqual`, `fail`, `throws`.

### `jayess:async`

Exports: `resolved`, `rejected`, `all`, `allSettled`, `any`, `race`, `sleep`, `timeout`, `withTimeout`, `catchError`, `finallyDo`, `delay`, `retry`, `isAsync`, `createCancellationToken`, `cancel`, `isCancelled`, `cancellationReason`, `whenCancelled`, `withCancellation`, `sleepWithCancellation`, `timeoutWithCancellation`.

### `jayess:bytes`

Exports: `fromUtf8`, `fromArray`, `toArray`, `toUtf8`, `length`, `get`, `set`, `fill`, `slice`, `concat`, `equals`, `compare`, `startsWith`, `endsWith`, `isBytes`.

### `jayess:buffer`

Exports: `create`, `fromBytes`, `toBytes`, `length`, `read`, `write`, `concat`.

### `jayess:channel`

Exports: `create`, `send`, `receive`, `close`, `isClosed`. See [jayess-channel-module.md](./jayess-channel-module.md).

### `jayess:clipboard`

Exports: `readText`, `writeText`, `clear`. See [jayess-clipboard-module.md](./jayess-clipboard-module.md).

### `jayess:compress`

Exports: `deflate`, `inflate`, `gzip`, `gunzip`. See [jayess-compress-module.md](./jayess-compress-module.md).

### `jayess:canvas`

Exports: `create`, `clear`, `width`, `height`, `getPixel`, `copy`, `fillRect`, `clipRect`, `fillRectClipped`, `fillRectAlpha`, `strokeRect`, `drawImage`, `drawImageClipped`, `drawCanvas`, `fillCircle`, `strokeCircle`, `fillEllipse`, `strokeEllipse`, `line`, `polyline`, `quadraticCurve`, `bezierCurve`, `fillPolygon`, `strokePolygon`, `measureText`, `text`, `drawTextBox`, `savePpm`, `saveImage`. See [jayess-canvas-module.md](./jayess-canvas-module.md).

### `jayess:collections/map`

Exports: `create`, `get`, `set`, `has`, `deleteKey`, `clear`, `size`, `keys`, `values`, `entries`, `fromEntries`, `setAll`, `deleteAll`, `isMap`.

### `jayess:collections/set`

Exports: `create`, `add`, `has`, `deleteValue`, `clear`, `size`, `values`, `entries`, `fromValues`, `union`, `intersection`, `difference`, `isSet`.

### `jayess:cli`

Exports: `parse`, `parseArgv`, `flag`, `option`, `positional`.

### `jayess:color`

Exports: `rgb`, `rgba`, `parse`, `toHex`, `mix`, `lighten`, `darken`, `withAlpha`. See [jayess-color-module.md](./jayess-color-module.md).

### `jayess:console`

Exports: `log`, `error`, `write`, `writeLine`.

### `jayess:cookie`

Exports: `parse`, `serialize`, `get`, `set`. See [jayess-cookie-module.md](./jayess-cookie-module.md).

### `jayess:config`

Exports: `load`, `loadSync`, `loadJson`, `loadJsonSync`, `loadToml`, `loadTomlSync`, `loadIni`, `loadIniSync`, `loadDotenv`, `loadDotenvSync`, `merge`, `get`, `requireKey`. See [jayess-config-module.md](./jayess-config-module.md).

### `jayess:crypto`

Exports: `sha256`, `sha1`, `hmacSha256`, `hmacSha1`, `createHash`, `updateHash`, `digestHash`, `randomBytes`.

### `jayess:csv`

Exports: `parse`, `stringify`. See [jayess-csv-module.md](./jayess-csv-module.md).

### `jayess:date`

Exports: `now`, `fromUnixMillis`, `toUnixMillis`, `toIsoString`, `getUtcYear`, `getUtcMonth`, `getUtcDay`, `getUtcHour`, `getUtcMinute`, `getUtcSecond`, `getUtcMillisecond`, `addMillis`, `diffMillis`, `parseIso`, `isDate`.

### `jayess:dotenv`

Exports: `parse`, `stringify`.

### `jayess:encoding`

Exports: `base64Encode`, `base64Decode`, `hexEncode`, `hexDecode`, `asciiEncode`, `asciiDecode`, `utf16Encode`, `utf16Decode`, `uriEncode`, `uriDecode`.

### `jayess:events`

Exports: `create`, `on`, `once`, `off`, `emit`, `listenerCount`.

### `jayess:font`

Exports: `measureText`, `lineHeight`, `charWidth`, `drawText`, `drawTextAligned`. See [jayess-font-module.md](./jayess-font-module.md).

### `jayess:form`

Exports: `parseUrlEncoded`, `stringifyUrlEncoded`, `field`, `setField`. See [jayess-form-module.md](./jayess-form-module.md).

### `jayess:fs`

Default async exports: `exists`, `readText`, `readBytes`, `readJson`, `createReadStream`, `createWriteStream`, `writeText`, `writeBytes`, `writeJson`, `appendText`, `copy`, `copyRecursive`, `createDirectories`, `tempDirectory`, `tempFile`, `remove`, `removeRecursive`, `list`, `walk`, `rename`, `stat`.

Synchronous exports: `existsSync`, `readTextSync`, `readBytesSync`, `readJsonSync`, `createReadStreamSync`, `createWriteStreamSync`, `writeTextSync`, `writeBytesSync`, `writeJsonSync`, `appendTextSync`, `copySync`, `copyRecursiveSync`, `createDirectoriesSync`, `tempDirectorySync`, `tempFileSync`, `removeSync`, `removeRecursiveSync`, `listSync`, `walkSync`, `renameSync`, `statSync`.

### `jayess:glob`

Exports: `matches`, `globSync`. See [jayess-glob-module.md](./jayess-glob-module.md).

### `jayess:gpu`

Exports: `createDevice`, `createSurface`, `createBuffer`, `createTexture`, `createShader`, `createPipeline`, `beginFrame`, `clear`, `draw`, `endFrame`. Runtime handles record backend capability metadata and validate command/frame lifecycle shapes before real backend adapters are available. See [jayess-gpu-module.md](./jayess-gpu-module.md).

### `jayess:html`

Exports: `escapeText`, `escapeAttribute`, `fragment`, `tag`. See [jayess-html-module.md](./jayess-html-module.md).

### `jayess:hash`

Exports: `sha256Bytes`, `sha1Bytes`, `sha256Text`, `sha1Text`, `sha256File`, `sha1File`, `sha256FileSync`, `sha1FileSync`, `sha256TextFile`, `sha256TextFileSync`, `streamSha256`, `streamSha1`.

### `jayess:http`

Exports: `request`, `requestWithCancellation`, `requestWithTimeout`, `requestWithTimeoutAndCancellation`, `text`, `bytes`, `json`, `textBody`, `bytesBody`, `jsonBody`, `method`, `path`, `query`, `params`, `headers`, `header`, `body`, `bodyText`, `bodyBytes`, `collectBody`, `createServer`, `close`, `setStatus`, `status`, `setHeader`, `write`, `end`, `sendText`, `sendJson`, `sendBytes`, `sendTextStream`, `sendBytesStream`, `notFound`, `redirect`, `sendFile`, `serveStatic`, `serveFiles`, `route`, `router`, `match`, `handle`, `compose`.

See [jayess-http-module.md](./jayess-http-module.md).

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

Exports: `tokenize`, `toHtml`. See [jayess-markdown-module.md](./jayess-markdown-module.md).

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

Exports: `join`, `dirname`, `basename`, `extname`, `normalize`, `parse`, `format`, `separator`, `delimiter`, `resolve`, `relative`, `isAbsolute`.

### `jayess:process`

Exports: `argv`, `cwd`, `getEnv`, `hasEnv`, `envKeys`, `envEntries`, `exit`.

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

Exports: `sleep`, `setTimeout`, `clearTimeout`.

### `jayess:toml`

Exports: `parse`, `stringify`. See [jayess-toml-module.md](./jayess-toml-module.md).

### `jayess:time`

Exports: `millis`, `seconds`, `minutes`, `elapsed`, `formatDuration`.

### `jayess:url`

Exports: `parse`, `format`, `joinPath`, `getQuery`, `setQuery`.

### `jayess:validate`

Exports: `string`, `number`, `boolean`, `array`, `object`, `nullable`, `optional`, `arrayOf`, `objectOf`, `oneOf`, `validate`, `assertValid`. See [jayess-validate-module.md](./jayess-validate-module.md).

### `jayess:uuid`

Exports: `v4`, `isUuid`.

### `jayess:watch`

Exports: `watch`, `poll`, `close`, `isWatcher`. See [jayess-watch-module.md](./jayess-watch-module.md).

### `jayess:window`

Exports: `create`, `show`, `close`, `shouldClose`, `requestClose`, `pollEvents`, `present`, `width`, `height`, `setTitle`. See [jayess-window-module.md](./jayess-window-module.md).

### `jayess:xml`

Exports: `parse`, `stringify`. See [jayess-xml-module.md](./jayess-xml-module.md).

### `jayess:yaml`

Exports: `parse`, `stringify`. See [jayess-yaml-module.md](./jayess-yaml-module.md).

### `jayess:workqueue`

Exports: `run`, `runAll`, `joinAll`. See [jayess-workqueue-module.md](./jayess-workqueue-module.md).
