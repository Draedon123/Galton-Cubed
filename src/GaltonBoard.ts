import { BallScene } from "./engine/BallScene";
import { BallPhysicsShader } from "./engine/BallPhysicsShader";
import { Model } from "./engine/meshes/Model";
import { hsvToRgb } from "./utils/hsvToRgb";
import { Vector3 } from "./utils/Vector3";

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
  public readonly scene: BallScene;
  public readonly ballCount: number;
  public readonly pegCount: number;
  public readonly ballRadius: number;
  public readonly pegRadius: number;

  private initialised: boolean;
  private ballPhysicsShader!: BallPhysicsShader;
  constructor(options: Partial<GaltonBoardOptions> = {}) {
    this.initialised = false;
    this.ballCount = options.ballCount ?? 100;
    this.pegRadius = options.pegRadius ?? 4;
    this.ballRadius = options.ballRadius ?? 1;

    const start = options.start ?? new Vector3(0, 0, 0);
    const pegs = this.createPegs(
      options.layers ?? 5,
      options.height ?? 50,
      options.sideLength ?? 100,
      start
    );

    const balls = this.createBalls(
      this.ballCount,
      Vector3.add(start, new Vector3(0, 10, 0))
    );

    this.pegCount = pegs.length;

    this.scene = new BallScene(this.pegCount + this.ballCount);

    for (const peg of pegs) {
      this.scene.objects.push(peg);
    }

    for (const ball of balls) {
      this.scene.objects.push(ball);
    }
  }

  private createPegs(
    layers: number,
    height: number,
    sideLength: number,
    start: Vector3
  ): Model[] {
    const pegs: Model[] = [];

    const dy = layers === 1 ? height : height / (layers - 1);
    const ds = sideLength / layers;

    for (let y = 0; y < layers; y++) {
      const positionY = start.y - y * dy;
      const offsets = (layers - y) / 2;
      const corner = Vector3.add(
        start,
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

  private createBalls(ballCount: number, start: Vector3): Model[] {
    const SPACING = this.ballRadius * 4;
    const balls: Model[] = [];

    for (let i = 1; i <= ballCount; i++) {
      const xOffset = 0.2 * this.ballRadius * (Math.random() - 0.5);
      const zOffset = 0.2 * this.ballRadius * (Math.random() - 0.5);

      balls.push(
        new Model({
          position: Vector3.add(
            start,
            new Vector3(xOffset, SPACING * i, zOffset)
          ),
          scale: new Vector3(this.ballRadius, this.ballRadius, this.ballRadius),
        })
      );
    }

    return balls;
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

    this.ballPhysicsShader = await BallPhysicsShader.create(device, this);

    this.initialised = true;
  }
}

export { GaltonBoard };
export type { GaltonBoardOptions };
