# Jayess Brief

Jayess is a JavaScript-like native programming language that transpiles to C++. It keeps familiar syntax where it maps cleanly to deterministic native code, but it is not a JavaScript runtime.

Use this file as a quick orientation for people and AI agents. For full details, see [overview.md](./overview.md), [feature-matrix.md](./feature-matrix.md), [standard-library.md](./standard-library.md), and [semantics.md](./semantics.md).

## Core Model

- Jayess source is resolved as a closed module graph at transpile time.
- Generated output is C++ source code.
- Memory management is scope-based and automatic. Jayess does not use garbage collection as its normal model.
- `var` is block-scoped mutable binding. `const` is block-scoped immutable binding.
- `null` is the missing-value sentinel. Jayess does not have JavaScript-style `undefined`.
- Truthiness and equality are explicit. Empty arrays, objects, maps, and sets are falsey; composite values compare by identity.

```js
const name = "Jayess";
var count = 2;

if (count > 0) {
  var message = `hello ${name}`;
}
```

## Functions And Closures

Jayess supports function declarations, function expressions, defaults, rest parameters, destructured parameters, and closures.

```js
function add(left, right = 0) {
  return left + right;
}

function sum(...values) {
  var total = 0;
  for (var index = 0; index < values.length; index = index + 1) {
    total = total + values[index];
  }
  return total;
}

function makeCounter(start) {
  var value = start;
  return function () {
    value = value + 1;
    return value;
  };
}
```

## Arrow Functions

Arrow functions support expression and block bodies. They capture outer `this` lexically when used inside class methods or field initializers.

```js
const double = (value) => value * 2;

const keepPositive = (values) => {
  var result = [];
  for (var index = 0; index < values.length; index = index + 1) {
    if (values[index] > 0) {
      result.push(values[index]);
    }
  }
  return result;
};
```

## Control Flow

Jayess supports `if`, `while`, `do ... while`, `for`, `switch`, `break`, `continue`, `try`, `catch`, `finally`, and `throw`.

```js
function classify(value) {
  switch (value) {
    case 0:
      return "zero";
    case 1:
      return "one";
    default:
      return "many";
  }
}

function requirePositive(value) {
  if (value <= 0) {
    throw "expected positive value";
  }
  return value;
}
```

## Expressions And Data

Jayess supports numeric, string, boolean, and `null` literals; arrays; objects; template strings; optional chaining; nullish coalescing; ternaries; spreads; destructuring; property access; and index access.

```js
const user = {
  name: "Ada",
  tags: ["compiler", "native"]
};

const label = user.name ?? "anonymous";
const firstTag = user.tags?.[0];
const clone = { ...user, active: true };
const [first, ...rest] = [1, 2, 3];

function pointLength({ x, y }) {
  return x * x + y * y;
}
```

## Classes

Jayess supports classes, constructors, instance fields, static fields, static blocks, methods, private members, computed member names, single inheritance, and selected `super` forms.

```js
class Counter {
  #value = 0;
  static label = "counter";

  constructor(start) {
    this.#value = start;
  }

  next() {
    this.#value = this.#value + 1;
    return this.#value;
  }
}

class NamedCounter extends Counter {
  constructor(name, start) {
    super(start);
    this.name = name;
  }

  nextLabel() {
    return `${this.name}:${super.next()}`;
  }
}
```

## Async

Jayess supports `async function`, async arrows, async methods, and `await`. Async values are Jayess-owned async handles, not JavaScript `Promise` objects. Use `jayess:async` and `jayess:timers` for composition and timing.

```js
import { sleep } from "jayess:timers";

export async function waitAndReturn(value) {
  await sleep(10);
  return value;
}
```

## Generators

Jayess supports generator declarations and generator expressions for the documented direct-yield shapes.

```js
function* range(start, end) {
  for (var value = start; value < end; value = value + 1) {
    yield value;
  }
}
```

## Modules

Jayess resolves imports and exports at transpile time. It supports relative imports, extensionless relative imports, npm package imports, scoped package imports, default imports, named imports, re-exports, side-effect imports, and export-all re-exports.

```js
import { add } from "./math.js";
import defaultTool from "some-jayess-package";
import { helper } from "@scope/tools";

export { add };
export * from "./constants.js";

export default function run() {
  return defaultTool(add(helper(), 1));
}
```

## Native C++ Interop

Jayess can import native C/C++ headers, source files, libraries, and C++ standard-library headers explicitly. Headers provide callable native symbols; source and library imports are dependency artifacts.

