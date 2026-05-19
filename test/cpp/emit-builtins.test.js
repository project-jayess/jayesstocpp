import test from "node:test";
import assert from "node:assert/strict";
import { isBuiltinLengthMember, renderBuiltinCallExpression } from "../../src/cpp/emit-builtins.js";

function identifier(name) {
  return { type: "Identifier", name };
}

function memberCall(objectName, propertyName, args = []) {
  return {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: identifier(objectName),
      property: identifier(propertyName),
      computed: false
    },
    arguments: args
  };
}

const helpers = {
  renderExpression(node) {
    if (node.type === "Identifier") {
      return node.name;
    }
    if (node.type === "Literal") {
      return `jayess::value(std::string(${JSON.stringify(node.value)}))`;
    }
    return "jayess_unknown";
  },
  pushRenderedCallArguments(argumentNodes, context, lines) {
    for (const argument of argumentNodes) {
      lines.push(`  jayess_args.push_back(${this.renderExpression(argument, context)});`);
    }
  }
};

test("emit-builtins recognizes length member reads", () => {
  assert.equal(
    isBuiltinLengthMember({
      type: "MemberExpression",
      object: identifier("items"),
      property: identifier("length"),
      computed: false
    }),
    true
  );
});

test("emit-builtins renders array built-in calls through focused helpers", () => {
  const rendered = renderBuiltinCallExpression(memberCall("items", "push", [{ type: "Literal", value: "x" }]), {}, helpers);

  assert.match(rendered, /jayess::array_push\(jayess_object, std::move\(jayess_args\)\)/);
  assert.match(rendered, /jayess::get_property\(jayess_object, "push"\)/);
});

test("emit-builtins renders string built-in calls through focused helpers", () => {
  const rendered = renderBuiltinCallExpression(memberCall("text", "startsWith", [{ type: "Literal", value: "ja" }]), {}, helpers);

  assert.match(rendered, /std::holds_alternative<std::string>\(jayess_object\)/);
  assert.match(rendered, /jayess::string_starts_with\(jayess_object, jayess_args\)/);
  assert.match(rendered, /jayess::get_property\(jayess_object, "startsWith"\)/);
});

test("emit-builtins leaves ordinary calls to the module emitter", () => {
  assert.equal(renderBuiltinCallExpression({ type: "CallExpression", callee: identifier("run"), arguments: [] }, {}, helpers), null);
});
