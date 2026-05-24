# Generator Lowering

Jayess generators lower to explicit C++ generator handles with resume-state storage. A generator can yield ordinary values, delegate with `yield*`, and return a completion value.

## `yield*` Completion Destructuring

Generator-local destructuring declarations may use a direct `yield*` initializer:

```js
function* outer(source) {
  var [first, second] = yield* source;
  var { value } = yield* source;
  return value;
}
```

The delegated generator yields its intermediate values unchanged. When delegation completes, the completion value is stored in a generator-local temporary and then lowered through the shared destructuring helper path.

This keeps destructuring behavior consistent with non-generator declarations while preserving valid C++ around resume switch labels.

## Statement `yield`

Generator statement lowering now supports direct `yield` and `yield*` inside:

- nested blocks
- `if` / `else`
- `while`
- `for`
- `do` / `while`
- `switch`

`switch` lowering evaluates the discriminant once into a predeclared generator temporary so resume labels do not jump over local C++ initialization.

A focused `try/catch` shape is supported when the `try` block ends with one direct non-delegated `yield` and the catch body does not contain `yield`:

```js
function* run(value) {
  try {
    value = prepare(value);
    yield value;
  } catch (error) {
    return error;
  }
}
```

The resume label is emitted after the `try/catch` block so generated C++ does not jump into a protected `try` region.

A multi-yield `try/catch` shape is supported when each `yield` in the `try` block is a direct non-delegated `yield` expression statement, surrounding `try` statements do not contain nested `yield`, and the catch body does not contain `yield`:

```js
function* run(value) {
  try {
    value = prepare(value);
    yield value;
    value = advance(value);
    yield value;
    value = finish(value);
  } catch (error) {
    return error;
  }
}
```

Lowering emits separate protected C++ segments around each pre-yield and trailing statement group. This keeps resume labels outside C++ `try` regions while preserving one catch handler shape for failures before the next suspension point.

A focused catch-body `yield` shape is also supported when the `try` block does not contain `yield` and the catch body contains exactly one direct non-delegated `yield`:

```js
function* run(value) {
  try {
    value = parse(value);
  } catch (error) {
    value = error;
    yield value;
    value = recover(value);
  }
}
```

Runtime coverage verifies catch-body yield after an exception thrown before a supported try-body yield, plus multi-yield try/finally completion paths.

The catch binding is stored in generator state before suspension. Statements before the catch-body yield run inside the C++ catch block. Statements after resume run after the `try/catch` block, keeping resume labels outside invalid C++ protected regions.

A focused `try/finally` shape is also supported when the `try` block contains one or more direct non-delegated `yield` statements, surrounding `try` statements do not contain `yield`, and the `finally` block does not contain `yield`:

```js
function* run(value) {
  try {
    value = prepare(value);
    yield value;
    value = finish(value);
    yield value;
    value = complete(value);
  } finally {
    cleanup();
  }
}
```

Statements before each yield run before that suspension. Statements after each yield run after that resume, then the `finally` body runs after the final try segment. The focused shape keeps resume labels outside invalid C++ protected regions and does not claim full JavaScript `finally` behavior for broader throwing, nested-yield, or yielding-finalizer forms.

## Expression `yield`

Selected expression-yield forms lower through predeclared generator-local temporaries:

```js
function* run(value, use, target) {
  var sum = 1 + (yield value);
  var items = [yield value, sum];
  var record = { value: yield value, items: items };
  use(yield sum);
  target.value = yield sum;
  return sum ? record : yield target.value;
}
```

The yielded value is stored as the generator current value and the resume state is recorded. When resumed through `generator_resume_with(generator, sent)`, the sent value is consumed with `generator_take_sent(...)` and the surrounding expression continues from its saved temporary state.

Ordinary `generator_resume(generator)` resumes with Jayess `null`.

Array literals, object literals, and conditional expressions are supported when their yielding parts are deterministic expression positions. Array and object spread forms inside expression-yield composites are still rejected until they have a dedicated lowering path.

Array and object spread forms that contain `yield` are rejected during semantic analysis, before C++ emission.

Short-circuit expression-yield forms lower through a predeclared result temporary:

```js
function* choose(left, right) {
  var both = left && (yield right);
  var either = left || (yield right);
  return left ?? (yield right);
}
```

The left operand is evaluated once, then Jayess truthiness or null checks decide whether the right side should run. The right-side `yield` is skipped for `&&` when the left side is falsey, skipped for `||` when the left side is truthy, and skipped for `??` when the left side is not Jayess `null`. When the right-side yield runs, its sent value becomes the short-circuit expression result.
