# `jayess:test` Module

`jayess:test` provides small Jayess-native test helpers. It is a standard-library module, not a Node.js test runner and not a GitHub workflow integration.

## Exports

- `test(name, fn)` creates a test case object.
- `run(tests)` executes an array of test case objects and returns an async handle for a summary object.
- `assertEqual(actual, expected)` delegates to `jayess:assert` equality.
- `assertNotEqual(actual, expected)` delegates to `jayess:assert` inequality.
- `assertOk(value)` delegates to `jayess:assert` truthiness.
- `assertThrows(fn)` delegates to `jayess:assert` throw checking.

## Result Shape

`run(tests)` returns:

```js
{
  total: 2,
  passed: 1,
  failed: 1,
  results: [
    {
      name: "case name",
      passed: true,
      failed: false,
      error: null,
      durationMillis: 0
    }
  ]
}
```

Each result has `name`, `passed`, `failed`, `error`, and `durationMillis`. The current shipped surface records `durationMillis` as `0` so the shape is stable without adding timing policy to the module.

## Async Behavior

`run(tests)` is async-aware. A test callback may return a direct value or a Jayess async handle. Returned async handles are awaited by the runner.

```js
import { run, test, assertEqual } from "jayess:test";
import { resolved } from "jayess:async";

export async function main() {
  return await run([
    test("async value", async function () {
      var value = await resolved("ready");
      assertEqual(value, "ready");
    })
  ]);
}
```

## Diagnostics

The module throws focused Jayess values for invalid test names, missing test functions, missing test arrays, and invalid test case entries. Assertion failures are captured as failing test results by `run(tests)`.
