import test from "node:test";
import assert from "node:assert/strict";
import { transpile } from "../../src/api/transpile.js";
import { readSnapshot } from "../support/snapshots.js";
import { transpileSnapshotCases } from "../support/transpile-snapshot-cases.js";

for (const snapshotCase of transpileSnapshotCases) {
  test(`transpile snapshot matches for ${snapshotCase.name}`, () => {
    const cpp = transpile(snapshotCase.source, { moduleName: snapshotCase.moduleName });
    assert.equal(cpp, readSnapshot(snapshotCase.name));
  });
}
