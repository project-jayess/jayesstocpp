class Point {
  x = 1;
  y = 2;

  sum() {
    return this.x + this.y;
  }
}

export function run() {
  var point = new Point();
  return point.sum();
}
