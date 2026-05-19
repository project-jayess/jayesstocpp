import {
  jayessSystemArgs,
  jayessSystemCwd,
  jayessSystemExitCode,
  jayessSystemGetEnv,
  jayessSystemHasEnv
} from "./system-primitives.hpp";

export function args() {
  return jayessSystemArgs();
}

export function cwd() {
  return jayessSystemCwd();
}

export function getEnv(name) {
  return jayessSystemGetEnv(name);
}

export function hasEnv(name) {
  return jayessSystemHasEnv(name);
}

export function exitCode(value) {
  return jayessSystemExitCode(value);
}
