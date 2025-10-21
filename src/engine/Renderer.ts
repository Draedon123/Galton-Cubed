import { GPUTimer } from "../utils/GPUTimer";
import { Matrix4Buffer } from "../utils/Matrix4Buffer";
import { resolveBasePath } from "../utils/resolveBasePath";
import { BallScene } from "./BallScene";
import { Camera, type CameraOptions } from "./Camera";
import { Shader } from "./Shader";

type RendererSettings = {
  cameraOptions?: Partial<CameraOptions>;
  timing?: Partial<{
    frameTimeElement: HTMLElement;
    fpsElement: HTMLElement;
  }>;
};

class Renderer {
  public readonly canvas: HTMLCanvasElement;
  public readonly camera: Camera;
  public readonly settings: Omit<RendererSettings, "cameraOptions">;
  public readonly ballScene: BallScene;

  private readonly device: GPUDevice;
  private readonly ctx: GPUCanvasContext;
  private readonly canvasFormat: GPUTextureFormat;
  private readonly gpuTimer: GPUTimer;

  private initialised: boolean;

  private renderBindGroup!: GPUBindGroup;
  private renderPipeline!: GPURenderPipeline;
  private depthTexture!: GPUTexture;

  private readonly perspectiveViewMatrix: Matrix4Buffer;

  private constructor(
    canvas: HTMLCanvasElement,
    settings: Partial<RendererSettings>,
    device: GPUDevice
  ) {
    const ctx = canvas.getContext("webgpu");

    if (ctx === null) {
      throw new Error("Could not create WebGPU Canvas Context");
    }

    this.settings = {
      timing: settings.timing,
    };

    this.canvas = canvas;
    this.device = device;
    this.ctx = ctx;
    this.canvasFormat = "rgba8unorm";
    this.camera = new Camera(settings.cameraOptions);
    this.ballScene = new BallScene(100);
    this.perspectiveViewMatrix = new Matrix4Buffer(
      device,
      "Perspective View Matrix"
    );
    this.gpuTimer = new GPUTimer(this.device, (time) => {
      const microseconds = time / 1e3;
      const milliseconds = time / 1e6;
      const seconds = time / 1e9;
      const useMilliseconds = milliseconds > 1;
      const displayTime = (
        useMilliseconds ? milliseconds : microseconds
      ).toFixed(2);
      const prefix = useMilliseconds ? "ms" : "μs";

      if (this.settings.timing?.frameTimeElement !== undefined) {
        this.settings.timing.frameTimeElement.textContent =
          displayTime + prefix;
      }

      if (this.settings.timing?.fpsElement !== undefined) {
        const fps = 1 / seconds;
        this.settings.timing.fpsElement.textContent = fps.toFixed(2);
      }
    });

    if (!this.gpuTimer.canTimestamp) {
      if (this.settings.timing?.frameTimeElement !== undefined) {
        this.settings.timing.frameTimeElement.textContent =
          "[Not supported by browser]";
      }

      if (this.settings.timing?.fpsElement !== undefined) {
        this.settings.timing.fpsElement.textContent =
          "[Not supported by browser]";
      }
    }

    this.initialised = false;
  }

  public async initialise(): Promise<void> {
    if (this.initialised) {
      return;
    }

    this.ballScene.initialise(this.device);

    await this.initialiseRendering();

    new ResizeObserver((entries) => {
      const canvas = entries[0];

      const width = canvas.devicePixelContentBoxSize[0].inlineSize;
      const height = canvas.devicePixelContentBoxSize[0].blockSize;

      this.canvas.width = width;
      this.canvas.height = height;
      this.camera.aspectRatio = width / height;
      this.depthTexture?.destroy();
      this.depthTexture = this.createDepthTexture();

      this.gpuTimer.reset();

      this.render();
    }).observe(this.canvas);

    this.initialised = true;
  }

