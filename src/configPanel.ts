import type { Renderer } from "./engine/Renderer";

// @ts-expect-error just a placeholder; wil be used later
function initialiseConfigPanel(renderer: Renderer): void {
  initialiseChevron();
}

function initialiseChevron(): void {
  const chevron = document.getElementById("chevron");
  const panel = document.getElementById("content");

  if (chevron === null) {
    throw new Error("Could not find chevron element");
  }

  if (panel === null) {
    throw new Error("Could not find info panel");
  }

  chevron.addEventListener("click", () => {
    chevron.classList.toggle("collapsed");
    panel.classList.toggle("collapsed");
  });
}

export { initialiseConfigPanel };
