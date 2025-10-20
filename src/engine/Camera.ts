import { degrees, radians } from "../utils/angles";
import { Matrix4 } from "../utils/Matrix4";
import { Vector3 } from "../utils/Vector3";

type CameraOptions = {
  position: Vector3;
  lookAt: Vector3;
  fovDegrees: number;
  aspectRatio: number;
  near: number;
  far: number;
};

class Camera {
  public position: Vector3;
  public lookAt: Vector3;
  public aspectRatio: number;
  public near: number;
  public far: number;

  private fovRadians: number;

  constructor(options: Partial<CameraOptions> = {}) {
    this.position = options.position ?? new Vector3();
    this.lookAt = options.lookAt ?? new Vector3(0, 0, -1);
    this.aspectRatio = options.aspectRatio ?? 16 / 9;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 1000;
    this.fovRadians = radians(options.fovDegrees ?? 60);
  }

  public get fovDegrees(): number {
    return degrees(this.fovRadians);
  }

  public set fovDegrees(degrees: number) {
    this.fovRadians = radians(degrees);
  }

  public getPerspectiveMatrix(): Matrix4 {
    return Matrix4.perspective(
      this.fovRadians,
      this.aspectRatio,
      this.near,
      this.far
    );
  }

  public getViewMatrix(): Matrix4 {
    const forward = Vector3.subtract(this.lookAt, this.position).normalise();
    const up = new Vector3(0, 1, 0);

    return Matrix4.lookAt(
      this.position,
      Vector3.add(this.position, forward),
      up
    );
  }

  public getPerspectiveViewMatrix(): Matrix4 {
    return Matrix4.multiplyMatrices(
      this.getPerspectiveMatrix(),
      this.getViewMatrix()
    );
  }
}

export { Camera };
export type { CameraOptions };
