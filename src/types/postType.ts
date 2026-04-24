/**
 * Вид публикации в Instagram (и логика предпросмотра).
 */
export type PostType = "feed" | "photo" | "reels" | "stories";

export const POST_TYPE_OPTIONS: {
  value: PostType;
  label: string;
  description: string;
}[] = [
  {
    value: "feed",
    label: "Обычный пост",
    description: "Публикация в ленте: карусель, сочетание форматов.",
  },
  {
    value: "photo",
    label: "Фото",
    description: "Акцент на статичном кадре в ленте (1:1).",
  },
  {
    value: "reels",
    label: "Рилс",
    description: "Короткое вертикальное видео 9:16.",
  },
  {
    value: "stories",
    label: "Сторис",
    description: "Исчезающий контент 9:16 (24 ч).",
  },
];

export function isFeedLikePostType(t: PostType): t is "feed" | "photo" {
  return t === "feed" || t === "photo";
}
