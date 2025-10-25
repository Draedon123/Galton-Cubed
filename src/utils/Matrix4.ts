import type { Vector3 } from "./Vector3";

class Matrix4 {
  public readonly components: Float32Array;
  constructor() {
    // prettier-ignore
    this.components = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  public static multiplyMatrices(
    a: Matrix4,
    b: Matrix4,
    out: Matrix4 = new Matrix4()
  ): Matrix4 {
    const a00 = a.components[0];
    const a01 = a.components[1];
    const a02 = a.components[2];
    const a03 = a.components[3];
    const a10 = a.components[4];
    const a11 = a.components[5];
    const a12 = a.components[6];
    const a13 = a.components[7];
    const a20 = a.components[8];
    const a21 = a.components[9];
    const a22 = a.components[10];
    const a23 = a.components[11];
    const a30 = a.components[12];
    const a31 = a.components[13];
    const a32 = a.components[14];
    const a33 = a.components[15];

    let b0 = b.components[0];
    let b1 = b.components[1];
    let b2 = b.components[2];
    let b3 = b.components[3];

    out.components[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b.components[4];
    b1 = b.components[5];
    b2 = b.components[6];
    b3 = b.components[7];

    out.components[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b.components[8];
    b1 = b.components[9];
    b2 = b.components[10];
    b3 = b.components[11];

    out.components[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b.components[12];
    b1 = b.components[13];
    b2 = b.components[14];
    b3 = b.components[15];

    out.components[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out.components[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out.components[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out.components[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    return out;
  }

  public static perspective(
    fieldOfViewRadians: number,
    aspectRatio: number,
    near: number,
    far: number
  ): Matrix4 {
    const matrix = new Matrix4();
    const f = 1.0 / Math.tan(fieldOfViewRadians / 2);
    matrix.components[0] = f / aspectRatio;
    matrix.components[5] = f;
    matrix.components[11] = -1;
    matrix.components[15] = 0;

    if (far !== Infinity) {
      const nearFar = 1 / (near - far);

      matrix.components[10] = far * nearFar;
      matrix.components[14] = far * near * nearFar;
    } else {
      matrix.components[10] = -1;
      matrix.components[14] = -near;
    }

    return matrix;
  }

  public static lookAt(
    position: Vector3,
    lookAt: Vector3,
    up: Vector3
  ): Matrix4 {
    const out = new Matrix4();
    const EPSILON = 1e-6;

    let x0, x1, x2, y0, y1, y2, z0, z1, z2, length;

    const positionX = position.x;
    const positionY = position.y;
    const positionZ = position.z;
    const upX = up.x;
    const upY = up.y;
    const upZ = up.z;
    const lookAtX = lookAt.x;
    const lookAtY = lookAt.y;
    const lookAtZ = lookAt.z;

    if (
      Math.abs(positionX - lookAtX) < EPSILON &&
      Math.abs(positionY - lookAtY) < EPSILON &&
      Math.abs(positionZ - lookAtZ) < EPSILON
    ) {
      console.warn("Look At too close to Position");
      return new Matrix4();
    }

    z0 = positionX - lookAtX;
    z1 = positionY - lookAtY;
    z2 = positionZ - lookAtZ;

    length = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= length;
    z1 *= length;
    z2 *= length;

    x0 = upY * z2 - upZ * z1;
    x1 = upZ * z0 - upX * z2;
    x2 = upX * z1 - upY * z0;
    length = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!length) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      length = 1 / length;
      x0 *= length;
      x1 *= length;
      x2 *= length;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    length = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!length) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      length = 1 / length;
      y0 *= length;
      y1 *= length;
      y2 *= length;
    }

    out.components[0] = x0;
    out.components[1] = y0;
    out.components[2] = z0;
    out.components[3] = 0;
    out.components[4] = x1;
    out.components[5] = y1;
    out.components[6] = z1;
    out.components[7] = 0;
    out.components[8] = x2;
    out.components[9] = y2;
    out.components[10] = z2;
    out.components[11] = 0;
    out.components[12] = -(x0 * positionX + x1 * positionY + x2 * positionZ);
    out.components[13] = -(y0 * positionX + y1 * positionY + y2 * positionZ);
    out.components[14] = -(z0 * positionX + z1 * positionY + z2 * positionZ);
    out.components[15] = 1;

    return out;
  }

  public copyFrom(matrix: Matrix4): this {
    this.components.set(matrix.components);

    return this;
  }
}

export { Matrix4 };
