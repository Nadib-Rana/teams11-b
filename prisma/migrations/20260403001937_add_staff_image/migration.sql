-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "image" TEXT;
