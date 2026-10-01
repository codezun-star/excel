/**
 * Utilidades para imágenes en base64 (logos). Se leen las dimensiones del
 * encabezado PNG/JPEG para conservar la proporción al insertarlas en Excel,
 * tanto en el navegador como en el servidor.
 */

export interface ParsedImage {
  base64: string;
  extension: "png" | "jpeg";
  width: number;
  height: number;
}

const DATA_URL_RE = /^data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)$/;

function decodeBase64(b64: string, maxBytes: number): Uint8Array {
  const slice = b64.slice(0, Math.ceil((maxBytes * 4) / 3) + 4);
  const clean = slice.slice(0, slice.length - (slice.length % 4));
  if (typeof atob === "function") {
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(clean, "base64"));
}

function pngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24 || bytes[0] !== 0x89 || bytes[1] !== 0x50) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = bytes[i + 1]!;
    const len = (bytes[i + 2]! << 8) | bytes[i + 3]!;
    // SOF0..SOF15 excepto DHT(C4), JPG(C8) y DAC(CC)
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return {
        height: (bytes[i + 5]! << 8) | bytes[i + 6]!,
        width: (bytes[i + 7]! << 8) | bytes[i + 8]!,
      };
    }
    i += 2 + len;
  }
  return null;
}

export function parseImageDataUrl(dataUrl: string | null | undefined): ParsedImage | null {
  if (!dataUrl) return null;
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) return null;
  const extension = m[1] === "png" ? "png" : "jpeg";
  const b64 = m[2]!;
  // Para JPEG el marcador SOF puede estar lejos del inicio: leemos hasta 64 KB.
  const bytes = decodeBase64(b64, extension === "png" ? 64 : 65536);
  const size = extension === "png" ? pngSize(bytes) : jpegSize(bytes);
  if (!size || size.width <= 0 || size.height <= 0) return null;
  return { base64: dataUrl, extension, ...size };
}

/** Ajusta (sin deformar) a un rectángulo máximo. */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
