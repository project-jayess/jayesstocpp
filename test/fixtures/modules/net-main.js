import { fromUtf8 } from "jayess:bytes";
import {
  close,
  connect,
  connectWithCancellation,
  connectWithTimeout,
  connectWithTimeoutAndCancellation,
  listen,
  localAddress,
  localPort,
  read,
  readWithCancellation,
  remoteAddress,
  remotePort,
  write,
  writeWithCancellation
} from "jayess:net";
import { createCancellationToken } from "jayess:async";

export async function openClient(host, port) {
  var socket = await connect(host, port, { timeoutMillis: 1000 });
  var localHost = localAddress(socket);
  var localPortValue = localPort(socket);
  var remoteHost = remoteAddress(socket);
  var remotePortValue = remotePort(socket);
  await write(socket, fromUtf8("ping"));
  var response = await read(socket);
  await close(socket);
  return response;
}

export async function openClientWithCancellation(host, port) {
  var token = createCancellationToken();
  var socket = await connectWithTimeoutAndCancellation(host, port, { timeoutMillis: 1000 }, 1000, token);
  await writeWithCancellation(socket, fromUtf8("ping"), token);
  var response = await readWithCancellation(socket, token);
  await close(socket);
  return response;
}

export async function openClientWithTimeout(host, port) {
  var socket = await connectWithTimeout(host, port, { timeoutMillis: 1000 }, 1000);
  await close(socket);
  return true;
}

export async function openClientWithToken(host, port) {
  var token = createCancellationToken();
  var socket = await connectWithCancellation(host, port, { timeoutMillis: 1000 }, token);
  await close(socket);
  return true;
}

export function openServer(host, port, handler) {
  var server = listen(host, port, handler, { backlog: 4, reuseAddress: true });
  var hostValue = localAddress(server);
  var portValue = localPort(server);
  return server;
}
