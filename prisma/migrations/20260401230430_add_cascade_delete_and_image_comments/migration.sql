-- DropForeignKey
ALTER TABLE "business_images" DROP CONSTRAINT "business_images_business_id_fkey";

-- AddForeignKey
ALTER TABLE "business_images" ADD CONSTRAINT "business_images_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
