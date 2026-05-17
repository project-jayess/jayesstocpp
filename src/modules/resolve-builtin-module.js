import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const builtinRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../stdlib/jayess");

export function resolveBuiltinModule(source) {
  if (!source.startsWith("jayess:")) {
    return null;
  }

  const subpath = source.slice("jayess:".length);
  const candidate = path.join(builtinRoot, subpath, "index.js");
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    return null;
  }

  return candidate;
}
