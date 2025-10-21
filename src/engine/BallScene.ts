import { BufferWriter } from "../utils/BufferWriter";
import { Vector3 } from "../utils/Vector3";
import type { Model } from "./meshes/Model";
import { Sphere } from "./meshes/Sphere";

class BallScene {
  public sceneBuffer!: GPUBuffer;
  public readonly mesh: Sphere;
  public objects: Model[];
  private initialised: boolean;
  private device!: GPUDevice;
  private readonly maxObjects: number;
  constructor(maxObjects: number) {
    this.initialised = false;
    this.maxObjects = maxObjects;
    this.objects = [];
    this.mesh = new Sphere(30, 1);
  }

  public initialise(device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    this.device = device;
    this.mesh.initialise(device);

    this.sceneBuffer = device.createBuffer({
      label: "Ball Scene Buffer",
      size: this.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    this.initialised = true;
  }

  public update(): void {
    if (!this.initialised) {
      return;
    }

    const bufferWriter = new BufferWriter(this.byteLength);

    bufferWriter.writeFloat32(this.objects.length);
    bufferWriter.pad(12);

    for (const object of this.objects) {
      const modelMatrix = object.calculateModelMatrix();

      bufferWriter.writeMat4x4f(modelMatrix);
      bufferWriter.writeVec3f(Vector3.scale(object.colour, 1 / 255));
      bufferWriter.pad(4);
    }

    this.device.queue.writeBuffer(this.sceneBuffer, 0, bufferWriter.buffer);
  }

  public get byteLength(): number {
    return 16 + this.maxObjects * (16 + 4) * 4;
  }
}

export { BallScene };
