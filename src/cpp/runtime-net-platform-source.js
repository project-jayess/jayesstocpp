import { getNetPosixPlatformRuntimeFragment } from "./runtime-net-posix-source.js";
import { getNetWindowsPlatformRuntimeFragment } from "./runtime-net-windows-source.js";

export function getNetPlatformRuntimeFragment() {
  return `${getNetPosixPlatformRuntimeFragment()}

${getNetWindowsPlatformRuntimeFragment()}`;
}
