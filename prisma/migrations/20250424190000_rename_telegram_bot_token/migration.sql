-- AlterTable: храним полный токен бота, а не только id
ALTER TABLE "clients" RENAME COLUMN "telegram_bot_id" TO "telegram_bot_token";
