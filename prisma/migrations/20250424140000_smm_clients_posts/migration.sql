-- CreateEnum
CREATE TYPE "PostDraftStatus" AS ENUM ('draft', 'in_review', 'scheduled', 'published', 'rejected');

-- CreateEnum
CREATE TYPE "PostContentType" AS ENUM ('feed', 'photo', 'reels', 'stories');

-- CreateEnum
CREATE TYPE "ReviewCommentSide" AS ENUM ('self', 'client');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('client_comment', 'client_approval', 'client_rejection', 'post_published', 'client_added', 'post_scheduled');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "instagram_username" TEXT NOT NULL,
    "activity_spheres" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" "PostDraftStatus" NOT NULL,
    "post_type" "PostContentType" NOT NULL,
    "caption" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "first_comment" TEXT NOT NULL DEFAULT '',
    "alt_text" TEXT NOT NULL DEFAULT '',
    "image_urls" JSONB NOT NULL,
    "publish_date" TEXT NOT NULL,
    "publish_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "client_review_token" TEXT NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_review_comments" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "side" "ReviewCommentSide" NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_review_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "kind" "ActivityKind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "client_id" TEXT,
    "post_id" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_user_id_idx" ON "clients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "posts_client_review_token_key" ON "posts"("client_review_token");

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- CreateIndex
CREATE INDEX "posts_client_id_idx" ON "posts"("client_id");

-- CreateIndex
CREATE INDEX "posts_user_id_publish_date_idx" ON "posts"("user_id", "publish_date");

-- CreateIndex
CREATE INDEX "post_review_comments_post_id_idx" ON "post_review_comments"("post_id");

-- CreateIndex
CREATE INDEX "activities_user_id_created_at_idx" ON "activities"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_review_comments" ADD CONSTRAINT "post_review_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
