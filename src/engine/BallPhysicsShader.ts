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

  private _executionTimeMs: number;
  constructor(shader: Shader, device: GPUDevice, board: GaltonBoard) {
    this.device = device;
    this.board = board;
    this.gpuTimer = new GPUTimer(device, (time) => {
      this._executionTimeMs = time / 1000;
    });
    this._executionTimeMs = 0;

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

    // don't need to write to buffer since accelerations and velocities will
    // initialise to 0
    this.ballStatesBuffer = device.createBuffer({
      label: "Ball Physics Shader Ball States Buffer",
      size: board.ballCount * 8 * 4,
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

  public get executionTimeMs(): number {
    return this._executionTimeMs;
  }

  public run(deltaTimeMs: number): void {
    this.device.queue.writeBuffer(
      this.settingsBuffer,
      0,
      new Float32Array([deltaTimeMs]),
      0,
      1
    );

    const commandEncoder = this.device.createCommandEncoder();
    const computePass = this.gpuTimer.beginComputePass(commandEncoder, {
      label: "Ball Physics Shader Compute Pass",
    });

    computePass.setBindGroup(0, this.bindGroup);
    computePass.setPipeline(this.computePipeline);
    computePass.dispatchWorkgroups(
      Math.ceil(this.board.ballCount / 8),
      Math.ceil(this.board.ballCount / 8),
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
