import {
  jayessOsArch,
  jayessOsHomeDir,
  jayessOsHostname,
  jayessOsNewline,
  jayessOsPlatform,
  jayessOsTmpDir
} from "./os-primitives.hpp";

export function platform() {
  return jayessOsPlatform();
}

export function arch() {
  return jayessOsArch();
}

export function homeDir() {
  return jayessOsHomeDir();
}

export function tmpDir() {
  return jayessOsTmpDir();
}

export function hostname() {
  return jayessOsHostname();
}

export function newline() {
  return jayessOsNewline();
}
