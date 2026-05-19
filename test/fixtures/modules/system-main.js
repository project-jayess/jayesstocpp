import { args, cwd, exitCode, getEnv, hasEnv } from "jayess:system";

export function run() {
  return [
    args(),
    cwd(),
    getEnv("JAYESS_TEST"),
    hasEnv("JAYESS_TEST"),
    exitCode(0)
  ];
}
