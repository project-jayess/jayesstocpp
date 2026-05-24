import {
  jayessDialogMessage,
  jayessDialogOpenDirectory,
  jayessDialogOpenFile,
  jayessDialogSaveFile
} from "./dialog-primitives.hpp";

export function openFile(options) {
  return jayessDialogOpenFile(options);
}

export function saveFile(options) {
  return jayessDialogSaveFile(options);
}

export function openDirectory(options) {
  return jayessDialogOpenDirectory(options);
}

export function message(options) {
  return jayessDialogMessage(options);
}
