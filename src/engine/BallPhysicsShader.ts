import type { GaltonBoard } from "../GaltonBoard";
import { BufferWriter } from "../utils/BufferWriter";
import { GPUTimer } from "../utils/GPUTimer";
import { resolveBasePath } from "../utils/resolveBasePath";
import { Shader } from "./Shader";

class BallPhysicsShader {
  private readonly device: GPUDevice;
  private readonly board: GaltonBoard;

  private readonly gpuTimer: GPUTimer;
  private readonly bindGroup: GPUBindGroup;
  private readonly computePipeline: GPUComputePipeline;

  private readonly settingsBuffer: GPUBuffer;
  private readonly ballStatesBuffer: GPUBuffer;
  constructor(shader: Shader, device: GPUDevice, board: GaltonBoard) {
    const frameTimeElement = document.getElementById(
      "frameTime"
    ) as HTMLElement;
    const fpsElement = document.getElementById("fps") as HTMLElement;

    this.device = device;
    this.board = board;
    this.gpuTimer = new GPUTimer(device, (time) => {
      const microseconds = time / 1e3;
      const milliseconds = time / 1e6;
      const seconds = time / 1e9;
      const useMilliseconds = milliseconds > 1;
      const displayTime = (
        useMilliseconds ? milliseconds : microseconds
      ).toFixed(2);
      const prefix = useMilliseconds ? "ms" : "μs";

      frameTimeElement.textContent = displayTime + prefix;

      const fps = 1 / seconds;
      fpsElement.textContent = fps.toFixed(2);
    });

    if (!this.gpuTimer.canTimestamp) {
      frameTimeElement.textContent = "[Not supported by browser]";
      fpsElement.textContent = "[Not supported by browser]";
    }

    const SETTINGS_BYTE_LENGTH = 4 * 4;
    this.settingsBuffer = device.createBuffer({
      label: "Ball Physics Shader Settings Buffer",
      size: SETTINGS_BYTE_LENGTH,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const settings = new BufferWriter(SETTINGS_BYTE_LENGTH);
    settings.writeFloat32(0);
    settings.writeUint32(board.pegCount);
    settings.writeFloat32(board.pegRadius);
    settings.writeFloat32(board.ballRadius);

    device.queue.writeBuffer(this.settingsBuffer, 0, settings.buffer);

    // don't need to write to buffer since velocities will initialise to 0
    this.ballStatesBuffer = device.createBuffer({
      label: "Ball Physics Shader Ball States Buffer",
      size: board.maxBallCount * 4 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Ball Physics Shader Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: { type: "read-only-storage" },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 1,
          buffer: { type: "storage" },
          visibility: GPUShaderStage.COMPUTE,
        },
        {
          binding: 2,
          buffer: { type: "storage" },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroup = device.createBindGroup({
      label: "Ball Physics Shader Bind Group",
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.settingsBuffer },
        },
        {
          binding: 1,
          resource: { buffer: board.scene.sceneBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.ballStatesBuffer },
        },
      ],
    });

    const pipelineLayout = device.createPipelineLayout({
      label: "Ball Physics Shader Compute Pipeline Layout",
      bindGroupLayouts: [bindGroupLayout],
    });

    this.computePipeline = device.createComputePipeline({
      label: "Ball Physics Shader Compute Pipeline",
      layout: pipelineLayout,
      compute: {
        module: shader.shader,
      },
    });
  }

  public run(deltaTimeMs: number): void {
    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([deltaTimeMs])
    );

    const commandEncoder = this.device.createCommandEncoder();
    const computePass = this.gpuTimer.beginComputePass(commandEncoder, {
      label: "Ball Physics Shader Compute Pass",
    });

    computePass.setBindGroup(0, this.bindGroup);
    computePass.setPipeline(this.computePipeline);
    computePass.dispatchWorkgroups(
      Math.ceil(this.board.ballCount / 64),
      Math.ceil(this.board.ballCount / 64),
      1
    );
    computePass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  public static async create(
    device: GPUDevice,
    board: GaltonBoard
  ): Promise<BallPhysicsShader> {
    const shaderModule = await Shader.fetch(
      device,
      resolveBasePath("shaders/ballPhysics.wgsl")
    );
    return new BallPhysicsShader(shaderModule, device, board);
  }
}

export { BallPhysicsShader };
