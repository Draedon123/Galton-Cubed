import type { Vector3 } from "../../utils/Vector3";

type Vertex = {
  position: Vector3;
  normal: Vector3;
};

class Mesh {
  public vertexBuffer!: GPUBuffer;
  public indexBuffer!: GPUBuffer | null;

  private device!: GPUDevice;
  private vertices!: Float32Array;
  private indices!: Uint16Array | Uint32Array | null;
  protected rawVertices: Vertex[];
  protected rawIndices: number[] | null;

  private readonly label: string;
  constructor(
    rawVertices: Vertex[],
    rawIndices?: number[],
    label: string = ""
  ) {
    this.rawVertices = rawVertices;
    this.rawIndices = rawIndices ?? null;
    this.label = label;
  }

  public initialise(device: GPUDevice): void {
    this.device = device;

    this.update(this.rawVertices, this.rawIndices ?? undefined, true);
  }

  public update(
    rawVertices: Vertex[],
    rawIndices?: number[],
    forceRecreateBuffers: boolean = false
  ): void {
    if (!this.device) {
      return;
    }

    this.vertices = new Float32Array(
      rawVertices
        .map((vertex) => [
          vertex.position.x,
          vertex.position.y,
          vertex.position.z,
          vertex.normal.x,
          vertex.normal.y,
          vertex.normal.z,
        ])
        .flat()
    );

    if (
      rawVertices.length !== this.rawVertices.length ||
      forceRecreateBuffers
    ) {
      this.vertexBuffer?.destroy();

      this.vertexBuffer = this.device.createBuffer({
        label: `${this.label} Vertex Buffer`,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        size: this.vertices.byteLength,
      });
    }

    this.device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices.buffer);

    if (rawIndices !== undefined) {
      const IndexArray =
        this.indexFormat === "uint16" ? Uint16Array : Uint32Array;
      this.indices = new IndexArray(rawIndices);

      if (
        this.rawIndices?.length !== rawIndices.length ||
        forceRecreateBuffers
      ) {
        this.indexBuffer?.destroy();

        this.indexBuffer = this.device.createBuffer({
          label: `${this.label} Index Buffer`,
          usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
          size: this.indices.byteLength,
        });
      }

      this.device.queue.writeBuffer(
        this.indexBuffer as GPUBuffer,
        0,
        this.indices.buffer
      );
    } else {
      this.indices = null;
      this.indexBuffer = null;
    }
  }

  public render(renderPass: GPURenderPassEncoder): void {
    if (this.indexBuffer !== null) {
      renderPass.drawIndexed(this.indexCount);
    } else {
      renderPass.draw(this.rawVertices.length);
    }
  }

  public bind(
    renderPass: GPURenderPassEncoder,
    vertexBufferSlot: number = 0
  ): void {
    renderPass.setVertexBuffer(vertexBufferSlot, this.vertexBuffer);

    if (this.indexBuffer !== null) {
      renderPass.setIndexBuffer(this.indexBuffer, this.indexFormat);
    }
  }

  public get verticeCount(): number {
    return this.rawVertices.length;
  }

  public get indexCount(): number {
    return this.indices?.length ?? 0;
  }

  public get indexFormat(): GPUIndexFormat {
    return this.vertices.length > 0xffff ? "uint32" : "uint16";
  }
}

export { Mesh };
export type { Vertex };
