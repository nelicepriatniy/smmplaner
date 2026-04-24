import { useId } from "react";
import type { ClientPlatform } from "@/domain/smm";

type SocialPlatformIconProps = {
  platform: ClientPlatform;
  className?: string;
  title?: string;
};

/** Узнаваемые маркеры платформ (упрощённые SVG). */
export function SocialPlatformIcon({
  platform,
  className = "size-[1.125rem] shrink-0",
  title,
}: SocialPlatformIconProps) {
  const igGradId = `ig-${useId().replace(/:/g, "")}`;
  const common = `${className} overflow-visible`;
  if (platform === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        aria-label={title}
      >
        {title ? <title>{title}</title> : null}
        <defs>
          <linearGradient id={igGradId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f58529" />
            <stop offset="50%" stopColor="#dd2a7b" />
            <stop offset="100%" stopColor="#8134af" />
          </linearGradient>
        </defs>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke={`url(#${igGradId})`}
          strokeWidth="2"
        />
        <circle cx="12" cy="12" r="4" stroke={`url(#${igGradId})`} strokeWidth="2" />
        <circle cx="17.5" cy="6.5" r="1.2" fill={`url(#${igGradId})`} />
      </svg>
    );
  }
  if (platform === "telegram") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={common}
        fill="none"
        aria-hidden={title ? undefined : true}
        role={title ? "img" : undefined}
        aria-label={title}
      >
        {title ? <title>{title}</title> : null}
        <circle cx="12" cy="12" r="10" fill="#2AABEE" />
        <path
          d="M17.3 7.2 10.5 12.6 7.8 11.4c-.5-.2-.5-.5-.1-.7l12.8-4.9c.4-.2.8.1.6.5l-2.2 10.4c-.1.5-.4.6-.8.4l-3-2.2-2.3 2.2c-.2.2-.5.2-.7 0l-.4-3.5z"
          fill="#fff"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={common}
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#07F" />
      <path
        d="M13.1 16.5h2.2l.9-4.6c.1-.4-.1-.6-.4-.7l-6.8-2.5c-.4-.15-.6 0-.7.4l-1.1 5.4h2.1l.5-2.8 4.3 1.6z"
        fill="#fff"
      />
    </svg>
  );
}
