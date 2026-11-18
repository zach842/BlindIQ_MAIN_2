import type { HarvestEntry } from "./types";

export type HuntShareInput = {
  state: string;
  zone: string;
  entries: HarvestEntry[];
  duckCount: number;
  gooseCount: number;
  totalCount: number;
  huntCategoryLabel: string;
  isSimulation: boolean;
  date?: string;
  blindName?: string | null;
  firearmUsed?: string | null;
  photo?: Blob | string | null;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => { image.src = ""; reject(new Error("The share image took too long to load. Please retry.")); }, 15_000);
    image.onload = () => { clearTimeout(timeout); resolve(image); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error("The BlindIQ share image could not be prepared.")); };
    image.src = src;
  });
}

async function loadOptionalPhoto(source?: Blob | string | null) {
  if (!source) return null;
  let objectUrl = "";
  try {
    const blob = source instanceof Blob
      ? source
      : await fetch(source, { cache: "no-store", signal: AbortSignal.timeout(15_000) }).then((response) => {
          if (!response.ok) throw new Error("Saved hunt photo is unavailable.");
          return response.blob();
        });
    objectUrl = URL.createObjectURL(blob);
    const image = await loadImage(objectUrl);
    return { image, release: () => URL.revokeObjectURL(objectUrl) };
  } catch {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw new Error("Your hunt photo could not be loaded. Retry, or turn off Include hunt photo to share a card without it.");
  }
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The hunt card could not be created.")), "image/png", 0.94);
  });
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const renderedWidth = image.width * scale;
  const renderedHeight = image.height * scale;
  context.drawImage(image, x + (width - renderedWidth) / 2, y + (height - renderedHeight) / 2, renderedWidth, renderedHeight);
}

function clipped(value: string, maximum: number) {
  return value.length > maximum ? `${value.slice(0, maximum - 1).trim()}…` : value;
}

