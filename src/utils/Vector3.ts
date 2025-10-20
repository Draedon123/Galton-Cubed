class Vector3 {
  public readonly components: Float32Array;
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.components = new Float32Array(3);

    this.components[0] = x;
    this.components[1] = y;
    this.components[2] = z;
  }

  public static add(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.components[0] + b.components[0],
      a.components[1] + b.components[1],
      a.components[2] + b.components[2]
    );
  }

  public static subtract(a: Vector3, b: Vector3): Vector3 {
    return new Vector3(
      a.components[0] - b.components[0],
      a.components[1] - b.components[1],
      a.components[2] - b.components[2]
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

    return this;
  }

  public get magnitude(): number {
    return Math.hypot(
      this.components[0],
      this.components[1],
      this.components[2]
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

  public set x(value: number) {
    this.components[0] = value;
  }

  public set y(value: number) {
    this.components[1] = value;
  }

  public set z(value: number) {
    this.components[2] = value;
  }
}

export { Vector3 };
