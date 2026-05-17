import { transpile } from "../src/api/transpile.js";
import { writeSnapshot } from "../test/support/snapshots.js";
import { transpileSnapshotCases } from "../test/support/transpile-snapshot-cases.js";

for (const snapshotCase of transpileSnapshotCases) {
  const cpp = transpile(snapshotCase.source, { moduleName: snapshotCase.moduleName });
  writeSnapshot(snapshotCase.name, cpp);
}
