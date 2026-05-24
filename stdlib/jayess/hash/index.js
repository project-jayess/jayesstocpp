import { fromUtf8 } from "jayess:bytes";
import { sha1, sha256 } from "jayess:crypto";
import { hexEncode } from "jayess:encoding";
import { readBytes, readBytesSync, readText, readTextSync } from "jayess:fs";
import { readAllBytes } from "jayess:stream";

export function sha256Bytes(bytes) {
  return hexEncode(sha256(bytes));
}

export function sha1Bytes(bytes) {
  return hexEncode(sha1(bytes));
}

export function sha256Text(text) {
  return sha256Bytes(fromUtf8(text));
}

export function sha1Text(text) {
  return sha1Bytes(fromUtf8(text));
}

export async function sha256File(path) {
  return sha256Bytes(await readBytes(path));
}

export async function sha1File(path) {
  return sha1Bytes(await readBytes(path));
}

export function sha256FileSync(path) {
  return sha256Bytes(readBytesSync(path));
}

export function sha1FileSync(path) {
  return sha1Bytes(readBytesSync(path));
}

export async function sha256TextFile(path) {
  return sha256Text(await readText(path));
}

export function sha256TextFileSync(path) {
  return sha256Text(readTextSync(path));
}

export async function streamSha256(stream, chunkSize) {
  return sha256Bytes(await readAllBytes(stream, chunkSize));
}

export async function streamSha1(stream, chunkSize) {
  return sha1Bytes(await readAllBytes(stream, chunkSize));
}
