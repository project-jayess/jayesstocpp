import {
  argv,
  cwd,
  envEntries,
  envKeys,
  getEnv,
  hasEnv
} from "jayess:process";

export function inspectEnv(name) {
  return [
    hasEnv(name),
    getEnv(name),
    envKeys().length,
    envEntries().length,
    cwd().length,
    argv().length
  ];
}
