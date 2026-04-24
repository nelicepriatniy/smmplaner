import type { StaticImageData } from "next/image";
import logo from "@/assets/img/logo.svg";

function importedImageUrl(mod: string | StaticImageData): string {
  return typeof mod === "string" ? mod : mod.src;
}

export function LogoMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG из ассетов, src из StaticImageData
    <img
      src={importedImageUrl(logo)}
      alt=""
      width={36}
      height={36}
      className="size-9 shrink-0 object-contain"
    />
  );
}
