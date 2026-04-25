export function extForMime(mime: string): string | null {
  const m = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!m || m === "application/octet-stream") return null;
  if (m === "image/jpeg" || m === "image/jpg" || m === "image/pjpeg") return ".jpg";
  if (m === "image/png" || m === "image/x-png") return ".png";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  if (m === "image/avif") return ".avif";
  if (m === "image/heic" || m === "image/heif") return ".heic";
  if (m === "image/bmp" || m === "image/x-ms-bmp") return ".bmp";
  if (m === "image/tiff" || m === "image/x-tiff") return ".tiff";
  if (m === "image/svg+xml") return ".svg";
  if (m.startsWith("image/")) return null;
  return null;
}

export function extFromFileName(fileName: string): string | null {
  const base = fileName.split(/[/\\]/).pop() ?? "";
  const i = base.lastIndexOf(".");
  if (i <= 0) return null;
  const ext = base.slice(i).toLowerCase();
  if (
    !/^\.(jpe?g|png|gif|webp|avif|heic|heif|svg|bmp|tiff?|x-ms-bmp)$/i.test(ext)
  ) {
    return null;
  }
  if (ext === ".jpeg" || ext === ".jpe") return ".jpg";
  if (ext === ".tif") return ".tiff";
  return ext;
}

export function extFromBuffer(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return ".png";
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return ".gif";
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }
  if (buf.length >= 12 && buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii").replace(/\0/g, "");
    if (/avif|avis/i.test(brand)) return ".avif";
    if (/heic|heix|hevc|heim|heis|mif1|msf1/i.test(brand)) return ".heic";
  }
  if (buf.subarray(0, 2).toString("ascii") === "BM") return ".bmp";
  return null;
}

export function pickImageExtension(file: File, buf: Buffer): string {
  const fromMime = extForMime(file.type);
  if (fromMime) return fromMime;
  const fromName = extFromFileName(file.name);
  if (fromName) return fromName;
  const fromMagic = extFromBuffer(buf);
  if (fromMagic) return fromMagic;
  if (file.type.trim().toLowerCase().startsWith("image/")) return ".jpg";
  return ".jpg";
}

export function mimeFromImageExt(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".heic":
    case ".heif":
      return "image/heic";
    case ".bmp":
      return "image/bmp";
    case ".tiff":
    case ".tif":
      return "image/tiff";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}
