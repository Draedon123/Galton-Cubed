import { RollingAverage } from "./RollingAverage";

type GPUTimerOnUpdate = (time: number) => unknown;

class GPUTimer {
  public readonly canTimestamp: boolean;

  private readonly querySet!: GPUQuerySet;
  private readonly resolveBuffer!: GPUBuffer;
  private readonly resultBuffer!: GPUBuffer;

  private readonly rollingAverage: RollingAverage;

  public onUpdate: GPUTimerOnUpdate;

  constructor(device: GPUDevice, onUpdate: GPUTimerOnUpdate = () => {}) {
    this.canTimestamp = device.features.has("timestamp-query");
    this.onUpdate = onUpdate;
    this.rollingAverage = new RollingAverage(50);

    if (this.canTimestamp) {
      this.querySet = device.createQuerySet({
        label: "GPUTimer Query Set",
        type: "timestamp",
        count: 2,
      });

      this.resolveBuffer = device.createBuffer({
        label: "GPUTimer Resolve Buffer",
        size: this.querySet.count * BigInt64Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });

      this.resultBuffer = device.createBuffer({
        label: "GPUTimer Result Buffer",
        size: this.resolveBuffer.size,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
    }

    const originalSubmitMethod = device.queue.submit.bind(device.queue);
    device.queue.submit = (commandBuffers: Iterable<GPUCommandBuffer>) => {
      originalSubmitMethod(commandBuffers);

      if (!this.canTimestamp || this.resultBuffer.mapState !== "unmapped") {
        return;
      }

      this.resultBuffer.mapAsync(GPUMapMode.READ).then(() => {
        const times = new BigInt64Array(this.resultBuffer.getMappedRange());

        this.rollingAverage.addSample(Number(times[1] - times[0]));
        this.resultBuffer.unmap();

        this.onUpdate(this.rollingAverage.average);
      });
    };
  }

  public get time(): number {
    return this.rollingAverage.average;
  }

  public beginPass(
    commandEncoder: GPUCommandEncoder,
    passType: "render",
    descriptor?: Omit<GPURenderPassDescriptor, "timestampWrites">
  ): GPURenderPassEncoder;
  public beginPass(
    commandEncoder: GPUCommandEncoder,
    passType: "compute",
    descriptor?: Omit<GPUComputePassDescriptor, "timestampWrites">
  ): GPUComputePassEncoder;
  public beginPass(
    commandEncoder: GPUCommandEncoder,
    passType: "render" | "compute",
    descriptor?: Omit<
      GPUComputePassDescriptor | GPURenderPassDescriptor,
      "timestampWrites"
    >
  ): GPUComputePassEncoder | GPURenderPassEncoder {
    const timestampWrites: GPUComputePassTimestampWrites = {
      querySet: this.querySet,
      beginningOfPassWriteIndex: 0,
      endOfPassWriteIndex: 1,
    };

    const pass = commandEncoder[
      passType === "render" ? "beginRenderPass" : "beginComputePass"
      // @ts-expect-error idk how to fix the type error but i swear it's type safe
    ]({
      ...descriptor,
      ...(this.canTimestamp ? { timestampWrites } : undefined),
    });

    const originalEndMethod = pass.end.bind(pass);
    pass.end = () => {
      originalEndMethod();

      if (!this.canTimestamp) {
        return;
      }

      commandEncoder.resolveQuerySet(
        this.querySet,
        0,
        this.querySet.count,
        this.resolveBuffer,
        0
      );

      if (this.resultBuffer.mapState === "unmapped") {
        commandEncoder.copyBufferToBuffer(
          this.resolveBuffer,
          this.resultBuffer
        );
      }
    };

    return pass;
  }

  public beginComputePass(
    commandEncoder: GPUCommandEncoder,
    descriptor?: Omit<GPUComputePassDescriptor, "timestampWrites">
  ): GPUComputePassEncoder {
    return this.beginPass(commandEncoder, "compute", descriptor);
  }

  public beginRenderPass(
    commandEncoder: GPUCommandEncoder,
    descriptor: Omit<GPURenderPassDescriptor, "timestampWrites">
  ): GPURenderPassEncoder {
    return this.beginPass(commandEncoder, "render", descriptor);
  }

  public reset(): void {
    this.rollingAverage.reset();
  }
}

export { GPUTimer };
export type { GPUTimerOnUpdate };
