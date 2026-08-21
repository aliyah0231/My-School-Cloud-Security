import { z } from "zod";

export const createStudentSchema = z.object({
  userId: z.string().uuid().optional(),
  studentNumber: z.string().min(1).max(30),
  fullName: z.string().min(1).max(150),
  gender: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  birthPlace: z.string().max(100).optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
  phone: z.string().max(30).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();