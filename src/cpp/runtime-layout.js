import { selectRuntimeFragments } from "./runtime-fragments.js";

export function renderRuntimeHeaderIncludes() {
  return `#include <array>
#include <atomic>
#include <cstdint>
#include <deque>
#include <fstream>
#include <functional>
#include <exception>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <string>
#include <sstream>
#include <thread>
#include <type_traits>
#include <utility>
#include <vector>
#include <variant>
#include <unordered_map>`;
}

export function renderRuntimeCppIncludes() {
  return `#include <algorithm>
#include <atomic>
#include <cstdlib>
#include <cctype>
#include <chrono>
#include <cmath>
#include <ctime>
#include <deque>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <limits>
#include <mutex>
#include <random>
#include <regex>
#include <stdexcept>
#include <thread>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <cerrno>
#include <csignal>
#include <fcntl.h>
#include <netdb.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <sys/wait.h>
#include <unistd.h>
#include <dlfcn.h>
#endif`;
}

export function renderRuntimeHeaderFragments(features) {
  return selectRuntimeFragments(features)
    .map((fragment) => fragment.header())
    .filter((source) => source.length > 0)
    .join("\n");
}

export function renderRuntimeCppFragments(features, phase) {
  return selectRuntimeFragments(features)
    .filter((fragment) => (phase === "late") === (fragment.key === "string"))
    .map((fragment) => fragment.cpp())
    .filter((source) => source.length > 0)
    .join("\n");
}
