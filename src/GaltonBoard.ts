import type { BallScene } from "./engine/BallScene";
import { Model } from "./engine/meshes/Model";
import { hsvToRgb } from "./utils/hsvToRgb";
import { Vector3 } from "./utils/Vector3";

type GaltonBoardOptions = {
  layers: number;
  height: number;
  sideLength: number;
  pegRadius: number;
};

class GaltonBoard {
  constructor(scene: BallScene, options: Partial<GaltonBoardOptions> = {}) {
    const pegs = this.createPegs(
      options.layers ?? 5,
      options.height ?? 50,
      options.sideLength ?? 100,
      options.pegRadius ?? 4
    );

    scene.objects.push(...pegs);
    scene.update();
  }

  private createPegs(
    layers: number,
    height: number,
    sideLength: number,
    pegRadius: number
  ): Model[] {
    const pegs: Model[] = [];

    const centre = new Vector3(0, 0, 0);
    const dy = layers === 1 ? height : height / (layers - 1);
    const ds = sideLength / layers;

    for (let y = 0; y < layers; y++) {
      const positionY = centre.y - y * dy;
      const offsets = (layers - y) / 2;
      const corner = Vector3.add(
        centre,
        new Vector3(-sideLength / 2, positionY, -sideLength / 2)
      ).add(new Vector3(offsets * ds, 0, offsets * ds));

      const colour = hsvToRgb(360 * (y / layers), 1, 1);

      for (let x = 0; x < y + 1; x++) {
        const dx = x * ds;
        for (let z = 0; z < y + 1; z++) {
          const dz = z * ds;
          const position = Vector3.add(corner, new Vector3(dx, 0, dz));

          pegs.push(
            new Model({
              position,
              scale: new Vector3(pegRadius, pegRadius, pegRadius),
              colour,
            })
          );
        }
      }
    }

    return pegs;
  }
}

export { GaltonBoard };
export type { GaltonBoardOptions };
