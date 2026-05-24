import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { resolveBuiltinModule } from "../../src/modules/resolve-builtin-module.js";

function documentedBuiltinSpecifiers() {
  const matrixSource = fs.readFileSync(path.resolve("docs/standard-library-matrix.md"), "utf8");
  return [...new Set(
    matrixSource
      .split(/\r?\n/)
      .filter((line) => /^\| `jayess:/.test(line))
      .map((line) => line.match(/`(jayess:[^`]+)`/)[1])
  )].sort();
}

function shippedBuiltinSpecifiers() {
  const root = path.resolve("stdlib/jayess");
  const modules = [];

  function visit(currentDir, parts = []) {
    const indexPath = path.join(currentDir, "index.js");
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      modules.push(`jayess:${parts.join("/")}`);
    }

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      visit(path.join(currentDir, entry.name), [...parts, entry.name]);
    }
  }

  visit(root);
  return modules.sort();
}

test("documented built-in module matrix matches shipped stdlib layout", () => {
  assert.deepEqual(documentedBuiltinSpecifiers(), shippedBuiltinSpecifiers());
});

test("resolveBuiltinModule resolves every documented built-in module", () => {
  for (const specifier of documentedBuiltinSpecifiers()) {
    const resolved = resolveBuiltinModule(specifier);
    assert.ok(resolved, `expected ${specifier} to resolve`);
    assert.ok(fs.existsSync(resolved), `expected ${specifier} target to exist`);
    assert.match(resolved.split(path.sep).join("/"), new RegExp(`stdlib/jayess/${specifier.slice("jayess:".length).replace("/", "\\/")}/index\\.js$`));
  }
});
