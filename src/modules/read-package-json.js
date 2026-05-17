import fs from "node:fs";

export function readPackageJson(filename) {
  if (!fs.existsSync(filename)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filename, "utf8"));
}
