import test from "node:test";
import assert from "node:assert/strict";
import { lex } from "../../src/lexer/lex.js";
import { tokenTypes } from "../../src/lexer/tokens.js";
import { createSourceText } from "../../src/source/source-text.js";

test("lexer handles keywords comments and literals", () => {
  const tokens = lex(
    createSourceText("// comment\nconst x = [1, { name: \"jayess\" }];\nimport \"cpp:vector\";")
  );
  const values = tokens.map((token) => token.value);
  assert.deepEqual(values.slice(0, 4), ["const", "x", "=", "["]);
  assert.ok(values.includes(":"));
  assert.ok(values.includes("jayess"));
  assert.ok(values.includes("import"));
  assert.ok(values.includes("cpp:vector"));
});

test("lexer rejects invalid characters", () => {
  assert.throws(
    () => lex(createSourceText("@")),
    /Unsupported character/
  );
});

test("lexer tokenizes private identifiers", () => {
  const tokens = lex(createSourceText("class Point { #value = 1; this.#value; }"));
  const privateTokens = tokens.filter((token) => token.type === tokenTypes.privateIdentifier);

  assert.equal(privateTokens.length, 2);
  assert.deepEqual(privateTokens.map((token) => token.value), ["value", "value"]);
});

test("lexer rejects malformed private identifiers clearly", () => {
  assert.throws(
    () => lex(createSourceText("class Point { # = 1; }")),
    /Expected private identifier after '#'/ 
  );
});

test("lexer tokenizes template literals with interpolation segments", () => {
  const tokens = lex(createSourceText("var message = `Hello ${name}!`;"));
  const templateToken = tokens.find((token) => token.type === "template");

  assert.ok(templateToken);
  assert.deepEqual(templateToken.value.segments, ["Hello ", "!"]);
  assert.deepEqual(templateToken.value.expressions, ["name"]);
});

test("lexer decodes common string and template escapes", () => {
  const tokens = lex(createSourceText("var line = \"a\\nb\\t\\\\\"; var message = `first\\n${name}\\tlast`;"));
  const stringToken = tokens.find((token) => token.type === tokenTypes.string);
  const templateToken = tokens.find((token) => token.type === tokenTypes.template);

  assert.equal(stringToken.value, "a\nb\t\\");
  assert.deepEqual(templateToken.value.segments, ["first\n", "\tlast"]);
});

test("lexer tokenizes spread punctuators without breaking dot access", () => {
  const tokens = lex(createSourceText("fn(...items); data.value;"));
  const values = tokens.map((token) => token.value);

  assert.ok(values.includes("..."));
  assert.ok(values.includes("."));
});
