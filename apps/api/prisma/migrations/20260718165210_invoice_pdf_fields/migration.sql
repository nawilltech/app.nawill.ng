-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "period" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "notes" TEXT;
