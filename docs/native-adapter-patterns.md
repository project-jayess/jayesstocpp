# Native Adapter Patterns

Jayess supports direct native imports, but awkward C++ APIs should still be wrapped through small ordinary adapter headers and source files instead of forcing complex templates, overload sets, macros, or callback-heavy APIs directly into Jayess source.

## Prefer Small Header-First Adapters

Recommended Jayess shape:

```js
import { add } from "./native/math.hpp";
import "./native/math.cpp";

export function run(a, b) {
  return add(a, b);
}
```

Recommended native shape:

```cpp
// native/math.hpp
#pragma once

int add(int left, int right);
```

```cpp
// native/math.cpp
#include "math.hpp"

int add(int left, int right) {
  return left + right;
}
```

This keeps the Jayess import surface simple:

- named Jayess imports come from the header
- side-effect source imports only package the implementation artifact
- native source files and native library artifacts do not create Jayess bindings directly

## Wrap Awkward C++ Surfaces

Use a tiny adapter when the original C++ API is awkward for direct Jayess lowering, for example:

- templates that need concrete instantiations
- overload sets that would be ambiguous from Jayess call sites
- macro-based APIs
- iterator-heavy APIs
- callback registration APIs that need a stable bridge layer

Recommended pattern:

```cpp
// native/text_adapter.hpp
#pragma once
#include <string>

std::string normalize_text(const std::string& value);
```

```cpp
// native/text_adapter.cpp
#include "text_adapter.hpp"
#include "third_party_text_api.hpp"

std::string normalize_text(const std::string& value) {
  return third_party::normalize(value);
}
```

Then Jayess imports only the adapter header and packages the adapter source:

```js
import { normalize_text } from "./native/text_adapter.hpp";
import "./native/text_adapter.cpp";
```

## Shared And Static Libraries

Shared and static library artifacts should always be paired with a matching header import. The header owns the Jayess-visible symbol surface; the library artifact only provides the compiled implementation to package into the generated project.

Recommended pattern:

```js
import { nativeAdd } from "./native/math.hpp";
import "./native/math.dll";
```

or:

```js
import { nativeAdd } from "./native/math.hpp";
import "./native/math.lib";
```

Do not import bindings directly from `.dll`, `.so`, `.dylib`, `.a`, or `.lib` artifacts. Jayess diagnostics intentionally reject that shape and point back to the header-first pattern.
