import fs from "node:fs";
import path from "node:path";

const candidateSuffixes = ["", ".js"];

function asFileOrIndex(candidate) {
  for (const suffix of candidateSuffixes) {
    const filename = `${candidate}${suffix}`;
    if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
      return filename;
    }
  }

  for (const suffix of candidateSuffixes) {
    const filename = path.join(candidate, `index${suffix}`);
    if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
      return filename;
    }
  }

  return null;
}

export function resolveRelativeImport(fromFilename, source) {
  return asFileOrIndex(path.resolve(path.dirname(fromFilename), source));
}
