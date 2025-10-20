import type { Matrix4 } from "../../utils/Matrix4";
import { Quaternion } from "../../utils/Quaternion";
import { Vector3 } from "../../utils/Vector3";
import type { Mesh } from "./Mesh";

type Transform = {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
};

class Model {
  public mesh: Mesh;
  public position: Vector3;
  public rotation: Quaternion;
  public scale: Vector3;

  constructor(mesh: Mesh, transforms: Partial<Transform> = {}) {
    this.mesh = mesh;

    this.position = transforms.position ?? new Vector3();
    this.rotation = transforms.rotation ?? new Quaternion();
    this.scale = transforms.scale ?? new Vector3(1, 1, 1);
  }

  public calculateModelMatrix(): Matrix4 {
    const modelMatrix = this.rotation.toRotationMatrix();

    modelMatrix.components[0] *= this.scale.x;
    modelMatrix.components[1] *= this.scale.x;
    modelMatrix.components[2] *= this.scale.x;
    modelMatrix.components[4] *= this.scale.y;
    modelMatrix.components[5] *= this.scale.y;
    modelMatrix.components[6] *= this.scale.y;
    modelMatrix.components[8] *= this.scale.z;
    modelMatrix.components[9] *= this.scale.z;
    modelMatrix.components[10] *= this.scale.z;

    modelMatrix.components[12] = this.position.x;
    modelMatrix.components[13] = this.position.y;
    modelMatrix.components[14] = this.position.z;

    return modelMatrix;
  }
}

export { Model };
