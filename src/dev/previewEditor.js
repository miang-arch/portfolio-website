const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const clamp = (value) => Math.min(100, Math.max(0, Math.round(value)));
const clampScale = (value) => Math.min(2.5, Math.max(1, Math.round(value * 100) / 100));

function parsePosition(value = "50% 50%") {
  const matches = value.match(/([\d.]+)%\s+([\d.]+)%/);
  return matches ? { x: Number(matches[1]), y: Number(matches[2]) } : { x: 50, y: 50 };
}

function formatPosition({ x, y }) {
  return `${clamp(x)}% ${clamp(y)}%`;
}

function formatScale(scale) {
  return `${clampScale(scale).toFixed(2)}x`;
}

function installStyles() {
  if (document.querySelector("#local-preview-editor-styles")) return;
  const style = document.createElement("style");
  style.id = "local-preview-editor-styles";
  style.textContent = `
    #local-preview-edit-toggle {
      position: fixed; right: 12px; bottom: 12px; z-index: 10000;
      padding: 5px 9px; border: 1px solid rgba(21,21,21,.45); border-radius: 999px;
      color: #151515; background: rgba(246,245,241,.92); box-shadow: 0 3px 12px rgba(0,0,0,.12);
      font: 600 11px/1 Arial, sans-serif; cursor: pointer; backdrop-filter: blur(8px);
    }
    #local-preview-edit-toggle[hidden] { display: none; }
    body.preview-editing #local-preview-edit-toggle { color: #f6f5f1; background: #151515; }
    .local-preview-controls { display: none; }
    body.preview-editing .catalog-card { position: relative; }
    body.preview-editing .catalog-preview { cursor: grab; touch-action: none; outline: 2px solid rgba(21,21,21,.7); outline-offset: -2px; }
    body.preview-editing .catalog-preview:active { cursor: grabbing; }
    body.preview-editing .catalog-card a:hover .catalog-preview img,
    body.preview-editing .catalog-card a:focus-visible .catalog-preview img { transform: scale(var(--preview-scale, 1)); }
    body.preview-editing .local-preview-controls {
      position: absolute; z-index: 20; top: 7px; right: 7px; display: flex; width: 158px; flex-direction: column; align-items: stretch; gap: 6px;
      padding: 5px; border-radius: 4px; color: #fff; background: rgba(15,15,15,.82);
      font: 600 10px/1 Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,.25);
    }
    .local-preview-readouts, .local-preview-actions { display: flex; align-items: center; justify-content: space-between; gap: 5px; }
    .local-preview-readouts { align-items: flex-start; flex-direction: column; }
    .local-preview-controls output { font-variant-numeric: tabular-nums; white-space: nowrap; }
    .local-preview-controls input[type="range"] { width: 100%; margin: 0; accent-color: #fff; cursor: ew-resize; }
    .local-preview-controls button {
      flex: 1;
      padding: 4px 6px; border: 1px solid rgba(255,255,255,.45); border-radius: 3px;
      color: inherit; background: transparent; font: inherit; cursor: pointer;
    }
    .local-preview-controls button:hover { background: rgba(255,255,255,.16); }
    .local-preview-controls [data-state="saved"] { color: #b8f2bd; }
  `;
  document.head.append(style);
}

function applyView(card, position, scale) {
  const image = card.querySelector(".catalog-preview img");
  const positionOutput = card.querySelector("[data-preview-position-output]");
  const scaleOutput = card.querySelector("[data-preview-scale-output]");
  const scaleInput = card.querySelector("[data-preview-scale-input]");
  const formatted = formatPosition(position);
  const normalizedScale = clampScale(scale);
  image.style.objectPosition = formatted;
  image.style.setProperty("--preview-position", formatted);
  image.style.setProperty("--preview-scale", normalizedScale);
  image.style.setProperty("--preview-hover-scale", normalizedScale);
  positionOutput.value = formatted;
  positionOutput.textContent = `Position: ${formatted}`;
  scaleOutput.value = String(normalizedScale);
  scaleOutput.textContent = `Scale: ${formatScale(normalizedScale)}`;
  scaleInput.value = String(normalizedScale);
  positionOutput.removeAttribute("data-state");
  scaleOutput.removeAttribute("data-state");
}

