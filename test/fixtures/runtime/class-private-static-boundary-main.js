class Base {
  static #value = "base";

  static readBase() {
    return Base.#value;
  }
}

class Child extends Base {
  static #value = "child";

  static readChild() {
    return Child.#value;
  }

  static readBoth() {
    return Base.readBase() + ":" + Child.#value;
  }
}

export function run() {
  return [Base.readBase(), Child.readChild(), Child.readBoth()];
}
