-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_staff_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "staff_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
