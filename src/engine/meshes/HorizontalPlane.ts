import { Vector3 } from "../../utils/Vector3";
import { Mesh, type Vertex } from "./Mesh";

class HorizontalPlane extends Mesh {
  constructor(
    p1: Vector3,
    p2: Vector3,
    subdivisionsX: number,
    subdivisionsZ: number
  ) {
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;

    const vertices: Vertex[] = [];
    const indices: number[] = [];

    for (let x = 0; x <= subdivisionsX; x++) {
      const xPosition = p1.x + x * dx;

      for (let z = 0; z <= subdivisionsZ; z++) {
        const zPosition = p1.z + z * dz;

        const position = new Vector3(xPosition, p1.y, zPosition);
        const normal = new Vector3(0, 1, 0);

        vertices.push({
          position,
          normal,
        });

        if (x === subdivisionsX || z === subdivisionsZ) {
          continue;
        }

        const startingIndex = x * subdivisionsZ + z;
        indices.push(
          startingIndex,
          startingIndex + subdivisionsZ,
          startingIndex + subdivisionsZ + 1,
          startingIndex,
          startingIndex + subdivisionsZ + 1,
          startingIndex + 1
        );
      }
    }

    super(vertices, indices);
  }
}

export { HorizontalPlane };
