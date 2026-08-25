-- AlterTable
ALTER TABLE "transcripts" ADD COLUMN     "blockchain_hash" CHAR(64),
ADD COLUMN     "blockchain_registered_at" TIMESTAMP(3),
ADD COLUMN     "blockchain_tx_hash" VARCHAR(100);
