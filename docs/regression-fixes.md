# Regression Fix Notes

This page records small generated-code guarantees that protect current compile and runtime regression tests.

## Static `super`

Derived static methods, static fields, and static initialization blocks may use `super.name` and `super[expr]` to read inherited static class members.

```js
class Base {
  static label() {
    return "Jayess";
  }
}

class Child extends Base {
  static inherited = super["label"]();
}
```

The generated C++ lowers these reads through the base class static lookup path, not through instance method binding.

## Nested Callback Declarations

Function declarations inside another function are emitted as local Jayess callable values. This lets callback-style APIs receive the function value directly while preserving captures from the surrounding scope.

```js
function run() {
  var count = 0;
  function next() {
    count = count + 1;
    return count;
  }
  return retry(next, 3);
}
```

Direct calls such as `next()` still call through the local callable value. Passing `next` as an argument emits a `jayess::value` callable instead of a raw C++ function identifier.

## Macro-Safe C++ Names

Jayess export names remain unchanged, but generated C++ identifiers are sanitized when they can collide with common native macros or globals. For example, Jayess `stdout` and `stderr` exports are emitted with macro-safe C++ symbol names so Windows C runtime headers cannot rewrite them.

## Subprocess Runtime

`jayess:subprocess` compile output is expected to be valid on Windows and POSIX hosts. Runtime process launching is currently available on POSIX hosts; Windows runtime probes validate the explicit platform-unavailable diagnostic instead of pretending subprocess execution is supported.
