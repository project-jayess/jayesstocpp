import { round } from "jayess:math";

export function requireShapeSize(width, height) {
  if (width < 0 || height < 0) {
    throw "jayess:canvas shape width and height must be non-negative";
  }
  return { width: width, height: height };
}

export function boxCenterX(x, width) {
  return x + round((width - 1) / 2);
}

export function boxCenterY(y, height) {
  return y + round((height - 1) / 2);
}

export function boxRadiusX(width) {
  return round((width - 1) / 2);
}

export function boxRadiusY(height) {
  return round((height - 1) / 2);
}

export function capsuleRadius(width, height) {
  if (width >= height) {
    return round((height - 1) / 2);
  }
  return round((width - 1) / 2);
}
