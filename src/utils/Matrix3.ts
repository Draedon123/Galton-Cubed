import type { Matrix4 } from "./Matrix4";

class Matrix3 {
  public readonly components: Float32Array;
  constructor() {
    this.components = new Float32Array(9);

    this.components[0] = 1;
    this.components[4] = 1;
    this.components[8] = 1;
  }

  public static fromMatrix4(matrix4: Matrix4): Matrix3 {
    const matrix3 = new Matrix3();

    matrix3.components[0] = matrix4.components[0];
    matrix3.components[1] = matrix4.components[1];
    matrix3.components[2] = matrix4.components[2];
    matrix3.components[3] = matrix4.components[4];
    matrix3.components[4] = matrix4.components[5];
    matrix3.components[5] = matrix4.components[6];
    matrix3.components[6] = matrix4.components[8];
    matrix3.components[7] = matrix4.components[9];
    matrix3.components[8] = matrix4.components[10];

    return matrix3;
  }

  public transpose(): this {
    const a01 = this.components[1];
    const a02 = this.components[2];
    const a12 = this.components[5];

    this.components[1] = this.components[3];
    this.components[2] = this.components[6];
    this.components[3] = a01;
    this.components[5] = this.components[7];
    this.components[6] = a02;
    this.components[7] = a12;

    return this;
  }
}

export { Matrix3 };
