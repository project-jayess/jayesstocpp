import fs from "node:fs";
import path from "node:path";

const snapshotRoot = path.resolve("test", "snapshots");

export function getSnapshotPath(name) {
  return path.join(snapshotRoot, `${name}.cpp`);
}

export function readSnapshot(name) {
  return fs.readFileSync(getSnapshotPath(name), "utf8");
}

export function writeSnapshot(name, content) {
  fs.mkdirSync(snapshotRoot, { recursive: true });
  fs.writeFileSync(getSnapshotPath(name), content, "utf8");
}
