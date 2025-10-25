import { Matrix4 } from "../../utils/Matrix4";
// import { Quaternion } from "../../utils/Quaternion";
import { Vector3 } from "../../utils/Vector3";

type ModelOptions = {
  position: Vector3;
  // rotation: Quaternion;
  scale: Vector3;
  /** 0-1 */
  colour: Vector3;
};

class Model {
  public position: Vector3;
  // public rotation: Quaternion;
  public scale: Vector3;
  public colour: Vector3;

  constructor(transforms: Partial<ModelOptions> = {}) {
    this.position = transforms.position ?? new Vector3();
    // this.rotation = transforms.rotation ?? new Quaternion();
    this.scale = transforms.scale ?? new Vector3(1, 1, 1);
    this.colour = transforms.colour ?? new Vector3(1, 1, 1);
  }

  public calculateModelMatrix(): Matrix4 {
    // const modelMatrix = this.rotation.toRotationMatrix();
    // none of the models being used in the project actually have a rotation, so this saves a bunch of memory
    // const modelMatrix = new Quaternion(0, 0, 0, 1).toRotationMatrix();
    const modelMatrix = new Matrix4();

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
