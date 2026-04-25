-- Посты Telegram, у которых после внедрения multi-chat так и остался NULL
-- (миграция не применялась или пост создан до backfill).
UPDATE "posts" AS p
SET "telegram_chat_target_ids" = (
  SELECT jsonb_build_array((csa."telegram_chats"->0->>'id'))
  FROM "client_social_accounts" AS csa
  WHERE csa."id" = p."client_social_account_id"
    AND csa."platform" = 'telegram'
    AND csa."telegram_chats" IS NOT NULL
    AND jsonb_typeof(csa."telegram_chats") = 'array'
    AND jsonb_array_length(csa."telegram_chats") > 0
)
WHERE p."telegram_chat_target_ids" IS NULL
  AND EXISTS (
    SELECT 1
    FROM "client_social_accounts" AS csa
    WHERE csa."id" = p."client_social_account_id"
      AND csa."platform" = 'telegram'
      AND csa."telegram_chats" IS NOT NULL
      AND jsonb_typeof(csa."telegram_chats") = 'array'
      AND jsonb_array_length(csa."telegram_chats") > 0
  );
