import { SingleObjectScene } from "./engine/SingleObjectScene";
import { BallPhysicsShader } from "./engine/BallPhysicsShader";
import { Model } from "./engine/meshes/Model";
import { hsvToRgb } from "./utils/hsvToRgb";
import { Vector3 } from "./utils/Vector3";
import { Sphere } from "./engine/meshes/Sphere";
import type { Renderer } from "./engine/Renderer";
import { Cube } from "./engine/meshes/Cube";

type GaltonBoardOptions = {
  layers: number;
  height: number;
  sideLength: number;
  pegRadius: number;
  ballCount: number;
  ballRadius: number;
  start: Vector3;
};

class GaltonBoard {
  public readonly spheres: SingleObjectScene;
  public readonly floor: SingleObjectScene;
  public readonly maxBallCount: number;
  public readonly pegCount: number;
  public readonly ballRadius: number;
  public readonly pegRadius: number;

  private readonly start: Vector3;

  private initialised: boolean;
  private ballPhysicsShader!: BallPhysicsShader;
  constructor(options: Partial<GaltonBoardOptions> = {}) {
    this.initialised = false;
    this.maxBallCount = options.ballCount ?? 100;
    this.pegRadius = options.pegRadius ?? 4;
    this.ballRadius = options.ballRadius ?? 1;

    this.start = options.start ?? new Vector3(0, 0, 0);
    const pegs = this.createPegs(
      options.layers ?? 5,
      options.height ?? 50,
      options.sideLength ?? 100
    );

    this.pegCount = pegs.length;

    this.spheres = new SingleObjectScene(new Sphere(15, 1));
    this.floor = new SingleObjectScene(new Cube(1, 1));

    for (const peg of pegs) {
      this.spheres.addObject(peg);
    }
  }

  public get ballCount(): number {
    return this.spheres.objectCount - this.pegCount;
  }

  private createPegs(
    layers: number,
    height: number,
    sideLength: number
  ): Model[] {
    const pegs: Model[] = [];

    const dy = layers === 1 ? height : height / (layers - 1);
    const ds = sideLength / layers;

    for (let y = 0; y < layers; y++) {
      const positionY = this.start.y - y * dy;
      const offsets = (layers - y) / 2;
      const corner = Vector3.add(
        this.start,
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
              scale: new Vector3(
                this.pegRadius,
                this.pegRadius,
                this.pegRadius
              ),
              colour,
            })
          );
        }
      }
    }

    return pegs;
  }

  public *createBalls(): Generator<void> {
    const verticalOffset = this.pegRadius * 5;

    for (let i = 0; i < this.maxBallCount; i++) {
      const xOffset = 1 * this.ballRadius * (Math.random() - 0.5);
      const zOffset = 1 * this.ballRadius * (Math.random() - 0.5);

      this.spheres.addObject(
        new Model({
          position: Vector3.add(
            this.start,
            new Vector3(xOffset, verticalOffset, zOffset)
          ),
          scale: new Vector3(this.ballRadius, this.ballRadius, this.ballRadius),
        })
      );

      this.spheres.update(1);
      yield;
    }
  }

  public tick(deltaTimeMs: number): void {
    if (!this.initialised) {
      return;
    }

    this.ballPhysicsShader.run(deltaTimeMs);
  }

  public async initialise(renderer: Renderer): Promise<void> {
    if (this.initialised) {
      return;
    }

    renderer.scenes.scenes.push(this.spheres, this.floor);
    this.spheres.initialise(renderer.scenes, renderer.device);
    this.floor.initialise(renderer.scenes, renderer.device);
    this.ballPhysicsShader = await BallPhysicsShader.create(
      renderer.device,
      this
    );

    this.initialised = true;
  }
}

export { GaltonBoard };
export type { GaltonBoardOptions };
