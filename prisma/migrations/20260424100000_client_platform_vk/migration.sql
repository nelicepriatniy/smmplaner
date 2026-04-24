-- AlterEnum
ALTER TYPE "ClientPlatform" ADD VALUE 'vk';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "vk_access_token" TEXT,
ADD COLUMN     "vk_owner_id" TEXT,
ADD COLUMN     "vk_from_group" BOOLEAN NOT NULL DEFAULT false;
