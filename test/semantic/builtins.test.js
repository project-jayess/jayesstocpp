import test from "node:test";
import assert from "node:assert/strict";
import { getSupportedBuiltinProperty, unsupportedBuiltinIdentifierMessage } from "../../src/semantic/builtins.js";

function member(object, property, computed = false) {
  return {
    type: "MemberExpression",
    object,
    property: { type: "Identifier", name: property },
    computed
  };
}

test("semantic builtin diagnostics keep focused ambient-global messages", () => {
  assert.match(unsupportedBuiltinIdentifierMessage("RegExp"), /jayess:regex/);
  assert.match(unsupportedBuiltinIdentifierMessage("Promise"), /Jayess async\/await/);
  assert.match(unsupportedBuiltinIdentifierMessage("Function"), /runtime source evaluation is unsupported by design/);
  assert.equal(unsupportedBuiltinIdentifierMessage("localName"), null);
});

test("semantic builtin classification accepts supported literal properties", () => {
  assert.deepEqual(getSupportedBuiltinProperty(member({ type: "ArrayExpression" }, "includes")), {
    receiver: "array",
    property: "includes"
  });
  assert.deepEqual(getSupportedBuiltinProperty(member({ type: "Literal", kind: "string" }, "startsWith")), {
    receiver: "string",
    property: "startsWith"
  });
  assert.deepEqual(getSupportedBuiltinProperty(member({ type: "Literal", kind: "number" }, "toString")), {
    receiver: "number",
    property: "toString"
  });
});

test("semantic builtin classification reports unsupported literal properties", () => {
  assert.deepEqual(getSupportedBuiltinProperty(member({ type: "ArrayExpression" }, "map")), {
    receiver: "array",
    property: "map",
    unsupported: true
  });
  assert.deepEqual(getSupportedBuiltinProperty(member({ type: "Literal", kind: "boolean" }, "valueOf")), {
    receiver: "boolean",
    property: "valueOf",
    unsupported: true
  });
});

test("semantic builtin classification ignores non-literal and computed members", () => {
  assert.equal(getSupportedBuiltinProperty(member({ type: "Identifier", name: "items" }, "includes")), null);
  assert.equal(getSupportedBuiltinProperty(member({ type: "ArrayExpression" }, "includes", true)), null);
});
