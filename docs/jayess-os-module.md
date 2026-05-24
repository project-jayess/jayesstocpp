# Jayess OS Module

`jayess:os` is the Jayess-owned operating-system information module. It provides a small portable surface for native programs without importing Node.js `os`.

## Surface

- `platform()` returns a string platform family such as `linux`, `darwin`, `windows`, `freebsd`, `unix`, or `unknown`.
- `arch()` returns a string architecture family such as `x64`, `x86`, `arm64`, `arm`, or `unknown`.
- `homeDir()` returns the current user's home directory string, or Jayess null when no supported environment value is available.
- `tmpDir()` returns the process temporary directory string.
- `hostname()` returns a host name string from supported environment values, or Jayess null.
- `newline()` returns the platform newline string.

## Implementation Shape

The module surface lives in `stdlib/jayess/os/index.js`. Native bridge helpers live in `stdlib/jayess/os/os-primitives.hpp`, and portable C++ runtime helpers live in `src/cpp/runtime-os-source.js`.

The runtime keeps platform detection and environment lookup inside the OS helper fragment so generated user modules do not contain preprocessor branches for this surface.
