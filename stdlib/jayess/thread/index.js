import {
  jayessThreadCurrentId,
  jayessThreadHardwareConcurrency,
  jayessThreadJoin,
  jayessThreadSleep,
  jayessThreadSpawn
} from "./thread-primitives.hpp";

export function spawn(callback, args) {
  return jayessThreadSpawn(callback, args);
}

export function join(handle) {
  return jayessThreadJoin(handle);
}

export function sleep(milliseconds) {
  return jayessThreadSleep(milliseconds);
}

export function hardwareConcurrency() {
  return jayessThreadHardwareConcurrency();
}

export function currentId() {
  return jayessThreadCurrentId();
}
