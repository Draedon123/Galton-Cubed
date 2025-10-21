import type { Vector3 } from "../../utils/Vector3";

type Vertex = {
  position: Vector3;
  normal: Vector3;
};

class Mesh {
  public vertexBuffer!: GPUBuffer;
  public indexBuffer!: GPUBuffer | null;

  private vertices!: Float32Array;
  private indices!: Uint16Array | Uint32Array | null;

  private readonly rawVertices: Vertex[];
  private readonly rawIndices: number[] | null;
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
    this.vertices = new Float32Array(
      this.rawVertices
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

    if (this.rawIndices !== null) {
      this.indices = new (
        this.indexFormat === "uint16" ? Uint16Array : Uint32Array
      )(this.rawIndices);

      this.indexBuffer = device.createBuffer({
        label: `${this.label} Index Buffer`,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        size: this.indices.byteLength,
      });
      device.queue.writeBuffer(this.indexBuffer, 0, this.indices.buffer);
    } else {
      this.indices = null;
      this.indexBuffer = null;
    }

    this.vertexBuffer = device.createBuffer({
      label: `${this.label} Vertex Buffer`,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      size: this.vertices.byteLength,
    });
    device.queue.writeBuffer(this.vertexBuffer, 0, this.vertices.buffer);
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
