import { SingleObjectScene } from "./engine/SingleObjectScene";
import { BallPhysicsShader } from "./engine/BallPhysicsShader";
import { Model } from "./engine/meshes/Model";
import { hsvToRgb } from "./utils/hsvToRgb";
import { Vector3 } from "./utils/Vector3";
import { Sphere } from "./engine/meshes/Sphere";
import { Cube } from "./engine/meshes/Cube";
import { Scene } from "./engine/Scene";

type GaltonBoardOptions = {
  layers: number;
  height: number;
  sideLength: number;
  pegRadius: number;
  ballCount: number;
  ballRadius: number;
  floorResolution: number;
  floorOffset: number;
  floorThickness: number;
  start: Vector3;
};

class GaltonBoard {
  public readonly scene: Scene;
  public readonly spheres: SingleObjectScene;
  public readonly floor: SingleObjectScene;
  public readonly maxBallCount: number;
  public readonly pegCount: number;
  public readonly ballRadius: number;
  public readonly pegRadius: number;
  public readonly floorResolution: number;
  public readonly floorOffset: number;
  public readonly floorThickness: number;
  public readonly height: number;
  public readonly start: Vector3;

  private readonly sideLength: number;

  private initialised: boolean;
  private ballPhysicsShader!: BallPhysicsShader;
  constructor(options: Partial<GaltonBoardOptions> = {}) {
    this.initialised = false;
    this.maxBallCount = options.ballCount ?? 100;
    this.pegRadius = options.pegRadius ?? 4;
    this.ballRadius = options.ballRadius ?? 1;
    this.floorResolution = options.floorResolution ?? 256;
    this.floorOffset = options.floorOffset ?? this.pegRadius * 5;
    this.floorThickness = options.floorThickness ?? 1;
    this.sideLength = options.sideLength ?? 100;
    this.height = options.height ?? 50;

    this.start = options.start ?? new Vector3(0, 0, 0);
    const pegs = this.createPegs(options.layers ?? 5);

    this.pegCount = pegs.length;

    this.spheres = new SingleObjectScene(new Sphere(10, 1));
    this.floor = new SingleObjectScene(new Cube(1, 1));

    for (const peg of pegs) {
      this.spheres.addObject(peg);
    }

    const floorTiles = this.createFloor();
    for (const tile of floorTiles) {
      this.floor.addObject(tile);
    }

    this.scene = new Scene(2, [
      this.pegCount + this.maxBallCount,
      this.floorResolution * this.floorResolution,
    ]);
  }

  public get ballCount(): number {
    return this.spheres.objectCount - this.pegCount;
  }

  private createPegs(layers: number): Model[] {
    const pegs: Model[] = [];

    const dy = layers === 1 ? this.height : this.height / (layers - 1);
    const ds = this.sideLength / layers;

    for (let y = 0; y < layers; y++) {
      const positionY = this.start.y - y * dy;
      const offsets = (layers - y) / 2;
      const corner = Vector3.add(
        this.start,
        new Vector3(-this.sideLength / 2, positionY, -this.sideLength / 2)
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

  private createFloor(): Model[] {
    const tiles: Model[] = [];
    const sideLength = this.sideLength * 2.2;

    const corner = Vector3.subtract(
      this.start,
      new Vector3(
        sideLength * 0.5,
        this.floorOffset + this.height,
        sideLength * 0.5
      )
    );

    const tileSideLength = sideLength / this.floorResolution;
    const colour = new Vector3(255, 255, 255);
    const scale = new Vector3(
      sideLength / this.floorResolution,
      this.floorThickness,
      sideLength / this.floorResolution
    );

    for (let x = 0; x < this.floorResolution; x++) {
      for (let z = 0; z < this.floorResolution; z++) {
        tiles.push(
          new Model({
            position: Vector3.add(
              corner,
              new Vector3(x * tileSideLength, 0, z * tileSideLength)
            ).add(Vector3.scale(scale, 0.5)),
            colour,
            scale,
          })
        );
      }
    }

    return tiles;
  }

  public *createBalls(): Generator<void> {
    const verticalOffset = this.pegRadius * 5;
    const scale = new Vector3(
      this.ballRadius,
      this.ballRadius,
      this.ballRadius
    );
    const colour = new Vector3(255, 255, 255);

    for (let i = 0; i < this.maxBallCount; i++) {
      const xOffset = 1 * this.ballRadius * (Math.random() - 0.5);
      const zOffset = 1 * this.ballRadius * (Math.random() - 0.5);

      this.spheres.addObject(
        new Model({
          position: Vector3.add(
            this.start,
            new Vector3(xOffset, verticalOffset, zOffset)
          ),
          scale,
          colour,
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

  public async initialise(device: GPUDevice): Promise<void> {
    if (this.initialised) {
      return;
    }

    this.spheres.initialise(this.scene, device);
    this.floor.initialise(this.scene, device);
    this.ballPhysicsShader = await BallPhysicsShader.create(device, this);

    this.initialised = true;
  }
}

export { GaltonBoard };
export type { GaltonBoardOptions };
