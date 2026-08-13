import type { HarvestEntry } from "./types";

export type HuntShareInput = {
  state: string;
  zone: string;
  entries: HarvestEntry[];
  duckCount: number;
  gooseCount: number;
  isSimulation: boolean;
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The BlindIQ share image could not be prepared."));
    image.src = src;
  });
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The hunt card could not be created.")), "image/png", 0.94);
  });
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createHuntShareFile(input: HuntShareInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot create a hunt card.");

  const [background, logo] = await Promise.all([
    loadImage("/duck-home-page.png"),
    loadImage("/blindiq-logo.png"),
  ]);

  const backgroundRatio = Math.max(canvas.width / background.width, canvas.height / background.height);
  const backgroundWidth = background.width * backgroundRatio;
  const backgroundHeight = background.height * backgroundRatio;
  context.drawImage(background, (canvas.width - backgroundWidth) / 2, (canvas.height - backgroundHeight) / 2, backgroundWidth, backgroundHeight);
  context.fillStyle = "rgba(9, 38, 31, .82)";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.drawImage(logo, 72, 58, 190, 190);
  context.fillStyle = "#d3a63f";
  context.font = "800 28px Inter, sans-serif";
  context.letterSpacing = "6px";
  context.fillText(input.isSimulation ? "TEST HUNT SUMMARY" : "HUNT SUMMARY", 300, 126);
  context.fillStyle = "#ffffff";
  context.font = "800 72px 'Barlow Condensed', Impact, sans-serif";
  context.fillText(input.state, 300, 198);
  context.fillStyle = "#d7ded9";
  context.font = "500 29px Inter, sans-serif";
  context.fillText(input.zone, 300, 240);

  context.fillStyle = "#d3a63f";
  context.fillRect(72, 290, 936, 235);
  context.fillStyle = "#0d261f";
  context.font = "800 30px Inter, sans-serif";
  context.fillText("TOTAL HARVEST", 120, 365);
  context.font = "800 116px 'Barlow Condensed', Impact, sans-serif";
  context.fillText(String(input.duckCount + input.gooseCount), 805, 452);
  context.font = "600 32px Inter, sans-serif";
  context.fillText(`${input.duckCount} ducks  •  ${input.gooseCount} geese`, 120, 448);

  context.fillStyle = "rgba(251, 250, 246, .96)";
  context.fillRect(72, 570, 936, 600);
  context.fillStyle = "#15372d";
  context.font = "800 53px 'Barlow Condensed', Impact, sans-serif";
  context.fillText("TODAY’S HARVEST", 120, 650);

  const displayed = input.entries.slice(0, 7);
  if (!displayed.length) {
    context.fillStyle = "#6e7772";
    context.font = "500 31px Inter, sans-serif";
    context.fillText("Zero-bird hunt logged.", 120, 735);
  } else {
    displayed.forEach((entry, index) => {
      const y = 735 + index * 62;
      context.strokeStyle = "#ddd9ce";
      context.beginPath();
      context.moveTo(120, y + 24);
      context.lineTo(960, y + 24);
      context.stroke();
      context.fillStyle = "#1d2924";
      context.font = "600 29px Inter, sans-serif";
      const label = entry.label.length > 38 ? `${entry.label.slice(0, 36)}…` : entry.label;
      context.fillText(label, 120, y);
      context.font = "800 30px Inter, sans-serif";
      context.textAlign = "right";
      context.fillText(`× ${entry.count}`, 960, y);
      context.textAlign = "left";
    });
    if (input.entries.length > displayed.length) {
      context.fillStyle = "#6e7772";
      context.font = "600 24px Inter, sans-serif";
      context.fillText(`+ ${input.entries.length - displayed.length} more species`, 120, 1130);
    }
  }

  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  context.fillStyle = "#ffffff";
  context.font = "600 27px Inter, sans-serif";
  context.fillText(date, 72, 1247);
  context.fillStyle = "#d3a63f";
  context.font = "800 27px Inter, sans-serif";
  context.textAlign = "right";
  context.fillText("BLINDIQ.APP  •  HUNT WITH CONFIDENCE", 1008, 1247);
  context.textAlign = "left";

  const blob = await canvasBlob(canvas);
  const dateStamp = new Date().toISOString().slice(0, 10);
  return new File([blob], `blindiq-${safeFileName(input.state)}-hunt-${dateStamp}.png`, { type: "image/png" });
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

export async function shareHuntFile(file: File, input: HuntShareInput) {
  const data: ShareData = {
    title: `My ${input.state} hunt — BlindIQ`,
    text: `${input.duckCount + input.gooseCount} birds logged with BlindIQ. Hunt with confidence.`,
    files: [file],
  };
  if (navigator.share && navigator.canShare?.(data)) {
    await navigator.share(data);
    return "shared" as const;
  }
  downloadHuntShareFile(file);
  return "downloaded" as const;
}

