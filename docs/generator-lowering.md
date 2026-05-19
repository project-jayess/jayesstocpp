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

## Expression `yield`

Selected expression-yield forms lower through predeclared generator-local temporaries:

```js
function* run(value, use, target) {
  var sum = 1 + (yield value);
  use(yield sum);
  target.value = yield sum;
  return yield target.value;
}
```

The yielded value is stored as the generator current value and the resume state is recorded. When resumed through `generator_resume_with(generator, sent)`, the sent value is consumed with `generator_take_sent(...)` and the surrounding expression continues from its saved temporary state.

Ordinary `generator_resume(generator)` resumes with Jayess `null`. Short-circuit expression-yield forms are intentionally kept diagnosed until they have a lowering that preserves short-circuit evaluation.
