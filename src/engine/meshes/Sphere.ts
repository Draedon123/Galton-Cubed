import { Vector3 } from "../../utils/Vector3";
import { Cube } from "./Cube";

class Sphere extends Cube {
  constructor(resolution: number, radius: number) {
    super(resolution, radius * 2);

    this.rawVertices.forEach((vertex) => {
      vertex.position.normalise().scale(0.5 * radius * 2);

      const normal = Vector3.normalise(vertex.position);

      // uniformly distribute points
      normal.x *= Math.sqrt(
        1 -
          0.5 * normal.y * normal.y -
          0.5 * normal.z * normal.z +
          (normal.y * normal.y * normal.z * normal.z) / 3
      );
      normal.y *= Math.sqrt(
        1 -
          0.5 * normal.x * normal.x -
          0.5 * normal.z * normal.z +
          (normal.x * normal.x * normal.z * normal.z) / 3
      );
      normal.z *= Math.sqrt(
        1 -
          0.5 * normal.y * normal.y -
          0.5 * normal.x * normal.x +
          (normal.y * normal.y * normal.x * normal.x) / 3
      );

      vertex.normal = normal.normalise();
    });
  }
}

export { Sphere };
