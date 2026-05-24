import {
  createTar,
  extractTar,
  readTar,
  readTarSync,
  writeTar,
  writeTarSync
} from "jayess:archive";
import { fromUtf8, length as bytesLength } from "jayess:bytes";

function entries() {
  return [
    { path: "docs/readme.txt", text: "hello", mode: 420 },
    { path: "bin/data.bin", bytes: fromUtf8("bytes"), mode: 384 }
  ];
}

export function run(syncPath, asyncPath) {
  var archive = createTar(entries());
  var extracted = extractTar(archive);
  writeTarSync(syncPath, entries());
  var syncEntries = readTarSync(syncPath);
  return [
    bytesLength(archive),
    extracted.length,
    extracted[0].path,
    extracted[0].text,
    extracted[1].mode,
    syncEntries[1].text,
    asyncPath
  ];
}

export async function runAsync(path) {
  await writeTar(path, entries());
  var extracted = await readTar(path);
  return extracted[0].text + " " + extracted[1].text;
}

export function unsafePath() {
  return createTar([{ path: "../escape.txt", text: "bad" }]);
}

export function unsupportedType() {
  return createTar([{ path: "link", text: "bad", type: "symlink" }]);
}
