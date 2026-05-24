class Base {
  static prefix = "Jay";
  static suffix = "ess";

  static label() {
    return Base.prefix + Base.suffix;
  }
}

class Child extends Base {
  static punctuation = "!";
  static inherited = super.label();

  static read() {
    return Child.inherited + Child.punctuation;
  }
}

export function run() {
  return Child.read();
}
