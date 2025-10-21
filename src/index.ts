import "./style.css";
import { Renderer } from "./engine/Renderer";
import { Loop } from "./utils/Loop";
import { initialiseConfigPanel } from "./configPanel";
import { Vector3 } from "./utils/Vector3";
import { Model } from "./engine/meshes/Model";
import { Quaternion } from "./utils/Quaternion";

async function main(): Promise<void> {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const frameTimeElement = document.getElementById("frameTime") as HTMLElement;
  const fpsElement = document.getElementById("fps") as HTMLElement;
  const renderer = await Renderer.create(canvas, {
    timing: {
      frameTimeElement,
      fpsElement,
    },
  });

  await renderer.initialise();

  const ball1 = new Model({
    position: new Vector3(-2.5, -0.5, -0.5),
    rotation: Quaternion.fromEulerAngles(0, 0, 0),
    scale: new Vector3(1.2, 1.2, 1.2),
  });

  const ball2 = new Model({
    position: new Vector3(2.5, -0.5, -0.5),
    rotation: Quaternion.fromEulerAngles(0, 0, 0),
    scale: new Vector3(0.5, 0.5, 0.5),
  });
  renderer.ballScene.objects.push(ball1, ball2);

  renderer.camera.position = new Vector3(3, 3, 3);
  renderer.camera.fovDegrees = 60;
  renderer.camera.lookAt = new Vector3(0, 0, 0);

  initialiseConfigPanel(renderer);

  const loop = new Loop();

  loop.addCallback(() => {
    ball1.rotation.rotateX(0.5);
    ball1.rotation.rotateY(1);
    ball1.rotation.rotateZ(2);
    renderer.ballScene.update();
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
