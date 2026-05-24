import {
  jayessProcessArgv,
  jayessProcessCwd,
  jayessProcessEnvEntries,
  jayessProcessEnvKeys,
  jayessProcessExit,
  jayessProcessGetEnv,
  jayessProcessHasEnv
} from "./process-primitives.hpp";

export function argv() {
  return jayessProcessArgv();
}

export function cwd() {
  return jayessProcessCwd();
}

export function getEnv(key) {
  return jayessProcessGetEnv(key);
}

export function hasEnv(key) {
  return jayessProcessHasEnv(key);
}

export function envKeys() {
  return jayessProcessEnvKeys();
}

export function envEntries() {
  return jayessProcessEnvEntries();
}

export function exit(code) {
  return jayessProcessExit(code);
}
