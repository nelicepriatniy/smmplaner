import type { ClientPlatform } from "@/domain/smm";

const ASSET_PATH: Record<ClientPlatform, string> = {
  instagram: "/assets/icons/instagramLogo.svg",
  vk: "/assets/icons/VKLogo.svg",
  telegram: "/assets/icons/telegramLogo.svg",
};

type SocialPlatformIconProps = {
  platform: ClientPlatform;
  className?: string;
  title?: string;
};

/**
 * Иконка площадки из `public/assets/icons/`.
 * Декоративный `img`: подпись смысла — в соседнем тексте или `title` для всплывашки.
 */
export function SocialPlatformIcon({
  platform,
  className = "size-[1.125rem] shrink-0",
  title,
}: SocialPlatformIconProps) {
  return (
    <img
      src={ASSET_PATH[platform]}
      alt=""
      title={title}
      draggable={false}
      className={`object-contain ${className}`.trim()}
    />
  );
}
