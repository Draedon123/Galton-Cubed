import type { GaltonBoard } from "../GaltonBoard";
import { BufferWriter } from "../utils/BufferWriter";
import { GPUTimer } from "../utils/GPUTimer";
import { resolveBasePath } from "../utils/resolveBasePath";
import { roundUp } from "../utils/roundUp";
import { Shader } from "./Shader";

class BallPhysicsShader {
  private static readonly SETTINGS_BYTE_LENGTH: number = roundUp(6 * 4, 16);

  private readonly device: GPUDevice;
  private readonly board: GaltonBoard;
  private readonly gpuTimer: GPUTimer;

  private readonly bindGroup: GPUBindGroup;
  private readonly computePipeline: GPUComputePipeline;

  private readonly settingsBuffer: GPUBuffer;
  private readonly ballVelocitiesBuffer: GPUBuffer;
  constructor(shader: Shader, device: GPUDevice, board: GaltonBoard) {
    this.device = device;
    this.board = board;

    const frameTimeElement = document.getElementById(
      "computeFrameTime"
    ) as HTMLElement;

    this.gpuTimer = new GPUTimer(device, (time) => {
      const microseconds = time / 1e3;
      const milliseconds = time / 1e6;
      const useMilliseconds = milliseconds > 1;
      const displayTime = (
        useMilliseconds ? milliseconds : microseconds
      ).toFixed(2);
      const prefix = useMilliseconds ? "ms" : "μs";

      const frameTime = displayTime + prefix;

      frameTimeElement.textContent = frameTime;
    });

    this.settingsBuffer = device.createBuffer({
      label: "Ball Physics Shader Settings Buffer",
      size: BallPhysicsShader.SETTINGS_BYTE_LENGTH,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // don't need to write to buffer since velocities will initialise to 0
    this.ballVelocitiesBuffer = device.createBuffer({
      label: "Ball Physics Shader Ball States Buffer",
      size: board.maxBallCount * 4 * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = device.createBindGroupLayout({
      label: "Ball Physics Shader Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform" },
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
          resource: { buffer: board.spheres.scene.sceneBuffer },
        },
        {
          binding: 2,
          resource: { buffer: this.ballVelocitiesBuffer },
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

  private updateSettings(deltaTimeMs: number): void {
    const settings = new BufferWriter(BallPhysicsShader.SETTINGS_BYTE_LENGTH);
    settings.writeFloat32(deltaTimeMs);
    settings.writeUint32(this.board.pegCount);
    settings.writeFloat32(this.board.pegRadius);
    settings.writeFloat32(this.board.ballRadius);
    settings.writeUint32(this.board.ballCount);
    settings.writeFloat32(
      this.board.start.y -
        this.board.height -
        this.board.floorOffset +
        this.board.ballRadius +
        this.board.floorThickness
    );

    this.device.queue.writeBuffer(this.settingsBuffer, 0, settings.buffer);
  }

  public run(deltaTimeMs: number): void {
    this.updateSettings(deltaTimeMs);

    const commandEncoder = this.device.createCommandEncoder();
    const computePass = this.gpuTimer.beginComputePass(commandEncoder, {
      label: "Ball Physics Shader Compute Pass",
    });

    computePass.setBindGroup(0, this.bindGroup);
    computePass.setPipeline(this.computePipeline);
    computePass.dispatchWorkgroups(Math.ceil(this.board.ballCount / 64), 1, 1);
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
