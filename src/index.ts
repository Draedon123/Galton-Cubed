import "./style.css";
import { Renderer } from "./engine/Renderer";
import { Loop } from "./utils/Loop";
import { initialiseConfigPanel } from "./configPanel";
import { Vector3 } from "./utils/Vector3";
import { GaltonBoard } from "./GaltonBoard";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const frameTimeElement = document.getElementById("frameTime") as HTMLElement;
  const fpsElement = document.getElementById("fps") as HTMLElement;

  const board = new GaltonBoard({
    ballCount: 100,
  });
  const renderer = await Renderer.create(canvas, {
    scene: board.scene,
    cameraOptions: {
      mouseSensitivity: 0.1,
      movementSpeed: 0.1,
    },
    timing: {
      frameTimeElement,
      fpsElement,
    },
  });

  await renderer.initialise();
  await board.initialise(renderer.device);

  renderer.camera.position = new Vector3(0, 10, 20);
  renderer.camera.fovDegrees = 60;

  initialiseConfigPanel(renderer);

  const loop = new Loop();

  loop.addCallback((frame) => {
    renderer.camera.checkKeyboardInputs(frame.deltaTime);
    board.tick(frame.deltaTime);
    renderer.render();
  });

  loop.start();

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });
}

main().catch((error) => {
  const errorMessage =
    error instanceof Error ? error.message : JSON.stringify(error);
  // const iframe = document.querySelector("iframe") as HTMLIFrameElement;
  const errorElement = document.getElementById("message") as HTMLElement;

  errorElement.classList.add("error");
  errorElement.textContent = errorMessage;
  // iframe.classList.remove("hidden");
  // iframe.src = "https://youtube.com/embed/PLACEHOLDER";

  const chevron = document.getElementById("chevron");
  const panel = document.getElementById("content");

  chevron?.classList.add("collapsed");
  panel?.classList.add("collapsed");

  console.trace();
  console.error(errorMessage);
});