```js
import "cpp:vector";
import { add } from "./native/math.hpp";
import "./native/math.cpp";
import "./native/libmath.so";

export function run() {
  return add(1, 2);
}
```

## Standard Library

Jayess standard-library modules use explicit `jayess:*` imports. They are not ambient Node.js or browser globals.

```js
import { equal } from "jayess:assert";
import { map, filter } from "jayess:array";
import { fromUtf8, secureEquals } from "jayess:bytes";
import { prompt } from "jayess:console";
import { sha256 } from "jayess:crypto";
import { parse, stringifyPretty } from "jayess:json";

const name = prompt("name: ");
const parsed = parse("{\"ok\":true}");
const digest = sha256(fromUtf8("payload"));
equal(secureEquals(digest, digest), true);
stringifyPretty(parsed, 2);
```

Common shipped module families include:

- Core helpers: `jayess:assert`, `jayess:array`, `jayess:object`, `jayess:string`, `jayess:number`, `jayess:math`, `jayess:iter`, `jayess:regex`.
- Data and encoding: `jayess:bytes`, `jayess:buffer`, `jayess:encoding`, `jayess:json`, `jayess:csv`, `jayess:ini`, `jayess:toml`, `jayess:yaml`, `jayess:xml`.
- System and I/O: `jayess:fs`, `jayess:path`, `jayess:os`, `jayess:process`, `jayess:system`, `jayess:stream`, `jayess:subprocess`, `jayess:net`, `jayess:http`.
- Time and concurrency: `jayess:async`, `jayess:timers`, `jayess:thread`, `jayess:channel`, `jayess:workqueue`.
- Native UI and rendering: `jayess:color`, `jayess:image`, `jayess:canvas`, `jayess:window`, `jayess:gpu`, `jayess:gui`, `jayess:dialog`.
- Higher-level utilities: `jayess:config`, `jayess:cookie`, `jayess:form`, `jayess:html`, `jayess:markdown`, `jayess:mime`, `jayess:querystring`, `jayess:url`, `jayess:uuid`, `jayess:validate`, `jayess:log`.

See [standard-library.md](./standard-library.md) for the full export index.

## Filesystem Example

`jayess:fs` uses async names by default and `Sync` suffixes for synchronous variants.

```js
import { readText, writeTextSync } from "jayess:fs";

export async function copyText(input, output) {
  const text = await readText(input);
  writeTextSync(output, text);
  return text.length;
}
```

## HTTP Example

`jayess:http` is a Jayess-owned HTTP module. The shipped server path is focused HTTP/1.1 with explicit limits and diagnostics.

```js
import { createServer, sendJson, route, router } from "jayess:http";

const app = router([
  route("GET", "/health", function (request, response) {
    sendJson(response, { ok: true });
  })
]);

export function start() {
  return createServer(app, { port: 8080 });
}
```

## Rendering Example

`jayess:image` owns pixel buffers, `jayess:canvas` owns higher-level drawing, and `jayess:window` presents canvas buffers when a host adapter is available.

```js
import { rgb } from "jayess:color";
import { create, fillRect, line, savePpm } from "jayess:canvas";

export function draw() {
  var canvas = create(160, 90);
  fillRect(canvas, 0, 0, 160, 90, rgb(20, 20, 24));
  line(canvas, 10, 10, 150, 80, rgb(255, 120, 40), { strokeWidth: 3 });
  savePpm(canvas, "out.ppm");
  return canvas;
}
```

## Unsupported By Design

These are intentional language non-goals, not missing checklist items:

- `let`
- JavaScript-style `undefined`
- JavaScript `Promise`
- dynamic `import()`
- `eval(...)`
- `Function(...)`
- `with`
- JavaScript-style hoisted/function-scoped `var`
- runtime loading of source modules by computed path
- regex literals such as `/abc/`
- ambient `RegExp` and `new RegExp(...)`
- ambient Node.js built-ins such as `node:fs`
- browser DOM compatibility as the default GUI model

Use explicit Jayess-owned modules instead of ambient JavaScript, Node.js, or browser globals.

## Transpiler API

The npm package exposes synchronous JavaScript APIs:

```js
import { transpile, transpileFile } from "jayesstocpp";

const cpp = transpile("export function run() { return 42; }");
transpileFile("src/main.js", "build/generated");
```

`transpile(source)` returns one C++ translation unit string. `transpileFile(entryFilename, targetDirname)` resolves the full reachable module graph and writes generated C++ project files under the target directory.
