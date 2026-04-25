-- AlterTable
ALTER TABLE "client_social_accounts" ADD COLUMN "telegram_chats" JSONB;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "telegram_chat_target_ids" JSONB;

-- Перенос одного legacy-чата в массив целей
UPDATE "client_social_accounts"
SET "telegram_chats" = jsonb_build_array(
  jsonb_build_object(
    'id', replace(gen_random_uuid()::text, '-', ''),
    'name', 'Основной',
    'chatId', trim(both from "telegram_chat_id")
  )
)
WHERE "platform" = 'telegram'
  AND "telegram_chat_id" IS NOT NULL
  AND trim(both from "telegram_chat_id") <> '';

-- Для существующих постов Telegram — первый чат из списка целей аккаунта
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
WHERE EXISTS (
  SELECT 1
  FROM "client_social_accounts" AS csa
  WHERE csa."id" = p."client_social_account_id"
    AND csa."platform" = 'telegram'
);
