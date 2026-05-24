# Standard Library Matrix

This is the authoritative quick standard-library/module matrix for shipped `jayess:*` modules. These modules are imported with `jayess:*` specifiers and are transpiled with user code when imported.

| Module | Primary Surface | Runtime Primitive Family |
| --- | --- | --- |
| `jayess:array` | array helpers | array |
| `jayess:archive` | tar archive helpers | archive, async, bytes |
| `jayess:assert` | assertions | none |
| `jayess:async` | async composition helpers | async |
| `jayess:buffer` | higher-level byte buffers | bytes |
| `jayess:bytes` | byte creation and mutation | bytes |
| `jayess:channel` | queue-style communication handles | channel |
| `jayess:canvas` | software 2D drawing over image buffers | image, color, math |
| `jayess:clipboard` | native clipboard text helpers | clipboard |
| `jayess:compress` | stored DEFLATE and minimal gzip helpers | compress, bytes |
| `jayess:cli` | command-line argument parsing | process/system |
| `jayess:color` | color parsing, conversion, and blending | math, number, string |
| `jayess:console` | output helpers | console |
| `jayess:cookie` | HTTP cookie parsing and Set-Cookie formatting | http, string |
| `jayess:config` | config file loading and shallow overlay helpers | fs, json, ini, toml, dotenv, path |
| `jayess:crypto` | hashes, HMAC, HKDF, and PEM container helpers | crypto, bytes |
| `jayess:csv` | CSV parse/stringify helpers | array, string |
| `jayess:date` | date/time values | date |
| `jayess:dialog` | native open/save/directory/message dialogs | dialog |
| `jayess:dotenv` | dotenv parsing and formatting | object, string |
| `jayess:encoding` | base64, hex, URI, ASCII, UTF-16 helpers | encoding, bytes |
| `jayess:events` | event emitter handles | events |
| `jayess:font` | bitmap text measurement, alignment, and canvas drawing | canvas |
| `jayess:form` | URL-encoded form parsing and formatting | querystring |
| `jayess:fs` | async-by-default filesystem helpers and `Sync` variants | fs, async, bytes |
| `jayess:glob` | simple filesystem glob matching | fs, path, string |
| `jayess:gpu` | optional accelerated rendering handles and draw commands | gpu, window |
| `jayess:gui` | first Jayess-owned widget toolkit slice | layout, canvas, font |
| `jayess:hash` | higher-level hash helpers | crypto, encoding, fs, bytes |
| `jayess:html` | HTML escaping and string construction helpers | array, object, string |
| `jayess:http` | HTTP client/server, routing, and response helpers | http, async, bytes, json, querystring, mime, fs |
| `jayess:image` | software pixel buffers, metadata, and deterministic image I/O | image, color |
| `jayess:ini` | sectioned INI parse/stringify helpers | object, string |
| `jayess:iter` | generator consumption helpers | generator, iter |
| `jayess:json` | parse/stringify/validate | json |
| `jayess:kv` | file-backed JSON key/value storage | fs, json, path, string |
| `jayess:layout` | rectangle and box layout helpers | none |
| `jayess:log` | structured console logging helpers | console, json |
| `jayess:markdown` | Markdown tokenization and focused HTML rendering | html, array, string |
| `jayess:math` | math helpers | math |
| `jayess:mime` | compact MIME lookup helpers | string |
| `jayess:net` | TCP socket/server helpers with POSIX and Windows socket adapters | net, async, bytes |
| `jayess:number` | number helpers | number |
| `jayess:object` | object helpers | object |
| `jayess:os` | host OS data | os |
| `jayess:path` | path parsing and formatting | path |
| `jayess:process` | process metadata and environment inspection | process/system |
| `jayess:querystring` | query-string parse/stringify helpers | object, string |
| `jayess:regex` | regex helpers | regex |
| `jayess:stream` | stream handles and copy helpers | stream, fs |
| `jayess:string` | string helpers | string |
| `jayess:subprocess` | child process handles, completion, output streams, and convenience runners | subprocess, stream, async, bytes, json |
| `jayess:system` | focused system helpers | system |
| `jayess:terminal` | ANSI display strings and terminal size helpers | terminal |
| `jayess:test` | Jayess-native test cases and assertions | assert, async |
| `jayess:thread` | explicit thread handles | thread |
| `jayess:timers` | sleep and timeout helpers | async |
| `jayess:time` | monotonic and wall-clock helpers | time |
| `jayess:toml` | focused TOML config parsing and formatting | object, string, number |
| `jayess:url` | URL parse/format helpers | url |
| `jayess:validate` | runtime schema validation helpers | validate, array, object |
| `jayess:uuid` | UUID helpers | crypto, encoding, bytes |
| `jayess:watch` | deterministic filesystem watcher handles | watch |
| `jayess:window` | native windows, events, and canvas presentation | window, image |
| `jayess:workqueue` | worker helper layer | thread |
| `jayess:xml` | focused XML parse/stringify helpers | array, object, string |
| `jayess:yaml` | config-oriented YAML parse/stringify helpers | object, string, number |
| `jayess:collections/map` | map handles | map |
| `jayess:collections/set` | set handles | set |

See [standard-library.md](./standard-library.md) for export-level details.