function decorateCard(card) {
  if (card.dataset.previewEditorReady === "true") return;
  const preview = card.querySelector(".catalog-preview");
  const image = preview?.querySelector("img");
  if (!preview || !image || !card.dataset.previewGroup || !card.dataset.previewSlug) return;

  card.dataset.previewEditorReady = "true";
  const controls = document.createElement("div");
  controls.className = "local-preview-controls";
  controls.innerHTML = `
    <div class="local-preview-readouts">
      <output data-preview-position-output aria-live="polite"></output>
      <output data-preview-scale-output aria-live="polite"></output>
    </div>
    <input data-preview-scale-input type="range" min="1" max="2.5" step="0.01" value="1" aria-label="Scale thumbnail image" />
    <div class="local-preview-actions">
      <button type="button" data-preview-reset>Reset</button>
      <button type="button" data-preview-save>Save</button>
    </div>`;
  card.append(controls);

  let position = parsePosition(getComputedStyle(image).objectPosition);
  let scale = clampScale(Number(image.style.getPropertyValue("--preview-scale")) || 1);
  applyView(card, position, scale);

  let drag = null;
  preview.addEventListener("pointerdown", (event) => {
    if (!document.body.classList.contains("preview-editing")) return;
    event.preventDefault();
    const bounds = preview.getBoundingClientRect();
    drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, width: bounds.width, height: bounds.height, position: { ...position } };
    preview.setPointerCapture(event.pointerId);
  });
  preview.addEventListener("pointermove", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    position = {
      x: drag.position.x - ((event.clientX - drag.startX) / drag.width) * 100,
      y: drag.position.y - ((event.clientY - drag.startY) / drag.height) * 100,
    };
    applyView(card, position, scale);
  });
  const endDrag = (event) => {
    if (drag?.pointerId === event.pointerId) drag = null;
  };
  preview.addEventListener("pointerup", endDrag);
  preview.addEventListener("pointercancel", endDrag);

  preview.addEventListener("wheel", (event) => {
    if (!document.body.classList.contains("preview-editing")) return;
    event.preventDefault();
    scale = clampScale(scale + (event.deltaY < 0 ? 0.05 : -0.05));
    applyView(card, position, scale);
  }, { passive: false });

  controls.querySelector("[data-preview-scale-input]").addEventListener("input", (event) => {
    scale = clampScale(Number(event.currentTarget.value));
    applyView(card, position, scale);
  });

  controls.querySelector("[data-preview-reset]").addEventListener("click", () => {
    position = parsePosition(card.dataset.previewResetPosition || "50% 50%");
    scale = clampScale(Number(card.dataset.previewResetScale) || 1);
    applyView(card, position, scale);
  });

  controls.querySelector("[data-preview-save]").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "Saving";
    try {
      const response = await fetch("/__preview-position", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Preview-Editor": "local-dev" },
        body: JSON.stringify({ group: card.dataset.previewGroup, slug: card.dataset.previewSlug, position: formatPosition(position), scale: clampScale(scale) }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Save failed.");
      const positionOutput = controls.querySelector("[data-preview-position-output]");
      const scaleOutput = controls.querySelector("[data-preview-scale-output]");
      positionOutput.dataset.state = "saved";
      scaleOutput.dataset.state = "saved";
      positionOutput.textContent = `Position: ${formatPosition(position)} ✓`;
      scaleOutput.textContent = `Scale: ${formatScale(scale)} ✓`;
      button.textContent = "Saved";
    } catch (error) {
      button.textContent = "Retry";
      window.alert(error.message);
    } finally {
      button.disabled = false;
      window.setTimeout(() => { button.textContent = "Save"; }, 1200);
    }
  });
}

function decorateCards() {
  document.querySelectorAll(".catalog-card[data-preview-group]").forEach(decorateCard);
}

export function initPreviewEditor() {
  if (!import.meta.env.DEV || !localHosts.has(window.location.hostname) || document.querySelector("#local-preview-edit-toggle")) return;
  installStyles();
  const toggle = document.createElement("button");
  toggle.id = "local-preview-edit-toggle";
  toggle.type = "button";
  toggle.textContent = "Edit";
  toggle.setAttribute("aria-pressed", "false");
  document.body.append(toggle);

  const syncAvailability = () => {
    const available = Boolean(document.querySelector(".catalog-card[data-preview-group]"));
    toggle.hidden = !available;
    if (!available) {
      document.body.classList.remove("preview-editing");
      toggle.textContent = "Edit";
      toggle.setAttribute("aria-pressed", "false");
    }
    decorateCards();
  };

  toggle.addEventListener("click", () => {
    const active = document.body.classList.toggle("preview-editing");
    toggle.textContent = active ? "Done" : "Edit";
    toggle.setAttribute("aria-pressed", String(active));
    decorateCards();
  });

  document.addEventListener("click", (event) => {
    if (document.body.classList.contains("preview-editing") && event.target.closest(".catalog-card a")) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  new MutationObserver(syncAvailability).observe(document.querySelector("#app"), { childList: true, subtree: true });
  syncAvailability();
}
