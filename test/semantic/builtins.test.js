import test from "node:test";
import assert from "node:assert/strict";
import { parse } from "../../src/parser/parse.js";
import { createSourceText } from "../../src/source/source-text.js";
import { analyzeModule } from "../../src/semantic/analyze.js";
import { JayessError } from "../../src/diagnostics.js";

test("semantic analysis rejects Node built-in imports inside Jayess source", () => {
  const sourceText = createSourceText('import { readFileSync } from "node:fs";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /jayess:fs/
  );
});

test("semantic analysis points node:path imports at jayess:path", () => {
  const sourceText = createSourceText('import { join } from "node:path";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /jayess:path/
  );
});

test("semantic analysis points node:child_process imports at jayess:subprocess", () => {
  const sourceText = createSourceText('import { spawn } from "node:child_process";');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /jayess:subprocess/
  );
});

test("semantic analysis points supported Node host imports at the matching Jayess-owned modules", () => {
  const cases = [
    ['import { cwd } from "node:process";', /jayess:process/],
    ['import { platform } from "node:os";', /jayess:os/],
    ['import { parse } from "node:url";', /jayess:url/],
    ['import { setTimeout } from "node:timers";', /jayess:timers/],
    ['import { Worker } from "node:worker_threads";', /jayess:thread/]
  ];
  for (const [source, pattern] of cases) {
    const sourceText = createSourceText(source);
    const ast = parse(sourceText);
    assert.throws(
      () => analyzeModule(ast, sourceText),
      pattern,
      source
    );
  }
});

test("semantic analysis accepts supported composite built-ins", () => {
  const sourceText = createSourceText('var values = [1, 2]; var size = values.length; values.push(3); values.pop(); values.join("-"); values.includes(2); var nameSize = "Jayess".length; "Jayess".slice(1, 3); "Jayess".substring(2); "Jayess".startsWith("Ja"); "Jayess".includes("aye"); "Jayess".indexOf("ye"); "Jayess".endsWith("ss");');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis accepts supported primitive toString built-ins", () => {
  const sourceText = createSourceText('var name = "Jayess".toString(); var count = (1).toString(); var enabled = true.toString(); var empty = null.toString();');
  const ast = parse(sourceText);
  const result = analyzeModule(ast, sourceText, { throwOnError: false });
  assert.equal(result.diagnostics.length, 0);
});

test("semantic analysis rejects unsupported composite built-ins on literals", () => {
  const sourceText = createSourceText('var size = [1, 2].length; [1, 2].map; "Jayess".trim; true.valueOf;');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /Unsupported built-in array property 'map'/
  );
});

test("semantic analysis rejects ambient global parseInt with a focused module diagnostic", () => {
  const sourceText = createSourceText('parseInt("12");');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /import \{ parseInt \} from 'jayess:number'/
  );
});

test("semantic analysis rejects ambient global Object helpers with a focused module diagnostic", () => {
  const sourceText = createSourceText("Object.keys({ value: 1 });");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /import \{ keys, values, entries \} from 'jayess:object'/
  );
});

test("semantic analysis rejects ambient globals that already have Jayess-owned module replacements", () => {
  const cases = [
    ["parseFloat(\"12.5\");", /import \{ parseFloat \} from 'jayess:number'/],
    ["Date.now();", /import helpers from 'jayess:date'/],
    ["JSON.stringify({ value: 1 });", /import helpers from 'jayess:json'/],
    ["Map;", /import helpers from 'jayess:collections\/map'/],
    ["Set;", /import helpers from 'jayess:collections\/set'/],
    ["Promise.resolve(1);", /jayess:async/]
  ];
  for (const [source, pattern] of cases) {
    const sourceText = createSourceText(source);
    const ast = parse(sourceText);
    assert.throws(
      () => analyzeModule(ast, sourceText),
      pattern,
      source
    );
  }
});

test("semantic analysis rejects ambient global RegExp with a focused module diagnostic", () => {
  const sourceText = createSourceText("RegExp;");
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /import helpers from 'jayess:regex'/
  );
});

test("semantic analysis rejects ambient RegExp calls and construction with a focused module diagnostic", () => {
  for (const source of ['RegExp("a");', 'new RegExp("a");']) {
    const sourceText = createSourceText(source);
    const ast = parse(sourceText);
    assert.throws(
      () => analyzeModule(ast, sourceText),
      /import helpers from 'jayess:regex'/,
      source
    );
  }
});

test("semantic analysis rejects ambient global eval with an unsupported-by-design diagnostic", () => {
  const sourceText = createSourceText('eval("value");');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /runtime source evaluation is unsupported by design/
  );
});

test("semantic analysis rejects the JavaScript Function constructor with an unsupported-by-design diagnostic", () => {
  const sourceText = createSourceText('Function("return 1;");');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /runtime source evaluation is unsupported by design/
  );
});

test("semantic analysis rejects calling non-callable built-in length", () => {
  const sourceText = createSourceText('"Jayess".length();');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /string property 'length' is not callable/
  );
});

test("semantic analysis rejects arguments for primitive toString built-ins", () => {
  const sourceText = createSourceText('(1).toString(10);');
  const ast = parse(sourceText);
  assert.throws(
    () => analyzeModule(ast, sourceText),
    /number method 'toString' does not accept arguments/
  );
});

test("semantic analysis rejects invalid array and string built-in argument counts", () => {
  assert.throws(
    () => analyzeModule(parse(createSourceText("[1, 2].pop(1);")), createSourceText("[1, 2].pop(1);")),
    /array method 'pop' does not accept arguments/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('[1, 2].join("-", "!");')), createSourceText('[1, 2].join("-", "!");')),
    /array method 'join' accepts at most one argument/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText("[1, 2].includes();")), createSourceText("[1, 2].includes();")),
    /array method 'includes' requires exactly one argument/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".slice();')), createSourceText('"Jayess".slice();')),
    /string method 'slice' requires one or two arguments/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".startsWith();')), createSourceText('"Jayess".startsWith();')),
    /string method 'startsWith' requires exactly one argument/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".includes();')), createSourceText('"Jayess".includes();')),
    /string method 'includes' requires exactly one argument/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".indexOf();')), createSourceText('"Jayess".indexOf();')),
    /string method 'indexOf' requires exactly one argument/
  );
  assert.throws(
    () => analyzeModule(parse(createSourceText('"Jayess".endsWith();')), createSourceText('"Jayess".endsWith();')),
    /string method 'endsWith' requires exactly one argument/
  );
});
