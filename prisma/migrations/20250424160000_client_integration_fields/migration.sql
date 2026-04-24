-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "contact" TEXT,
ADD COLUMN     "instagram_business_id" TEXT,
ADD COLUMN     "facebook_page_id" TEXT,
ADD COLUMN     "page_access_token" TEXT,
ADD COLUMN     "business_account_confirmed" BOOLEAN NOT NULL DEFAULT false;
