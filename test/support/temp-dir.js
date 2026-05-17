import fs from "node:fs";
import path from "node:path";

function ensureInsideRoot(rootDir, candidateDir) {
  const relative = path.relative(rootDir, candidateDir);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function createManagedTempDir(testContext, name) {
  const root = path.join(process.cwd(), "temp", "test-output");
  fs.mkdirSync(root, { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, `${name}-`));

  testContext.after(() => {
    if (ensureInsideRoot(root, dir) && fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  return dir;
}