export async function createHuntShareFile(input: HuntShareInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create a hunt card.");

  const logo = await loadImage("/icon-512-v1631.png");
  const huntPhoto = await loadOptionalPhoto(input.photo);

  try {
    if (huntPhoto) drawCover(context, huntPhoto.image, 0, 0, canvas.width, 720);
    else {
      const background = context.createLinearGradient(0, 0, 1080, 720);
      background.addColorStop(0, "#365b42"); background.addColorStop(1, "#102e25");
      context.fillStyle = background; context.fillRect(0, 0, canvas.width, 720);
    }
    const photoGradient = context.createLinearGradient(0, 0, 0, 720);
    photoGradient.addColorStop(0, "rgba(7, 28, 22, .52)");
    photoGradient.addColorStop(.48, "rgba(7, 28, 22, .18)");
    photoGradient.addColorStop(1, "rgba(7, 28, 22, .92)");
    context.fillStyle = photoGradient;
    context.fillRect(0, 0, canvas.width, 720);

    context.drawImage(logo, 62, 48, 172, 172);
    context.textAlign = "right";
    context.fillStyle = "#d3a63f";
    context.font = "800 27px Inter, sans-serif";
    context.letterSpacing = "5px";
    context.fillText(input.isSimulation ? `TEST ${input.huntCategoryLabel.toUpperCase()} HUNT` : `MY ${input.huntCategoryLabel.toUpperCase()} HUNT`, 1016, 105);
    context.fillStyle = "#ffffff";
    context.font = "800 28px Inter, sans-serif";
    context.letterSpacing = "1px";
    context.fillText("HUNT. LOG. SHARE.", 1016, 150);
    context.textAlign = "left";

    context.fillStyle = "#ffffff";
    context.font = "800 86px 'Barlow Condensed', Impact, sans-serif";
    context.letterSpacing = "0px";
    context.fillText(clipped(input.state, 22), 66, 480);
    context.fillStyle = "#e1e6e2";
    context.font = "600 31px Inter, sans-serif";
    context.fillText(clipped(input.zone, 54), 70, 532);

    const date = input.date || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    context.fillStyle = "#d3a63f";
    context.font = "800 26px Inter, sans-serif";
    context.fillText(date.toUpperCase(), 70, 588);
    if (input.blindName) {
      context.fillStyle = "#ffffff";
      context.font = "600 25px Inter, sans-serif";
      context.fillText(clipped(input.blindName, 50), 70, 632);
    }

    context.fillStyle = "#d3a63f";
    context.fillRect(0, 700, canvas.width, 190);
    context.fillStyle = "#0d261f";
    context.font = "800 29px Inter, sans-serif";
    context.letterSpacing = "4px";
    context.fillText("TOTAL HARVEST", 72, 770);
    context.font = "800 101px 'Barlow Condensed', Impact, sans-serif";
    context.letterSpacing = "0px";
    context.textAlign = "right";
    context.fillText(String(input.totalCount), 1008, 837);
    context.textAlign = "left";
    context.font = "700 31px Inter, sans-serif";
    context.fillText(input.huntCategoryLabel === "Waterfowl" ? `${input.duckCount} ducks  •  ${input.gooseCount} geese  •  ${input.totalCount - input.duckCount - input.gooseCount} other` : `${input.totalCount} ${input.huntCategoryLabel.toLowerCase()} ${input.totalCount === 1 ? "harvest" : "harvests"}`, 72, 830);

    context.fillStyle = "#fbfaf6";
    context.fillRect(0, 890, canvas.width, 350);
    context.fillStyle = "#15372d";
    context.font = "800 51px 'Barlow Condensed', Impact, sans-serif";
    context.fillText("FIELD LOG", 72, 962);

    const displayed = input.entries.slice(0, 4);
    if (!displayed.length) {
      context.fillStyle = "#6e7772";
      context.font = "600 29px Inter, sans-serif";
      context.fillText("Zero-harvest hunt logged.", 72, 1044);
    } else {
      displayed.forEach((entry, index) => {
        const y = 1032 + index * 53;
        if (index > 0) {
          context.strokeStyle = "#ddd9ce";
          context.beginPath();
          context.moveTo(72, y - 30);
          context.lineTo(1008, y - 30);
          context.stroke();
        }
        context.fillStyle = "#1d2924";
        context.font = "650 27px Inter, sans-serif";
        context.fillText(clipped(entry.label, entry.saw === undefined ? 42 : 27), 72, y);
        context.font = entry.saw === undefined ? "800 28px Inter, sans-serif" : "750 23px Inter, sans-serif";
        context.textAlign = "right";
        context.fillText(entry.saw === undefined ? `× ${entry.count}` : `Saw ${entry.saw} • Harvested ${entry.count}`, 1008, y);
        context.textAlign = "left";
      });
    }

    if (input.entries.length > displayed.length) {
      context.fillStyle = "#6e7772"; context.font = "600 19px Inter, sans-serif";
      context.fillText(`+ ${input.entries.length - displayed.length} more species in my logbook`, 72, 1225);
    }
    context.fillStyle = "#0d261f";
    context.fillRect(0, 1240, canvas.width, 110);
    context.fillStyle = "#d8c6a2";
    context.font = "700 24px Inter, sans-serif";
    context.fillText(input.firearmUsed ? clipped(input.firearmUsed, 38) : `DIGITAL ${input.huntCategoryLabel.toUpperCase()} FIELD LOG`, 64, 1307);
    context.fillStyle = "#d3a63f";
    context.font = "800 25px Inter, sans-serif";
    context.textAlign = "right";
    context.fillText("BLINDIQ.APP", 1016, 1307);
    context.textAlign = "left";

    const blob = await canvasBlob(canvas);
    const dateStamp = new Date().toISOString().slice(0, 10);
    return new File([blob], `blindiq-${safeFileName(input.state)}-${safeFileName(input.huntCategoryLabel)}-${safeFileName(input.date || dateStamp)}.png`, { type: "image/png" });
  } finally {
    huntPhoto?.release();
  }
}

export function downloadHuntShareFile(file: File) {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function huntShareCaption(input: HuntShareInput) {
  const hasSightings = input.entries.every(entry => entry.saw !== undefined);
  const sightings = input.entries.reduce((sum, entry) => sum + (entry.saw ?? 0), 0);
  return [
    `${input.isSimulation ? "Practice" : "My"} ${input.state} ${input.huntCategoryLabel.toLowerCase()} hunt${input.date ? ` · ${input.date}` : ""}`,
    `${hasSightings ? `Saw ${sightings} · ` : ""}Harvested ${input.totalCount}`,
    "Hunt. Log. Share. #BlindIQ",
    "https://blindiq.app",
  ].join("\n");
}

export function canShareHuntFile(file: File) {
  try { return typeof navigator !== "undefined" && typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }); }
  catch { return false; }
}

// Invoke immediately from a fresh user click. Preparation must finish beforehand.
// Files-only data keeps image targets available; captions are copied separately.
export function shareHuntFile(file: File) {
  if (!canShareHuntFile(file)) return Promise.reject(new Error("This browser cannot share images to apps. Save the image and attach it in your social app."));
  return navigator.share({ files: [file] });
}
