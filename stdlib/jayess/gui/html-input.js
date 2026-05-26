function nodeId(node) {
  if (node === null || node.attributes === null) {
    return null;
  }
  if (node.attributes.id !== null) {
    return node.attributes.id;
  }
  if (node.attributes.name !== null) {
    return node.attributes.name;
  }
  return null;
}

export function inputValue(node) {
  if (node === null || node.attributes === null || node.attributes.value === null) {
    return "";
  }
  return node.attributes.value;
}

export function setInputValue(node, value) {
  node.attributes.value = value;
  if (node.layout !== null) {
    node.layout.text = value;
  }
  return node;
}

export function editHtmlInput(node, event) {
  var value = inputValue(node);
  var cursor = node.attributes.cursor;
  if (cursor === null) {
    cursor = value.length;
  }
  var key = event.key;
  if (key === "Backspace") {
    if (cursor <= 0) {
      return false;
    }
    setInputValue(node, value.slice(0, cursor - 1) + value.slice(cursor, value.length));
    node.attributes.cursor = cursor - 1;
    return true;
  }
  if (key === "Delete") {
    if (cursor >= value.length) {
      return false;
    }
    setInputValue(node, value.slice(0, cursor) + value.slice(cursor + 1, value.length));
    node.attributes.cursor = cursor;
    return true;
  }
  if (key === "ArrowLeft") {
    if (cursor > 0) {
      node.attributes.cursor = cursor - 1;
      return "cursor";
    }
    return false;
  }
  if (key === "ArrowRight") {
    if (cursor < value.length) {
      node.attributes.cursor = cursor + 1;
      return "cursor";
    }
    return false;
  }
  if (key === "Home") {
    node.attributes.cursor = 0;
    return "cursor";
  }
  if (key === "End") {
    node.attributes.cursor = value.length;
    return "cursor";
  }
  if (key === "Enter") {
    return "change";
  }
  if (key !== null && key.length === 1) {
    setInputValue(node, value.slice(0, cursor) + key + value.slice(cursor, value.length));
    node.attributes.cursor = cursor + 1;
    return true;
  }
  return false;
}

export function htmlInputAction(type, node) {
  return {
    type: type,
    targetId: nodeId(node),
    value: inputValue(node)
  };
}
