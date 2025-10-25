import { SingleObjectScene } from "./SingleObjectScene";

class Scene {
  public readonly maxObjectsPerScene: number;
  public readonly maxScenes: number;
  /** do not reorder */
  public readonly scenes: SingleObjectScene[];

  public sceneBuffer!: GPUBuffer;

  private initialised: boolean;
  // private device!: GPUDevice;
  constructor(maxObjectsPerScene: number, maxScenes: number) {
    this.maxObjectsPerScene = maxObjectsPerScene;
    this.maxScenes = maxScenes;
    this.scenes = [];

    const originalPush = this.scenes.push.bind(this.scenes);
    this.scenes.push = (...items) => {
      for (const item of items) {
        if (this.scenes.length >= this.maxScenes) {
          console.warn(
            "Maximum number of scenes reached. New scenes not added"
          );
          break;
        }

        originalPush(item);
      }

      return this.scenes.length;
    };
    this.initialised = false;
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    // this.device = device;

    this.sceneBuffer = device.createBuffer({
      label: "Scene Buffer",
      size:
        this.maxScenes *
        this.maxObjectsPerScene *
        SingleObjectScene.objectByteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    for (const scene of this.scenes) {
      scene.initialise(this, device);
      scene.update();
    }

    this.initialised = true;
  }
}

export { Scene };
