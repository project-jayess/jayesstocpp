export function sign(value) {
  if (value < 0) {
    return -1;
  }
  if (value > 0) {
    return 1;
  }
  return 0;
}

export function clamp(value, low, high) {
  if (value < low) {
    return low;
  }
  if (value > high) {
    return high;
  }
  return value;
}

export function minValue(left, right) {
  if (left < right) {
    return left;
  }
  return right;
}

export function maxValue(left, right) {
  if (left > right) {
    return left;
  }
  return right;
}
