import {
  jayessProcessCwd,
  jayessProcessExit,
  jayessProcessGetEnv
} from "./process-primitives.hpp";

export function cwd() {
  return jayessProcessCwd();
}

export function getEnv(key) {
  return jayessProcessGetEnv(key);
}

export function exit(code) {
  return jayessProcessExit(code);
}
