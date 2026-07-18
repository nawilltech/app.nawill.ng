-- AlterTable
ALTER TABLE "countries" ADD COLUMN     "capital" TEXT,
ADD COLUMN     "currencyName" TEXT,
ADD COLUMN     "currencySymbol" TEXT,
ADD COLUMN     "iso3" TEXT NOT NULL,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "subregion" TEXT;

-- CreateTable
CREATE TABLE "administrative_divisions" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "countryId" TEXT NOT NULL,
    "parentId" TEXT,
    "tier" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capital" TEXT,
    "code" TEXT,

    CONSTRAINT "administrative_divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "administrative_divisions_countryId_tier_idx" ON "administrative_divisions"("countryId", "tier");

-- CreateIndex
CREATE INDEX "administrative_divisions_parentId_idx" ON "administrative_divisions"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "administrative_divisions_countryId_parentId_name_key" ON "administrative_divisions"("countryId", "parentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_userId_bankCode_accountNumber_key" ON "bank_accounts"("userId", "bankCode", "accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "countries_iso3_key" ON "countries"("iso3");

-- AddForeignKey
ALTER TABLE "administrative_divisions" ADD CONSTRAINT "administrative_divisions_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_divisions" ADD CONSTRAINT "administrative_divisions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "administrative_divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

