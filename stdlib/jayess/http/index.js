import {
  jayessHttpBeginStream,
  jayessHttpRequestBody,
  jayessHttpRequestHeaders,
  jayessHttpRequestMethod,
  jayessHttpRequestPath,
  jayessHttpResponseBytes,
  jayessHttpResponseText,
  jayessHttpCreateServer,
  jayessHttpCloseServer,
  jayessHttpEnd,
  jayessHttpEndStream,
  jayessHttpRequest,
  jayessHttpServerState,
  jayessHttpSetHeader,
  jayessHttpSetStatus,
  jayessHttpWrite,
  jayessHttpWriteStream
} from "./http-primitives.hpp";
import { fromUtf8 as bytesFromUtf8, length as bytesLength } from "jayess:bytes";
import { readBytesSync, removeSync, statSync } from "jayess:fs";
import { parse as parseJson, stringify as stringifyJson } from "jayess:json";
import { lookup as lookupMime } from "jayess:mime";
import { has as objectHas, keys } from "jayess:object";
import { join } from "jayess:path";
import { parse as parseQuery } from "jayess:querystring";
import { includes, slice, split, startsWith, toLower } from "jayess:string";
import { readChunk } from "jayess:stream";
import { timeoutWithCancellation, withCancellation, withTimeout } from "jayess:async";
export { getSignedCookie, setSignedCookie, signSession, verifySession } from "./session.js";
export { pathname, queryParam, url } from "./request.js";

export function request(options) {
  return jayessHttpRequest(options);
}

export function requestWithCancellation(options, token) {
  return withCancellation(request(options), token);
}

export function requestWithTimeout(options, milliseconds) {
  return withTimeout(request(options), milliseconds);
}

export function requestWithTimeoutAndCancellation(options, milliseconds, token) {
  return timeoutWithCancellation(request(options), milliseconds, token);
}

export function text(response) {
  return jayessHttpResponseText(response);
}

export function bytes(response) {
  return jayessHttpResponseBytes(response);
}

export function json(response) {
  return parseJson(text(response));
}

export function textBody(value) {
  return value;
}

export function bytesBody(value) {
  return value;
}

export function jsonBody(value) {
  return stringifyJson(value);
}

export function method(requestValue) {
  return jayessHttpRequestMethod(requestValue);
}

export function path(requestValue) {
  return jayessHttpRequestPath(requestValue);
}

export function headers(requestValue) {
  return jayessHttpRequestHeaders(requestValue);
}

export function body(requestValue) {
  return jayessHttpRequestBody(requestValue);
}

function bodyLimit(options) {
  if (options === null || !objectHas(options, "maxBytes")) {
    return -1;
  }
  if (options.maxBytes < 0) {
    throw "jayess:http body maxBytes must be non-negative";
  }
  return options.maxBytes;
}

export function bodyText(requestValue, options) {
  var value = body(requestValue);
  var maxBytes = bodyLimit(options);
  if (maxBytes >= 0 && value.length > maxBytes) {
    throw "jayess:http request body exceeded maxBytes";
  }
  return value;
}

export function bodyBytes(requestValue, options) {
  return bytesFromUtf8(bodyText(requestValue, options));
}

export function collectBody(requestValue, options) {
  return bodyText(requestValue, options);
}

export function header(requestValue, name) {
  return headers(requestValue)[name] ?? null;
}

export function query(requestValue) {
  var requestPath = path(requestValue);
  var index = requestPath.indexOf("?");
  if (index < 0) {
    return {};
  }
  return parseQuery(slice(requestPath, index + 1, requestPath.length));
}

export function params(requestValue) {
  if (requestValue.params === null) {
    return {};
  }
  return requestValue.params;
}

export function createServer(handler, options) {
  return jayessHttpCreateServer(handler, options);
}

export function close(server) {
  return jayessHttpCloseServer(server);
}

export function state(server) {
  return jayessHttpServerState(server);
}

export function setStatus(response, statusCode) {
  return jayessHttpSetStatus(response, statusCode);
}

export function status(response, statusCode) {
  if (statusCode < 100 || statusCode > 999) {
    throw "jayess:http response status must be between 100 and 999";
  }
  return setStatus(response, statusCode);
}

export function setHeader(response, name, value) {
  return jayessHttpSetHeader(response, name, value);
}

export function write(response, body) {
  return jayessHttpWrite(response, body);
}

