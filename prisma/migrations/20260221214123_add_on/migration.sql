-- CreateEnum
CREATE TYPE "type" AS ENUM ('DAILY', 'STREAK', 'ONE_TIME');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_xp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "missions" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "requirement_count" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'DAILY',

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mission_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mission_id" UUID NOT NULL,
    "current_count" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_mission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "user_id" UUID NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_login_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "itemType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "missions_slug_key" ON "missions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_mission_progress_user_id_mission_id_key" ON "user_mission_progress"("user_id", "mission_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_inventory_user_id_itemType_key" ON "user_inventory"("user_id", "itemType");

-- AddForeignKey
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
