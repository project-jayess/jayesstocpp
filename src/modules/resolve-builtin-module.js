import fs from "node:fs";
import path from "node:path";
import { builtinRoot } from "./builtin-root.js";

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