export function end(response, body) {
  return jayessHttpEnd(response, body);
}

function beginStream(response) {
  return jayessHttpBeginStream(response);
}

function writeStream(response, body) {
  return jayessHttpWriteStream(response, body);
}

function endStream(response) {
  return jayessHttpEndStream(response);
}

function applyResponseOptions(response, options) {
  if (options === null) {
    return response;
  }
  if (objectHas(options, "status")) {
    setStatus(response, options.status);
  }
  if (objectHas(options, "headers")) {
    var names = keys(options.headers);
    for (var index = 0; index < names.length; index = index + 1) {
      var name = names[index];
      setHeader(response, name, options.headers[name]);
    }
  }
  if (objectHas(options, "contentType")) {
    setHeader(response, "Content-Type", options.contentType);
  }
  return response;
}

export function sendText(response, value, options) {
  applyResponseOptions(response, options);
  if (options === null || !objectHas(options, "contentType")) {
    setHeader(response, "Content-Type", "text/plain");
  }
  return end(response, value);
}

export function sendJson(response, value, options) {
  applyResponseOptions(response, options);
  if (options === null || !objectHas(options, "contentType")) {
    setHeader(response, "Content-Type", "application/json");
  }
  return end(response, stringifyJson(value));
}

export function sendBytes(response, value, options) {
  applyResponseOptions(response, options);
  return end(response, value);
}

function responseStreamChunkSize(chunkSize) {
  if (chunkSize === null) {
    return 65536;
  }
  if (chunkSize < 1) {
    throw "jayess:http stream chunkSize must be at least 1";
  }
  return chunkSize;
}

async function sendResponseStream(response, stream, options, chunkSize, defaultContentType) {
  applyResponseOptions(response, options);
  if (defaultContentType !== null && (options === null || !objectHas(options, "contentType"))) {
    setHeader(response, "Content-Type", defaultContentType);
  }
  var resolvedChunkSize = responseStreamChunkSize(chunkSize);
  beginStream(response);
  while (true) {
    var chunk = await readChunk(stream, resolvedChunkSize);
    if (bytesLength(chunk) === 0) {
      endStream(response);
      return null;
    }
    writeStream(response, chunk);
  }
}

export async function sendTextStream(response, stream, options, chunkSize) {
  return sendResponseStream(response, stream, options, chunkSize, "text/plain");
}

export async function sendBytesStream(response, stream, options, chunkSize) {
  return sendResponseStream(response, stream, options, chunkSize, null);
}

export function notFound(response, message) {
  return sendText(response, message, { status: 404, contentType: "text/plain" });
}

export function redirect(response, location, status) {
  setStatus(response, status);
  setHeader(response, "Location", location);
  return end(response, "");
}

function staticContentType(filename) {
  var contentType = lookupMime(filename);
  if (contentType === null || contentType === "") {
    return "application/octet-stream";
  }
  return contentType;
}

export function sendFile(response, filename, options) {
  applyResponseOptions(response, options);
  if (options === null || !objectHas(options, "contentType")) {
    setHeader(response, "Content-Type", staticContentType(filename));
  }
  try {
    return end(response, readBytesSync(filename));
  } catch (error) {
    var details = statSync(filename);
    if (!details.exists) {
      return notFound(response, "not found");
    }
    return sendText(response, "file read failed", { status: 500, contentType: "text/plain" });
  }
}

function requireStaticRoot(root) {
  if (root === null || root === "") {
    throw "jayess:http serveStatic root must be non-empty";
  }
  return root;
}

function staticIndexName(options) {
  if (options === null || !objectHas(options, "index")) {
    return "index.html";
  }
  if (options.index === null) {
    throw "jayess:http serveStatic index option must be a string";
  }
  return options.index;
}

function staticCacheControl(options) {
  if (options === null || !objectHas(options, "cacheControl")) {
    return "";
  }
  if (options.cacheControl === null) {
    return "";
  }
  return options.cacheControl;
}

function pathname(requestPath) {
  var index = requestPath.indexOf("?");
  if (index < 0) {
    return requestPath;
  }
  return slice(requestPath, 0, index);
}

function encodedUnsafeStaticPath(requestPathname) {
  var lowerPath = toLower(requestPathname);
  return includes(lowerPath, "%2e") || includes(lowerPath, "%2f") || includes(lowerPath, "%5c");
}

