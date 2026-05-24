import {
  arch,
  homeDir,
  hostname,
  newline,
  platform,
  tmpDir
} from "jayess:os";

export function run() {
  var home = homeDir();
  var host = hostname();
  if (home == null) {
    home = "";
  }
  if (host == null) {
    host = "";
  }
  return platform() + arch() + home + tmpDir() + host + newline();
}
