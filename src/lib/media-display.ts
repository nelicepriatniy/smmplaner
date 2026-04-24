/** Локальные загрузки в public — для next/image без оптимизации (нестандартные расширения, .bin и т.д.). */
export function isPublicUploadImageSrc(src: string): boolean {
  const s = src.trim();
  return s.startsWith("/uploads/");
}
