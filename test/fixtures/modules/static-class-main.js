class Point {
  static origin = 0;

  static make() {
    return new Point();
  }

  x = Point.origin;
}

export function run() {
  var point = Point.make();
  return point.x;
}
