class Root {
  static prefix = "Jay";

  static label() {
    return Root.prefix;
  }
}

class Middle extends Root {
  static prefix = super["prefix"] + "ess";

  static label() {
    return Middle.prefix;
  }
}

class Leaf extends Middle {
  static readName(name) {
    return super[name] + "!";
  }

  static callName(name) {
    return super[name]() + "!";
  }
}

export function run() {
  return [Leaf.readName("prefix"), Leaf.callName("label")];
}
