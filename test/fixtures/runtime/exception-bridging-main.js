import { readText, readTextSync } from "jayess:fs";

export function throwJayess() {
  throw "jayess boom";
}

export function throwNativeSync() {
  return readTextSync("missing-runtime-file.txt");
}

export async function throwNativeAsync() {
  return await readText("missing-runtime-file.txt");
}
