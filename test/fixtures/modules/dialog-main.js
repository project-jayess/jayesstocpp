import { message, openDirectory, openFile, saveFile } from "jayess:dialog";

export function invalidOpenFileOptions() {
  return openFile(123);
}

export function invalidSaveFileFilters() {
  return saveFile({
    filters: [
      { name: "Images", extensions: ["png", "jpg"] },
      { name: "Broken", extensions: [""] }
    ]
  });
}

export function invalidOpenDirectoryDefaultPath() {
  return openDirectory({ defaultPath: 42 });
}

export function invalidMessageButtons() {
  return message({
    title: "Ask",
    message: "Continue?",
    buttons: "later"
  });
}

export function unavailableOpenFile() {
  return openFile({
    title: "Open",
    filters: [
      { name: "Text", extensions: ["txt"] }
    ]
  });
}

export function unavailableMessage() {
  return message({
    title: "Notice",
    message: "Unavailable",
    kind: "info",
    buttons: "ok"
  });
}

export function selectOpenFile() {
  return openFile({
    title: "Open",
    defaultPath: "C:/temp/input.txt",
    filters: [
      { name: "Text", extensions: ["txt"] }
    ]
  });
}

export function selectSaveFile() {
  return saveFile({
    title: "Save",
    defaultPath: "C:/temp/output.txt",
    filters: [
      { name: "Text", extensions: ["txt"] }
    ]
  });
}

export function selectDirectory() {
  return openDirectory({
    title: "Directory",
    defaultPath: "C:/temp"
  });
}

export function askMessage() {
  return message({
    title: "Question",
    message: "Continue?",
    kind: "question",
    buttons: "yesNoCancel"
  });
}
