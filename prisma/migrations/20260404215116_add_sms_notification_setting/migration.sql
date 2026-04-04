/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `notification_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "notification_settings" ADD COLUMN     "sms_notifications" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");
