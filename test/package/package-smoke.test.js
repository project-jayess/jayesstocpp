import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createManagedTempDir } from "../support/temp-dir.js";

function runNpm(args, options = {}) {
  if (process.platform === "win32") {
    return execFileSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm", ...args], options);
  }
  return execFileSync("npm", args, options);
}

test("package root API imports from a temporary project", (t) => {
  const tempDir = createManagedTempDir(t, "package-root-import");
  const packOutput = runNpm(["pack", "--json", "--pack-destination", tempDir], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  const [{ filename }] = JSON.parse(packOutput);
  const tarball = path.join(tempDir, filename);

  fs.writeFileSync(path.join(tempDir, "package.json"), JSON.stringify({ type: "module" }), "utf8");
  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
    cwd: tempDir,
    stdio: "pipe",
    encoding: "utf8"
  });

  fs.writeFileSync(path.join(tempDir, "probe.mjs"), [
    'import { transpile, transpileFile } from "jayesstocpp";',
    'if (typeof transpile !== "function" || typeof transpileFile !== "function") throw new Error("missing package API");',
    'console.log(transpile("const value = 1;").includes("value") ? "ok" : "bad");'
  ].join("\n"), "utf8");

  const output = execFileSync(process.execPath, ["probe.mjs"], {
    cwd: tempDir,
    encoding: "utf8"
  }).trim();
  assert.equal(output, "ok");
});

test("package file list includes source inputs and excludes generated custom-test outputs", () => {
  const dryRunOutput = runNpm(["pack", "--dry-run", "--json"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  const [{ files }] = JSON.parse(dryRunOutput);
  const packed = new Set(files.map((file) => file.path.replace(/\\/g, "/")));

  assert.ok(packed.has("package.json"));
  assert.ok([...packed].some((file) => file.startsWith("src/")));
  assert.ok([...packed].some((file) => file.startsWith("stdlib/")));
  assert.ok(packed.has("README.md"));
  assert.ok(packed.has("LICENSE"));
  assert.equal([...packed].some((file) => file.startsWith("custom-test/") && file.includes("/cpp/")), false);
  assert.equal([...packed].some((file) => file.startsWith("custom-test/") && file.includes("/dist/")), false);
  assert.equal([...packed].some((file) => file === "tools/transpile-file.js"), false);
});
