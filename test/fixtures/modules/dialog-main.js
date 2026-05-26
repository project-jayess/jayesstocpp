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

export function invalidOpenFileMultiple() {
  return openFile({
    multiple: "yes"
  });
}

export function invalidOpenFileOption() {
  return openFile({
    title: "Open",
    unknown: true
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

export function selectOpenFiles() {
  return openFile({
    title: "Open Many",
    defaultPath: "C:/temp",
    multiple: true,
    filters: [
      { name: "Text", extensions: ["txt", "md"] }
    ]
  });
}

export function selectSaveFile() {
  return saveFile({
    title: "Save",
    defaultPath: "C:/temp/output.txt",
    defaultName: "export.txt",
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
    detail: "This action can be cancelled.",
    kind: "question",
    buttons: "yesNoCancel"
  });
}
