import { Vector3 } from "./Vector3";

/**
 * @param { number } h 0-360
 * @param { number } s 0-1
 * @param { number } v 0-1
 * @returns { Vector3 } rgb, 0-255
 */
function hsvToRgb(h: number, s: number, v: number): Vector3 {
  const chroma = 255 * s * v;
  const face = h / 60;
  const X = chroma * (1 - Math.abs((face % 2) - 1));

  if (face < 1) {
    return new Vector3(chroma, X, 0);
  }

  if (face < 2) {
    return new Vector3(X, chroma, 0);
  }

  if (face < 3) {
    return new Vector3(0, chroma, X);
  }

  if (face < 4) {
    return new Vector3(0, X, chroma);
  }

  if (face < 5) {
    return new Vector3(X, 0, chroma);
  }

  return new Vector3(chroma, 0, X);
}

export { hsvToRgb };
