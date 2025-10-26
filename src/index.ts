import { Renderer } from "./engine/Renderer";
import { Loop } from "./utils/Loop";
import { initialiseConfigPanel } from "./configPanel";
import { Vector3 } from "./utils/Vector3";
import { GaltonBoard } from "./GaltonBoard";

async function main(): Promise<void> {
  const message = document.getElementById("message") as HTMLElement;

  message.style.zIndex = "2";

  const canvas = document.getElementById("main") as HTMLCanvasElement;

  const board = new GaltonBoard({
    ballCount: 100000,
    layers: 9,
    pegRadius: 4,
    floorResolution: 320,
    floorOffset: 70,
    sideLength: 120,
  });
  const renderer = await Renderer.create(canvas, {
    scene: board.scene,
    cameraOptions: {
      mouseSensitivity: 0.1,
      movementSpeed: 0.1,
    },
  });

  await board.initialise(renderer.device);
  await renderer.initialise(board);

  renderer.camera.position = new Vector3(
    board.floorResolution * 0.35,
    10,
    board.floorResolution * 0.25
  );
  renderer.camera.fovDegrees = 60;
  renderer.camera.lookAt(new Vector3(0, -10 * board.pegRadius, 0));

  initialiseConfigPanel(renderer);

  const loop = new Loop({ wormholeThreshold: 100 });

  const spawnFrames = 1;
  const ballsPerSpawnWave = 50;

  const generator = board.createBalls(ballsPerSpawnWave);
  let result = generator.next();

  loop.addCallback((frame) => {
    if (!result.done && frame.frame % spawnFrames === spawnFrames - 1) {
      for (let i = 0; i < ballsPerSpawnWave; i++) {
        result = generator.next();
      }
    }

    renderer.camera.checkKeyboardInputs(frame.deltaTime);
    board.tick(frame.deltaTime);
    renderer.render();
  });

  loop.start();
  message.style.zIndex = "unset";

  canvas.addEventListener("click", () => {
    canvas.requestPointerLock();
  });
}

main().catch((error) => {
  const errorMessage =
    error instanceof Error ? error.message : JSON.stringify(error);
  const iframe = document.querySelector("iframe") as HTMLIFrameElement;
  const errorElement = document.getElementById("message") as HTMLElement;

  errorElement.classList.add("error");
  errorElement.textContent = errorMessage;
  iframe.classList.remove("hidden");
  iframe.src = "https://www.youtube.com/embed/w5SLhNPOr2I";

  const chevron = document.getElementById("chevron");
  const panel = document.getElementById("content");

  chevron?.classList.add("collapsed");
  panel?.classList.add("collapsed");

  console.error(errorMessage);
});