  private createDepthTexture(): GPUTexture {
    return this.device.createTexture({
      label: "Renderer Depth Texture",
      size: [this.canvas.width, this.canvas.height],
      format: "depth24plus",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  private async initialiseRendering(): Promise<void> {
    this.ctx.configure({
      device: this.device,
      format: this.canvasFormat,
    });

    const shader = await Shader.fetch(
      this.device,
      resolveBasePath("shaders/render.wgsl")
    );

    this.depthTexture = this.createDepthTexture();

    const renderBindGroupLayout = this.device.createBindGroupLayout({
      label: "Cube Bind Group Layout",
      entries: [
        {
          binding: 0,
          buffer: { type: "uniform" },
          visibility: GPUShaderStage.VERTEX,
        },
        {
          binding: 1,
          buffer: { type: "read-only-storage" },
          visibility: GPUShaderStage.VERTEX,
        },
      ],
    });

    this.renderBindGroup = this.device.createBindGroup({
      label: "Render Bing Group",
      layout: renderBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.perspectiveViewMatrix.buffer },
        },
        {
          binding: 1,
          resource: { buffer: this.ballScene.sceneBuffer },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      label: "Renderer Render Pipeline Layout",
      bindGroupLayouts: [renderBindGroupLayout],
    });

    this.renderPipeline = this.device.createRenderPipeline({
      label: "Renderer Render Pipeline",
      layout: pipelineLayout,
      vertex: {
        module: shader.shader,
        buffers: [
          {
            arrayStride: 6 * 4,
            attributes: [
              // position
              {
                shaderLocation: 0,
                format: "float32x3",
                offset: 0,
              },
              // normal
              {
                shaderLocation: 1,
                format: "float32x3",
                offset: 3 * 4,
              },
            ],
          },
        ],
      },
      fragment: {
        module: shader.shader,
        targets: [
          {
            format: this.canvasFormat,
          },
        ],
      },
      primitive: {
        // cullMode: "front",
        // topology: "line-list",
      },
      depthStencil: {
        format: "depth24plus",
        depthCompare: "less",
        depthWriteEnabled: true,
      },
    });
  }

  public render(): void {
    this.perspectiveViewMatrix.copyFrom(this.camera.getPerspectiveViewMatrix());
    this.perspectiveViewMatrix.writeBuffer();

    this.renderToCanvas();
  }

  private renderToCanvas(): void {
    const commandEncoder = this.device.createCommandEncoder();
    const renderPass = this.gpuTimer.beginRenderPass(commandEncoder, {
      colorAttachments: [
        {
          view: this.ctx.getCurrentTexture().createView(),
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture.createView(),
        depthLoadOp: "clear",
        depthStoreOp: "store",
        depthClearValue: 1,
      },
    });

    this.ballScene.mesh.bind(renderPass);
    renderPass.setBindGroup(0, this.renderBindGroup);
    renderPass.setPipeline(this.renderPipeline);
    renderPass.drawIndexed(
      this.ballScene.mesh.indexCount,
      this.ballScene.objects.length
    );

    renderPass.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  public static async create(
    canvas: HTMLCanvasElement,
    settings: Partial<RendererSettings> = {}
  ): Promise<Renderer> {
    if (!("gpu" in navigator)) {
      throw new Error("WebGPU not supported");
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (adapter === null) {
      throw new Error(
        "Could not find suitable GPU Adapter. Maybe your browser doesn't support WebGPU?"
      );
    }

    const device = await adapter.requestDevice({
      requiredFeatures: Renderer.requestFeatures(adapter, "timestamp-query"),
    });

    if (device === null) {
      throw new Error(
        "Could not find suitable GPU Device. Maybe your browser doesn't support WebGPU?"
      );
    }

    return new Renderer(canvas, settings, device);
  }

  private static requestFeatures(
    adapter: GPUAdapter,
    ...features: GPUFeatureName[]
  ): GPUFeatureName[] {
    return features.filter((feature) => {
      const supported = adapter.features.has(feature);

      if (!supported) {
        console.warn(`GPU Feature ${feature} not supported`);
      }

      return supported;
    });
  }
}

export { Renderer };
