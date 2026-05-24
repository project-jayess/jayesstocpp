class Root {
  static prefix = "Jay";

  static label() {
    return Root.prefix;
  }
}

class Middle extends Root {
  static suffix = "ess";

  static label() {
    return super.label() + Middle.suffix;
  }
}

class Leaf extends Middle {
  static punctuation = "!";
  static inherited = super["label"]();

  static read() {
    return Leaf.inherited + Leaf.punctuation;
  }
}

export function run() {
  return Leaf.read();
}
