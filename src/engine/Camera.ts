import { degrees, radians } from "../utils/angles";
import { clamp } from "../utils/clamp";
import { KeyboardManager } from "../utils/KeyboardManager";
import { Matrix4 } from "../utils/Matrix4";
import { Vector3 } from "../utils/Vector3";

type CameraOptions = {
  position: Vector3;
  lookAt: Vector3;
  fovDegrees: number;
  aspectRatio: number;
  near: number;
  far: number;

  movementSpeed: number;
  mouseSensitivity: number;

  keybinds: Partial<Keybinds>;
};

type Keybinds = {
  forwards: string;
  backwards: string;
  left: string;
  right: string;
  up: string;
  down: string;
};

class Camera {
  public position: Vector3;
  public forward: Vector3;
  public aspectRatio: number;
  public near: number;
  public far: number;

  public movementSpeed: number;
  public mouseSensitivity: number;

  private pitch: number;
  private yaw: number;

  private fovRadians: number;

  private readonly keyboardManager: KeyboardManager;
  private readonly keybinds: Keybinds;

  constructor(options: Partial<CameraOptions> = {}) {
    this.position = options.position ?? new Vector3();
    this.forward = new Vector3(0, 0, -1);
    this.aspectRatio = options.aspectRatio ?? 16 / 9;
    this.near = options.near ?? 0.1;
    this.far = options.far ?? 1000;
    this.fovRadians = radians(options.fovDegrees ?? 60);
    this.movementSpeed = options.movementSpeed ?? 1;
    this.mouseSensitivity = options.mouseSensitivity ?? 1;
    this.pitch = 0;
    this.yaw = -90;

    this.keybinds = {
      forwards: options.keybinds?.forwards ?? "KeyW",
      backwards: options.keybinds?.backwards ?? "KeyS",
      left: options.keybinds?.left ?? "KeyA",
      right: options.keybinds?.right ?? "KeyD",
      up: options.keybinds?.up ?? "Space",
      down: options.keybinds?.down ?? "ShiftLeft",
    };

    this.keyboardManager = new KeyboardManager(Object.values(this.keybinds));
    this.addEventListeners();
  }

  public checkKeyboardInputs(deltaTime: number): void {
    const movementSpeed = this.movementSpeed * deltaTime;

    if (this.keyboardManager.isKeyDown(this.keybinds.forwards)) {
      const forward = Vector3.clone(this.forward);
      forward.y = 0;
      forward.normalise();

      this.position.add(Vector3.scale(forward, movementSpeed));
    }

    if (this.keyboardManager.isKeyDown(this.keybinds.backwards)) {
      const forward = Vector3.clone(this.forward);
      forward.y = 0;
      forward.normalise();

      this.position.subtract(Vector3.scale(forward, movementSpeed));
    }

    if (this.keyboardManager.isKeyDown(this.keybinds.left)) {
      const forward = Vector3.clone(this.forward);
      forward.y = 0;
      forward.normalise();

      this.position.subtract(
        Vector3.cross(forward, new Vector3(0, 1, 0))
          .normalise()
          .scale(movementSpeed)
      );
    }

    if (this.keyboardManager.isKeyDown(this.keybinds.right)) {
      const forward = Vector3.clone(this.forward);
      forward.y = 0;
      forward.normalise();

      this.position.add(
        Vector3.cross(forward, new Vector3(0, 1, 0))
          .normalise()
          .scale(movementSpeed)
      );
    }

    if (this.keyboardManager.isKeyDown(this.keybinds.up)) {
      this.position.y += movementSpeed;
    }

    if (this.keyboardManager.isKeyDown(this.keybinds.down)) {
      this.position.y -= movementSpeed;
    }
  }

  private addEventListeners(): void {
    this.keyboardManager.addEventListeners();

    document.addEventListener("mousemove", (event) => {
      const deltaX = event.movementX * this.mouseSensitivity;
      const deltaY = -event.movementY * this.mouseSensitivity;

      this.yaw += deltaX;
      this.pitch = clamp(this.pitch + deltaY, -89.9, 89.9);

      this.updateForwardVector();
    });
  }

  public get fovDegrees(): number {
    return degrees(this.fovRadians);
  }

  public set fovDegrees(degrees: number) {
    this.fovRadians = radians(degrees);
  }

  public getPerspectiveMatrix(): Matrix4 {
    return Matrix4.perspective(
      this.fovRadians,
      this.aspectRatio,
      this.near,
      this.far
    );
  }

  public getViewMatrix(): Matrix4 {
    const up = new Vector3(0, 1, 0);

    return Matrix4.lookAt(
      this.position,
      Vector3.add(this.position, this.forward /*.normalise()*/),
      up
    );
  }

  public getPerspectiveViewMatrix(): Matrix4 {
    return Matrix4.multiplyMatrices(
      this.getPerspectiveMatrix(),
      this.getViewMatrix()
    );
  }

  public updateForwardVector(): void {
    const yaw = radians(this.yaw);
    const pitch = radians(this.pitch);

    const cosYaw = Math.cos(yaw);
    const cosPitch = Math.cos(pitch);
    const sinYaw = Math.sin(yaw);
    const sinPitch = Math.sin(pitch);

    const direction = new Vector3(
      cosYaw * cosPitch,
      sinPitch,
      sinYaw * cosPitch
    ).normalise();

    this.forward = direction;
  }
}

export { Camera };
export type { CameraOptions };
