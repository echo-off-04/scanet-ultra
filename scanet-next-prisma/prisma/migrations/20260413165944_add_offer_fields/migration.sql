-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BillingType" ADD VALUE 'hourly';
ALTER TYPE "BillingType" ADD VALUE 'daily';
ALTER TYPE "BillingType" ADD VALUE 'fixed';
ALTER TYPE "BillingType" ADD VALUE 'unit';

-- AlterTable
ALTER TABLE "offer_packs" ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "daily_rate" DOUBLE PRECISION,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "estimated_days" DOUBLE PRECISION,
ADD COLUMN     "estimated_hours" DOUBLE PRECISION,
ADD COLUMN     "hourly_rate" DOUBLE PRECISION,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "unit_price" DOUBLE PRECISION,
ALTER COLUMN "price" DROP NOT NULL;
