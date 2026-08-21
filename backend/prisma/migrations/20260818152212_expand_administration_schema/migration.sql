/*
  Warnings:

  - The `gender` column on the `students` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- CreateEnum
CREATE TYPE "GraduationStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'VALID', 'INVALID');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('DIPLOMA', 'PKL_CERTIFICATE', 'INTERNSHIP_CERTIFICATE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VALID', 'INVALID', 'FALSIFIED');

-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "status",
ADD COLUMN     "status" "AuditStatus" NOT NULL;

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "teacher_id" UUID;

-- AlterTable
ALTER TABLE "students" DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "class_members" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "semester" INTEGER NOT NULL,
    "assignment" DECIMAL(5,2),
    "midterm" DECIMAL(5,2),
    "final_exam" DECIMAL(5,2),
    "final_score" DECIMAL(5,2),
    "status" "GradeStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcripts" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "transcript_code" VARCHAR(100) NOT NULL,
    "total_credits" INTEGER NOT NULL DEFAULT 0,
    "average_score" DECIMAL(5,2),
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graduations" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "status" "GraduationStatus" NOT NULL DEFAULT 'PENDING',
    "final_average" DECIMAL(5,2),
    "decision_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graduations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diplomas" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "document_number" VARCHAR(100) NOT NULL,
    "verification_code" VARCHAR(100) NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_hash" CHAR(64) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diplomas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "document_number" VARCHAR(100) NOT NULL,
    "verification_code" VARCHAR(100) NOT NULL,
    "document_name" VARCHAR(255) NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_hash" CHAR(64) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "institution_name" VARCHAR(200),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_records" (
    "id" UUID NOT NULL,
    "verification_code" VARCHAR(100) NOT NULL,
    "diploma_id" UUID,
    "certificate_id" UUID,
    "submitted_hash" CHAR(64),
    "stored_hash" CHAR(64),
    "status" "VerificationStatus" NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_members_student_id_idx" ON "class_members"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_members_class_id_student_id_key" ON "class_members"("class_id", "student_id");

-- CreateIndex
CREATE INDEX "teacher_subjects_subject_id_idx" ON "teacher_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacher_id_subject_id_key" ON "teacher_subjects"("teacher_id", "subject_id");

-- CreateIndex
CREATE INDEX "grades_student_id_idx" ON "grades"("student_id");

-- CreateIndex
CREATE INDEX "grades_subject_id_idx" ON "grades"("subject_id");

-- CreateIndex
CREATE INDEX "grades_teacher_id_idx" ON "grades"("teacher_id");

-- CreateIndex
CREATE INDEX "grades_academic_year_semester_idx" ON "grades"("academic_year", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "grades_student_id_subject_id_academic_year_semester_key" ON "grades"("student_id", "subject_id", "academic_year", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_student_id_key" ON "transcripts"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "transcripts_transcript_code_key" ON "transcripts"("transcript_code");

-- CreateIndex
CREATE UNIQUE INDEX "graduations_student_id_key" ON "graduations"("student_id");

-- CreateIndex
CREATE INDEX "graduations_graduation_year_idx" ON "graduations"("graduation_year");

-- CreateIndex
CREATE INDEX "graduations_status_idx" ON "graduations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_document_number_key" ON "diplomas"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_verification_code_key" ON "diplomas"("verification_code");

-- CreateIndex
CREATE UNIQUE INDEX "diplomas_file_hash_key" ON "diplomas"("file_hash");

-- CreateIndex
CREATE INDEX "diplomas_student_id_idx" ON "diplomas"("student_id");

-- CreateIndex
CREATE INDEX "diplomas_verification_code_idx" ON "diplomas"("verification_code");

-- CreateIndex
CREATE INDEX "diplomas_status_idx" ON "diplomas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_document_number_key" ON "certificates"("document_number");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verification_code_key" ON "certificates"("verification_code");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_file_hash_key" ON "certificates"("file_hash");

-- CreateIndex
CREATE INDEX "certificates_student_id_idx" ON "certificates"("student_id");

-- CreateIndex
CREATE INDEX "certificates_verification_code_idx" ON "certificates"("verification_code");

-- CreateIndex
CREATE INDEX "certificates_status_idx" ON "certificates"("status");

-- CreateIndex
CREATE INDEX "verification_records_verification_code_idx" ON "verification_records"("verification_code");

-- CreateIndex
CREATE INDEX "verification_records_status_idx" ON "verification_records"("status");

-- CreateIndex
CREATE INDEX "verification_records_verified_at_idx" ON "verification_records"("verified_at");

-- CreateIndex
CREATE INDEX "audit_logs_role_idx" ON "audit_logs"("role");

-- CreateIndex
CREATE INDEX "classes_teacher_id_idx" ON "classes"("teacher_id");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graduations" ADD CONSTRAINT "graduations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diplomas" ADD CONSTRAINT "diplomas_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_diploma_id_fkey" FOREIGN KEY ("diploma_id") REFERENCES "diplomas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
