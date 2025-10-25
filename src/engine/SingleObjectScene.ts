import { BufferWriter } from "../utils/BufferWriter";
import { Vector3 } from "../utils/Vector3";
import type { Mesh } from "./meshes/Mesh";
import type { Model } from "./meshes/Model";
import type { Sphere } from "./meshes/Sphere";
import { Scene } from "./Scene";

class SingleObjectScene {
  public readonly mesh: Sphere;

  public scene!: Scene;

  private objects: Model[];
  private initialised: boolean;
  private device!: GPUDevice;

  constructor(mesh: Mesh) {
    this.initialised = false;
    this.objects = [];
    this.mesh = mesh;
  }

  public initialise(scene: Scene, device: GPUDevice): void {
    if (this.initialised) {
      return;
    }

    this.device = device;
    this.scene = scene;
    this.mesh.initialise(device);

    this.initialised = true;

    this.update();
  }

  public update(lastObjects: number = this.objects.length): void {
    if (!this.initialised) {
      return;
    }

    this.device.queue.writeBuffer(
      this.scene.sceneBuffer,
      this.sceneByteOffset,
      new Uint32Array([this.objects.length, 0, 0, 0])
    );

    const bufferWriter = new BufferWriter(
      lastObjects * SingleObjectScene.objectByteLength
    );

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
      this.scene.sceneBuffer,
      16 +
        (this.objects.length - lastObjects) *
          SingleObjectScene.objectByteLength +
        this.sceneByteOffset,
      bufferWriter.buffer
    );
  }

  public addObject(object: Model): void {
    if (this.objects.length >= this.scene?.maxObjectsPerScene) {
      console.warn("Maximum number of objects reached. New objects not added");

      return;
    }

    this.objects.push(object);
  }

  public get objectCount(): number {
    return this.objects.length;
  }

  private get sceneByteOffset(): number {
    const sceneIndex = this.scene.scenes.indexOf(this);

    return sceneIndex * this.byteLength;
  }

  public get byteLength(): number {
    return (
      16 + this.scene.maxObjectsPerScene * SingleObjectScene.objectByteLength
    );
  }

  public static get objectByteLength(): number {
    return (16 + 4) * 4;
  }
}

export { SingleObjectScene };
