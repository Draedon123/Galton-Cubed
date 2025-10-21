type LoopSettings = {
  wormholeThreshold: number;
};
type FrameData = {
  deltaTime: number;
  totalTime: number;
  /** first frame is 1 */
  frame: number;
};
type LoopCallback = (frameData: FrameData) => unknown;

class Loop {
  public settings: LoopSettings;
  private readonly callbacks: LoopCallback[] = [];
  private frameID: number | null;
  private lastFrameTime: number;
  private totalTime: number;
  private frame: number;
  constructor(settings: Partial<LoopSettings> = {}) {
    this.frameID = null;
    this.lastFrameTime = 0;
    this.totalTime = 0;
    this.frame = 1;
    this.callbacks = [];

    this.settings = {
      wormholeThreshold: settings.wormholeThreshold ?? 500,
    };
  }

  public start(): void {
    if (this.running) {
      return;
    }

    this.frame = 1;
    this.totalTime = 0;
    this.lastFrameTime = -1;
    this.frameID = requestAnimationFrame(this.tick.bind(this));
  }

  public stop(): void {
    if (!this.running) {
      return;
    }

    cancelAnimationFrame(this.frameID as number);
    this.frameID = null;
  }

  public toggle(): void {
    if (this.running) {
      this.stop();
    } else {
      this.start();
    }
  }

  public addCallback(callback: LoopCallback): void {
    this.callbacks.push(callback);
  }

  private tick(tickTime: number): void {
    if (this.lastFrameTime < 0) {
      this.lastFrameTime = tickTime;
    }

    const deltaTimeMS = tickTime - this.lastFrameTime;
    const totalTimeMS = this.totalTime + deltaTimeMS;

    if (deltaTimeMS < this.settings.wormholeThreshold) {
      const frameData: FrameData = {
        deltaTime: deltaTimeMS,
        totalTime: totalTimeMS,
        frame: this.frame++,
      };

      for (const callback of this.callbacks) {
        callback(frameData);
      }

      this.totalTime = totalTimeMS;
    }

    this.lastFrameTime = tickTime;
    this.frameID = requestAnimationFrame(this.tick.bind(this));
  }

  public get running(): boolean {
    return this.frameID !== null;
  }
}

export { Loop };
export type { LoopSettings, FrameData, LoopCallback };
