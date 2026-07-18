-- CreateEnum
CREATE TYPE "TwoFactorMethod" AS ENUM ('none', 'email', 'totp');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorMethod" "TwoFactorMethod" NOT NULL DEFAULT 'none',
ADD COLUMN     "twoFactorSecret" TEXT;
