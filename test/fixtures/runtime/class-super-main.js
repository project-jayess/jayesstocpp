class Base {
  constructor(value) {
    this.value = value;
  }

  label() {
    return this.value;
  }
}

class Child extends Base {
  constructor(value) {
    super(value);
    this.suffix = "!";
  }

  read() {
    return super.label() + this.suffix;
  }
}

export function run() {
  var child = new Child("Jayess");
  return child.read();
}
