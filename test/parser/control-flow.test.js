import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";

test("parser handles while and for loops", () => {
  const ast = parse(
    createSourceText("while (1) { break; } for (var i = 0; i < 3; i = i + 1) { continue; }")
  );

  assert.equal(ast.body[0].type, "WhileStatement");
  assert.equal(ast.body[0].body.type, "BlockStatement");
  assert.equal(ast.body[1].type, "ForStatement");
  assert.equal(ast.body[1].init.type, "VariableDeclaration");
  assert.equal(ast.body[1].body.type, "BlockStatement");
});

test("parser handles do-while loops", () => {
  const ast = parse(
    createSourceText("do { break; } while (1);")
  );

  assert.equal(ast.body[0].type, "DoWhileStatement");
  assert.equal(ast.body[0].body.type, "BlockStatement");
  assert.equal(ast.body[0].test.kind, "number");
});

test("parser handles switch statements with literal cases and default", () => {
  const ast = parse(
    createSourceText("switch (value) { case 1: var answer = 1; break; case true: return 2; default: value = 3; }")
  );

  assert.equal(ast.body[0].type, "SwitchStatement");
  assert.equal(ast.body[0].cases.length, 3);
  assert.equal(ast.body[0].cases[0].test.kind, "number");
  assert.equal(ast.body[0].cases[1].test.kind, "boolean");
  assert.equal(ast.body[0].cases[2].test, null);
});

test("parser handles try/catch/finally combinations", () => {
  const tryCatch = parse(createSourceText("try { value(); } catch (err) { return err; }"));
  assert.equal(tryCatch.body[0].type, "TryStatement");
  assert.equal(tryCatch.body[0].handler.param.name, "err");
  assert.equal(tryCatch.body[0].finalizer, null);

  const tryFinally = parse(createSourceText("try { value(); } finally { cleanup(); }"));
  assert.equal(tryFinally.body[0].type, "TryStatement");
  assert.equal(tryFinally.body[0].handler, null);
  assert.equal(tryFinally.body[0].finalizer.type, "BlockStatement");

  const tryCatchFinally = parse(createSourceText("try { value(); } catch { recover(); } finally { cleanup(); }"));
  assert.equal(tryCatchFinally.body[0].type, "TryStatement");
  assert.equal(tryCatchFinally.body[0].handler.param, null);
  assert.equal(tryCatchFinally.body[0].finalizer.type, "BlockStatement");
});

test("parser handles throw statements", () => {
  const ast = parse(createSourceText("throw value;"));
  assert.equal(ast.body[0].type, "ThrowStatement");
  assert.equal(ast.body[0].argument.type, "Identifier");
  assert.equal(ast.body[0].argument.name, "value");
});

test("parser rejects malformed do-while syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("do { break; };")),
    /Malformed do-while statement: expected 'while' after the body/
  );
});

test("parser rejects malformed switch clauses clearly", () => {
  assert.throws(
    () => parse(createSourceText("switch (value) { default: break; default: break; }")),
    /Switch statements may only contain one default clause/
  );

  assert.throws(
    () => parse(createSourceText("switch (value) { case item: break; }")),
    /Switch case labels in this slice must be literal values/
  );
});

test("parser rejects malformed try/catch/finally syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("try { value(); }")),
    /Try statements require a catch or finally clause/
  );

  assert.throws(
    () => parse(createSourceText("try { value(); } catch (1) { recover(); }")),
    /Catch bindings must be identifiers/
  );

  assert.throws(
    () => parse(createSourceText("try { value(); } finally cleanup();")),
    /Expected '\{' to start finally block/
  );
});

test("parser rejects malformed throw syntax clearly", () => {
  assert.throws(
    () => parse(createSourceText("throw;")),
    /Throw statements require an expression/
  );
});
