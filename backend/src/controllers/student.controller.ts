import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";
import {
  createStudentSchema,
  updateStudentSchema,
} from "../validators/student.validator.js";

export async function getMyStudentProfile(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication diperlukan.",
      });
      return;
    }

    const student = await prisma.student.findUnique({
      where: {
        userId: req.user.id,
      },
      select: {
        id: true,
        studentNumber: true,
        fullName: true,
        gender: true,
        birthPlace: true,
        birthDate: true,
        address: true,
        phone: true,
        graduationYear: true,
        classMembers: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                major: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Data siswa tidak ditemukan.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        student,
      },
    });
  } catch (error) {
    console.error("[ERROR] getMyStudentProfile:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}

export async function listStudents(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const students = await prisma.student.findMany({
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        studentNumber: true,
        fullName: true,
        gender: true,
        birthPlace: true,
        birthDate: true,
        phone: true,
        graduationYear: true,
        classMembers: {
          select: {
            class: {
              select: {
                id: true,
                name: true,
                major: true,
                academicYear: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("[ERROR] listStudents:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data siswa.",
    });
  }
}

export async function getStudentById(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: {
        id: String(req.params.id),
      },
      include: {
        classMembers: {
          include: {
            class: true,
          },
        },
        grades: {
          include: {
            subject: true,
          },
        },
        transcript: true,
        graduation: true,
        diplomas: true,
        certificates: true,
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Siswa tidak ditemukan.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("[ERROR] getStudentById:", error);

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data siswa.",
    });
  }
}

export async function createStudent(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const result = createStudentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Data siswa tidak valid.",
        errors: result.error.flatten(),
      });
      return;
    }

const data = {
  studentNumber: result.data.studentNumber,
  fullName: result.data.fullName,
  ...(result.data.gender !== undefined
    ? { gender: result.data.gender }
    : {}),
  ...(result.data.birthPlace !== undefined
    ? { birthPlace: result.data.birthPlace }
    : {}),
  ...(result.data.birthDate !== undefined
    ? { birthDate: result.data.birthDate }
    : {}),
  ...(result.data.address !== undefined
    ? { address: result.data.address }
    : {}),
  ...(result.data.phone !== undefined
    ? { phone: result.data.phone }
    : {}),
  ...(result.data.graduationYear !== undefined
    ? { graduationYear: result.data.graduationYear }
    : {}),
};

const student = await prisma.student.create({
  data: {
    ...data,
    ...(result.data.userId !== undefined
      ? {
          user: {
            connect: {
              id: result.data.userId,
            },
          },
        }
      : {}),
  },
});

    res.status(201).json({
      success: true,
      message: "Data siswa berhasil dibuat.",
      data: student,
    });
  } catch (error) {
    console.error("[ERROR] createStudent:", error);

    res.status(500).json({
      success: false,
      message: "Gagal membuat data siswa.",
    });
  }
}

export async function updateStudent(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    const result = updateStudentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Data siswa tidak valid.",
        errors: result.error.flatten(),
      });
      return;
    }

const data = Object.fromEntries(
  Object.entries(result.data).filter(
    ([, value]) => value !== undefined,
  ),
);

const student = await prisma.student.update({
  where: {
    id: String(req.params.id),
  },
  data,
});

    res.status(200).json({
      success: true,
      message: "Data siswa berhasil diperbarui.",
      data: student,
    });
  } catch (error) {
    console.error("[ERROR] updateStudent:", error);

    res.status(500).json({
      success: false,
      message: "Gagal memperbarui data siswa.",
    });
  }
}

export async function deleteStudent(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    await prisma.student.delete({
      where: {
        id: String(req.params.id),
      },
    });

    res.status(200).json({
      success: true,
      message: "Data siswa berhasil dihapus.",
    });
  } catch (error) {
    console.error("[ERROR] deleteStudent:", error);

    res.status(500).json({
      success: false,
      message: "Gagal menghapus data siswa.",
    });
  }
}