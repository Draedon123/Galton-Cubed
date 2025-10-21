import { degrees, radians } from "./angles";
import { clamp } from "./clamp";
import { Matrix4 } from "./Matrix4";

class Quaternion {
  public readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.components = new Float32Array([x, y, z, w]);
  }

  /** degrees */
  public getEulerAngles(): [number, number, number] {
    this.normalise();

    const matrix = this.toRotationMatrix();
    let x: number;
    let z: number;

    const y = Math.asin(-clamp(matrix.components[2], -1, 1));
    if (Math.abs(matrix.components[2]) < 0.9999999) {
      x = Math.atan2(matrix.components[6], matrix.components[10]);
      z = Math.atan2(matrix.components[1], matrix.components[0]);
    } else {
      x = 0;
      z = Math.atan2(-matrix.components[4], matrix.components[5]);
    }

    return [degrees(x), degrees(y), degrees(z)];
  }

  /** pitch, degrees */
  public get eulerX(): number {
    return this.getEulerAngles()[0];
  }

  /** yaw, degrees */
  public get eulerY(): number {
    return this.getEulerAngles()[1];
  }

  /** roll, degrees */
  public get eulerZ(): number {
    return this.getEulerAngles()[2];
  }

  public set eulerX(degrees: number) {
    const euler = this.getEulerAngles();
    this.copyFrom(Quaternion.fromEulerAngles(degrees, euler[1], euler[2]));
  }

  public set eulerY(degrees: number) {
    const euler = this.getEulerAngles();
    this.copyFrom(Quaternion.fromEulerAngles(euler[0], degrees, euler[2]));
  }

  public set eulerZ(degrees: number) {
    const euler = this.getEulerAngles();
    this.copyFrom(
      Quaternion.fromEulerAngles(euler[0], euler[1], radians(degrees))
    );
  }

  /** 3x3 matrix */
  public toRotationMatrix(): Matrix4 {
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const w = this.w;

    const matrix = new Matrix4();

    matrix.components[0] = 1 - 2 * (y * y + z + z);
    matrix.components[1] = 2 * (x * y + z * w);
    matrix.components[2] = 2 * (x * z - y * w);
    matrix.components[4] = 2 * (x * y - z * w);
    matrix.components[5] = 1 - 2 * (x * x + z * z);
    matrix.components[6] = 2 * (w * x + y * z);
    matrix.components[8] = 2 * (y * w + x * z);
    matrix.components[9] = 2 * (y * z - x * w);
    matrix.components[10] = 1 - 2 * (x * x + y * y);

    return matrix;
  }

  public copyFrom(quaternion: Quaternion): this {
    this.components[0] = quaternion.components[0];
    this.components[1] = quaternion.components[1];
    this.components[2] = quaternion.components[2];
    this.components[3] = quaternion.components[3];

    return this;
  }

  /** degrees */
  public static fromEulerAngles(x: number, y: number, z: number): Quaternion {
    x = radians(x);
    y = radians(y);
    z = radians(z);

    const sinX = Math.sin(x / 2);
    const cosX = Math.cos(x / 2);
    const sinY = Math.sin(y / 2);
    const cosY = Math.cos(y / 2);
    const sinZ = Math.sin(z / 2);
    const cosZ = Math.cos(z / 2);

    return new Quaternion(
      sinX * cosY * cosZ - cosX * sinY * sinZ,
      cosX * sinY * cosZ + sinX * cosY * sinZ,
      cosX * cosY * sinZ - sinX * sinY * cosZ,
      cosX * cosY * cosZ + sinX * sinY * sinZ
    );
  }

  public normalise(): this {
    const magnitude = this.magnitude;

    if (magnitude < 1e-8) {
      console.error("Magnitude of vector too close to 0 to normalise");
      return this;
    }

    const inverseMagnitude = 1 / magnitude;

    this.components[0] *= inverseMagnitude;
    this.components[1] *= inverseMagnitude;
    this.components[2] *= inverseMagnitude;
    this.components[3] *= inverseMagnitude;

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(
      this.components[0],
      this.components[1],
      this.components[2],
      this.components[3]
    );
  }

  public get x(): number {
    return this.components[0];
  }

  public get y(): number {
    return this.components[1];
  }

  public get z(): number {
    return this.components[2];
  }

  public get w(): number {
    return this.components[3];
  }

  public set x(value: number) {
    this.components[0] = value;
  }

  public set y(value: number) {
    this.components[1] = value;
  }

  public set z(value: number) {
    this.components[2] = value;
  }

  public set w(value: number) {
    this.components[3] = value;
  }
}

export { Quaternion };
