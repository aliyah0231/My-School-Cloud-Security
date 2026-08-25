-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "dudi_signature" TEXT,
ADD COLUMN     "dudi_signed_at" TIMESTAMP(3),
ADD COLUMN     "dudi_signed_by" UUID,
ADD COLUMN     "dudi_signed_hash" CHAR(64),
ADD COLUMN     "dudi_wallet_address" VARCHAR(100);
