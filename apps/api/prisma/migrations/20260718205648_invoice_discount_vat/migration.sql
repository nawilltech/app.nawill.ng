-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "discountMinor" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatRate" DOUBLE PRECISION;
