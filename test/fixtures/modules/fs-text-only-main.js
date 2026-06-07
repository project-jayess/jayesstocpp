import { readTextSync, writeTextSync } from "jayess:fs";

export function run(path) {
  writeTextSync(path, "Jayess");
  return readTextSync(path);
}

function main() {
  run("fs-text-only.txt");
  return 6;
}