function safeStaticPath(root, requestPath) {
  var requestPathname = pathname(requestPath);
  if (encodedUnsafeStaticPath(requestPathname)) {
    return null;
  }
  var parts = split(requestPathname, "/");
  var resolved = root;

  for (var index = 0; index < parts.length; index = index + 1) {
    var part = parts[index];
    if (part === "" || part === ".") {
      continue;
    }
    if (part === ".." || includes(part, "\\")) {
      return null;
    }
    resolved = join(resolved, part);
  }

  return resolved;
}

export function serveStatic(root, options) {
  var staticRoot = requireStaticRoot(root);
  var indexName = staticIndexName(options);
  var cacheControl = staticCacheControl(options);

  return function(requestValue, response) {
    var filename = safeStaticPath(staticRoot, path(requestValue));
    if (filename === null) {
      return sendText(response, "unsafe path", { status: 400, contentType: "text/plain" });
    }

    var details = statSync(filename);
    if (!details.exists) {
      return notFound(response, "not found");
    }
    if (details.isDirectory) {
      if (indexName === "") {
        return notFound(response, "not found");
      }
      filename = join(filename, indexName);
      details = statSync(filename);
      if (!details.exists || !details.isFile) {
        return notFound(response, "not found");
      }
    }
    if (!details.isFile) {
      return notFound(response, "not found");
    }

    if (cacheControl === "") {
      return sendFile(response, filename, { contentType: staticContentType(filename) });
    }
    return sendFile(response, filename, {
      contentType: staticContentType(filename),
      headers: {
        "Cache-Control": cacheControl
      }
    });
  };
}

export function deleteThenSendFile(response, filename, options) {
  removeSync(filename);
  return sendFile(response, filename, options);
}

export function serveFiles(root, options) {
  return serveStatic(root, options);
}

function requireRouteMethod(value) {
  if (value === null || value === "") {
    throw "jayess:http route method must be non-empty";
  }
  return value;
}

function requireRoutePath(value) {
  if (value === null || value === "") {
    throw "jayess:http route path must be non-empty";
  }
  return value;
}

function requireRouteHandler(value) {
  if (value === null) {
    throw "jayess:http route handler is required";
  }
  return value;
}

export function route(routeMethod, routePath, handler) {
  return {
    method: requireRouteMethod(routeMethod),
    path: requireRoutePath(routePath),
    handler: requireRouteHandler(handler)
  };
}

export function router(routes) {
  if (routes === null) {
    throw "jayess:http router requires an array of routes";
  }
  return {
    routes: routes
  };
}

function matchRoutePath(routePath, requestPath) {
  var routeParts = split(routePath, "/");
  var requestParts = split(requestPath, "/");
  if (routeParts.length !== requestParts.length) {
    return null;
  }

  var captured = {};
  for (var index = 0; index < routeParts.length; index = index + 1) {
    var routePart = routeParts[index];
    var requestPart = requestParts[index];
    if (startsWith(routePart, ":")) {
      captured[slice(routePart, 1, routePart.length)] = requestPart;
    } else if (routePart !== requestPart) {
      return null;
    }
  }
  return captured;
}

export function match(routerValue, requestValue) {
  if (routerValue === null || routerValue.routes === null) {
    throw "jayess:http match requires a router";
  }

  var requestMethod = method(requestValue);
  var requestPath = pathname(path(requestValue));
  var routes = routerValue.routes;

  for (var index = 0; index < routes.length; index = index + 1) {
    var current = routes[index];
    if (current.method === requestMethod) {
      var capturedParams = matchRoutePath(current.path, requestPath);
      if (capturedParams !== null) {
        return {
          method: current.method,
          path: current.path,
          handler: current.handler,
          params: capturedParams
        };
      }
    }
  }

  return null;
}

export function handle(routerValue, requestValue, response) {
  var matched = match(routerValue, requestValue);
  if (matched === null) {
    return notFound(response, "not found");
  }
  requestValue.params = matched.params;
  return matched.handler(requestValue, response);
}

export function compose(handlers) {
  if (handlers === null) {
    throw "jayess:http compose requires an array of handlers";
  }
  return function(requestValue, response) {
    for (var index = 0; index < handlers.length; index = index + 1) {
      var result = handlers[index](requestValue, response);
      if (result !== null) {
        return result;
      }
    }
    return null;
  };
}
