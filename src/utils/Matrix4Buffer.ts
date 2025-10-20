import { Matrix4 } from "./Matrix4";

class Matrix4Buffer extends Matrix4 {
  public readonly buffer: GPUBuffer;
  private readonly device: GPUDevice;

  constructor(
    device: GPUDevice,
    label: string,
    usage: number = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  ) {
    super();

    this.device = device;
    this.buffer = device.createBuffer({
      label,
      usage,
      size: 16 * 4,
    });
    this.device = device;
  }

  public writeBuffer(): void {
    this.device.queue.writeBuffer(this.buffer, 0, this.components.buffer);
  }
}

export { Matrix4Buffer };
