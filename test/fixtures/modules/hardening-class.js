export class Counter {
  #step() {
    return 1;
  }

  next(value) {
    return value + this.#step();
  }
}
