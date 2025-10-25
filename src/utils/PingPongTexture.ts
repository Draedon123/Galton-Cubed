class PingPongTexture {
  public readonly textures: [GPUTexture, GPUTexture];
  public readonly bindGroups: [GPUBindGroup, GPUBindGroup];
  public bindGroupLayout!: GPUBindGroupLayout;
  public state: 0 | 1;

  private readonly device: GPUDevice;
  private readonly label: string;

  private textureDescriptor!: Omit<GPUTextureDescriptor, "label">;
  constructor(device: GPUDevice, label: string) {
    // @ts-expect-error createTexture method must be manually called with descriptors
    this.textures = [];
    // @ts-expect-error filled with createTexture method
    this.bindGroups = [];
    this.state = 0;
    this.device = device;
    this.label = label;
  }

  public createTextures(descriptor: Omit<GPUTextureDescriptor, "label">): void {
    this.destroyTextures();

    this.textures.push(
      this.device.createTexture({
        label: `${this.label} 1`,
        ...descriptor,
      }),
      this.device.createTexture({
        label: `${this.label} 2`,
        ...descriptor,
      })
    );

    this.textureDescriptor = descriptor;
    this.updateBindGroups();
  }

  /**
   * Returns the next bind group and the corresponding texture being written to
   */
  public next(): GPUBindGroup {
    const bindGroup = this.bindGroups[this.state];

    this.state = ((this.state + 1) % 2) as 0 | 1;

    return bindGroup;
  }

  private updateBindGroups(): void {
    this.bindGroups.splice(0, 2);

    this.bindGroupLayout = this.device.createBindGroupLayout({
      label: `${this.label} Bind Group Layout`,
      entries: [
        {
          binding: 0,
          storageTexture: {
            access: "read-only",
            format: this.textureDescriptor.format,
          },
          visibility: GPUShaderStage.COMPUTE | GPUShaderStage.VERTEX,
        },
        {
          binding: 1,
          storageTexture: {
            access: "write-only",
            format: this.textureDescriptor.format,
          },
          visibility: GPUShaderStage.COMPUTE,
        },
      ],
    });

    this.bindGroups.push(
      this.device.createBindGroup({
        label: `${this.label} Bind Group 1`,
        layout: this.bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: this.textures[0].createView(),
          },
          {
            binding: 1,
            resource: this.textures[1].createView(),
          },
        ],
      }),
      this.device.createBindGroup({
        label: `${this.label} Bind Group 2`,
        layout: this.bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: this.textures[1].createView(),
          },
          {
            binding: 1,
            resource: this.textures[0].createView(),
          },
        ],
      })
    );
  }

  private destroyTextures(): void {
    this.textures.splice(0, 2).forEach((texture) => texture.destroy());
  }
}

export { PingPongTexture };
