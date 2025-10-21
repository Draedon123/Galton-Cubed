import { Vector3 } from "../../utils/Vector3";
import { Mesh, type Vertex } from "./Mesh";

class Sphere extends Mesh {
  constructor(resolution: number, radius: number) {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const directions = [
      new Vector3(1, 0, 0),
      new Vector3(-1, 0, 0),
      new Vector3(0, 1, 0),
      new Vector3(0, -1, 0),
      new Vector3(0, 0, 1),
      new Vector3(0, 0, -1),
    ];

    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];

      const face = Sphere.createCubeFace(
        direction,
        i * resolution * resolution,
        resolution,
        radius
      );

      vertices.push(...face.vertices);
      indices.push(...face.indices);
    }

    super(vertices, indices);
  }

  private static createCubeFace(
    direction: Vector3,
    indexOffset: number,
    resolution: number,
    radius: number
  ): { vertices: Vertex[]; indices: number[] } {
    const vertices: Vertex[] = [];
    const indices: number[] = [];

    const u = new Vector3(direction.y, direction.z, direction.x).scale(
      2 * radius
    );
    const v = Vector3.cross(direction, u);
    const corner = Vector3.subtract(
      Vector3.scale(direction, 0.5 * radius),
      Vector3.add(u, v).scale(0.5)
    );

    const du = Vector3.scale(u, 1 / resolution);
    const dv = Vector3.scale(v, 1 / resolution);

    for (let x = 0; x < resolution; x++) {
      for (let y = 0; y < resolution; y++) {
        const normal = Vector3.add(corner, Vector3.scale(du, x))
          .add(Vector3.scale(dv, y))
          .normalise();

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

        normal.normalise();

        const position = Vector3.scale(normal, radius);
        vertices.push({
          position,
          normal,
        });

        if (x !== resolution - 1 && y !== resolution - 1) {
          const currentIndex = indexOffset + x + y * resolution;

          indices.push(
            currentIndex,
            currentIndex + 1,
            currentIndex + resolution + 1,
            currentIndex,
            currentIndex + resolution + 1,
            currentIndex + resolution
          );
        }
      }
    }

    return { vertices, indices };
  }
}

export { Sphere };
