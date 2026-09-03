/** Generous ceiling on what we'll even try to decode — a 50MP file can run a
 *  low-end phone out of memory. The upload itself ends up ~50 KB. */
export const AVATAR_MAX_BYTES = 30 * 1024 * 1024;

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.85;

type Decoded = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
};

async function decodeImage(file: Blob): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      // "from-image" applies the EXIF rotation phone cameras write. Without it
      // portrait shots come out lying on their side.
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Older browsers reject the options bag — fall back to an <img>.
    }
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  await image.decode();
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

/**
 * Scales the image down so its longest side is at most AVATAR_SIZE.
 *
 * Avatars render at ~44px. Uploading a phone's original 12MP photo would ship
 * roughly fifty times more bytes than anyone ever sees — paid for on every
 * view, by every viewer. Shrinking here also means the gallery picker stops
 * being a lottery about file size.
 *
 * Deliberately does NOT crop. The circular avatar already centre-crops at
 * render time via `object-cover`, so cropping here would look identical today
 * but would throw the edges away for good — and any future use that wants the
 * whole picture could never get it back.
 */
export async function prepareAvatar(file: Blob): Promise<Blob> {
  const decoded = await decodeImage(file);
  try {
    const longest = Math.max(decoded.width, decoded.height);
    if (!longest) throw new Error("Image has no dimensions.");

    // Never upscale: a small picture stays at its own size.
    const scale = Math.min(1, AVATAR_SIZE / longest);
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas is not available.");

    context.drawImage(decoded.source, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", AVATAR_QUALITY),
    );
    if (!blob) throw new Error("Could not encode the image.");
    return blob;
  } finally {
    decoded.release();
  }
}
