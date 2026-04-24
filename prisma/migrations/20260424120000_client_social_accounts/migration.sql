-- CreateTable
CREATE TABLE "client_social_accounts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "platform" "ClientPlatform" NOT NULL,
    "instagram_username" TEXT NOT NULL DEFAULT '',
    "instagram_business_id" TEXT,
    "facebook_page_id" TEXT,
    "page_access_token" TEXT,
    "business_account_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "telegram_bot_token" TEXT,
    "telegram_chat_id" TEXT,
    "vk_access_token" TEXT,
    "vk_owner_id" TEXT,
    "vk_from_group" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_social_accounts_pkey" PRIMARY KEY ("id")
);

-- One row per existing client (credentials lived on clients)
INSERT INTO "client_social_accounts" (
    "id",
    "client_id",
    "platform",
    "instagram_username",
    "instagram_business_id",
    "facebook_page_id",
    "page_access_token",
    "business_account_confirmed",
    "telegram_bot_token",
    "telegram_chat_id",
    "vk_access_token",
    "vk_owner_id",
    "vk_from_group",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    "id",
    "platform",
    COALESCE("instagram_username", ''),
    "instagram_business_id",
    "facebook_page_id",
    "page_access_token",
    "business_account_confirmed",
    "telegram_bot_token",
    "telegram_chat_id",
    "vk_access_token",
    "vk_owner_id",
    "vk_from_group",
    "created_at",
    "updated_at"
FROM "clients";

CREATE INDEX "client_social_accounts_client_id_idx" ON "client_social_accounts"("client_id");

ALTER TABLE "client_social_accounts" ADD CONSTRAINT "client_social_accounts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Link posts to migrated social accounts
ALTER TABLE "posts" ADD COLUMN "client_social_account_id" TEXT;

UPDATE "posts" AS p
SET "client_social_account_id" = csa."id"
FROM "client_social_accounts" AS csa
WHERE csa."client_id" = p."client_id";

ALTER TABLE "posts" ALTER COLUMN "client_social_account_id" SET NOT NULL;

ALTER TABLE "posts" DROP CONSTRAINT "posts_client_id_fkey";
ALTER TABLE "posts" DROP COLUMN "client_id";

ALTER TABLE "posts" ADD CONSTRAINT "posts_client_social_account_id_fkey" FOREIGN KEY ("client_social_account_id") REFERENCES "client_social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "posts_client_social_account_id_idx" ON "posts"("client_social_account_id");

-- Strip integration fields from clients (identity + spheres only)
ALTER TABLE "clients" DROP COLUMN "platform";
ALTER TABLE "clients" DROP COLUMN "instagram_username";
ALTER TABLE "clients" DROP COLUMN "instagram_business_id";
ALTER TABLE "clients" DROP COLUMN "facebook_page_id";
ALTER TABLE "clients" DROP COLUMN "page_access_token";
ALTER TABLE "clients" DROP COLUMN "business_account_confirmed";
ALTER TABLE "clients" DROP COLUMN "telegram_bot_token";
ALTER TABLE "clients" DROP COLUMN "telegram_chat_id";
ALTER TABLE "clients" DROP COLUMN "vk_access_token";
ALTER TABLE "clients" DROP COLUMN "vk_owner_id";
ALTER TABLE "clients" DROP COLUMN "vk_from_group";
