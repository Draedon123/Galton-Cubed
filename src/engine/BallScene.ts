import { BufferWriter } from "../utils/BufferWriter";
import { Vector3 } from "../utils/Vector3";
import type { Model } from "./meshes/Model";
import { Sphere } from "./meshes/Sphere";

class BallScene {
  public readonly mesh: Sphere;

  public sceneBuffer!: GPUBuffer;
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

  public update(lastObjects: number = this.objects.length): void {
    if (!this.initialised) {
      return;
    }

    this.device.queue.writeBuffer(
      this.sceneBuffer,
      0,
      new Uint32Array([this.objects.length, 0, 0, 0])
    );

    const bufferWriter = new BufferWriter(lastObjects * this.ballByteLength);

    for (
      let i = this.objects.length - lastObjects;
      i < this.objects.length;
      i++
    ) {
      const object = this.objects[i];
      const modelMatrix = object.calculateModelMatrix();

      bufferWriter.writeMat4x4f(modelMatrix);
      bufferWriter.writeVec3f(Vector3.scale(object.colour, 1 / 255));
      bufferWriter.pad(4);
    }

    this.device.queue.writeBuffer(
      this.sceneBuffer,
      16 + (this.objects.length - lastObjects) * this.ballByteLength,
      bufferWriter.buffer,
      0,
      lastObjects * this.ballByteLength
    );
  }

  public get byteLength(): number {
    return 16 + this.maxObjects * this.ballByteLength;
  }

  public get ballByteLength(): number {
    return (16 + 4) * 4;
  }
}

export { BallScene };
