const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("This photo format could not be opened. Try taking a new photo or choosing a JPEG image."));
    };
    image.src = objectUrl;
  });
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("This photo could not be prepared. Please try a different image."));
    }, "image/jpeg", quality);
  });
}

export async function prepareHuntPhoto(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Choose a photo from your camera or photo library.");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("That photo is too large. Choose an image smaller than 20 MB.");

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not prepare this photo. Please try again.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let prepared = await canvasToJpeg(canvas, 0.82);
  if (prepared.size > MAX_OUTPUT_BYTES) prepared = await canvasToJpeg(canvas, 0.65);
  if (prepared.size > MAX_OUTPUT_BYTES) throw new Error("That photo is still too large after preparation. Choose a smaller image.");
  return prepared;
}
