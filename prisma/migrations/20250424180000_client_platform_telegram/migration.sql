-- CreateEnum
CREATE TYPE "ClientPlatform" AS ENUM ('instagram', 'telegram');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "platform" "ClientPlatform" NOT NULL DEFAULT 'instagram',
ADD COLUMN     "telegram_bot_id" TEXT,
ADD COLUMN     "telegram_chat_id" TEXT;
