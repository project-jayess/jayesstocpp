import {
  jayessNetClose,
  jayessNetConnect,
  jayessNetListen,
  jayessNetLocalAddress,
  jayessNetLocalPort,
  jayessNetRead,
  jayessNetRemoteAddress,
  jayessNetRemotePort,
  jayessNetWrite
} from "./net-primitives.hpp";
import { timeoutWithCancellation, withCancellation, withTimeout } from "jayess:async";

export function connect(host, port, options) {
  return jayessNetConnect(host, port, options);
}

export function connectWithCancellation(host, port, options, token) {
  return withCancellation(connect(host, port, options), token);
}

export function connectWithTimeout(host, port, options, milliseconds) {
  return withTimeout(connect(host, port, options), milliseconds);
}

export function connectWithTimeoutAndCancellation(host, port, options, milliseconds, token) {
  return timeoutWithCancellation(connect(host, port, options), milliseconds, token);
}

export function listen(host, port, handler, options) {
  return jayessNetListen(host, port, handler, options);
}

export function read(socket) {
  return jayessNetRead(socket);
}

export function readWithCancellation(socket, token) {
  return withCancellation(read(socket), token);
}

export function write(socket, data) {
  return jayessNetWrite(socket, data);
}

export function writeWithCancellation(socket, data, token) {
  return withCancellation(write(socket, data), token);
}

export function localAddress(handle) {
  return jayessNetLocalAddress(handle);
}

export function localPort(handle) {
  return jayessNetLocalPort(handle);
}

export function remoteAddress(socket) {
  return jayessNetRemoteAddress(socket);
}

export function remotePort(socket) {
  return jayessNetRemotePort(socket);
}

export function close(handle) {
  return jayessNetClose(handle);
}
