import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";

export async function getMyGrades(
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
      },
    });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Data siswa tidak ditemukan.",
      });
      return;
    }

    const grades = await prisma.grade.findMany({
      where: {
        studentId: student.id,
      },
      select: {
        id: true,
        academicYear: true,
        semester: true,
        assignment: true,
        midterm: true,
        finalExam: true,
        finalScore: true,
        status: true,
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },
        teacher: {
          select: {
            id: true,
            employeeNumber: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        {
          academicYear: "asc",
        },
        {
          semester: "asc",
        },
        {
          subject: {
            name: "asc",
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        grades,
      },
    });
  } catch (error) {
    console.error("[ERROR] getMyGrades:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}


/**
 * Mengambil seluruh nilai siswa untuk admin/staf.
 */
export async function getAllGrades(
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

    const grades = await prisma.grade.findMany({
      select: {
        id: true,
        academicYear: true,
        semester: true,
        assignment: true,
        midterm: true,
        finalExam: true,
        finalScore: true,
        status: true,

        student: {
          select: {
            id: true,
            studentNumber: true,
            fullName: true,

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
              take: 1,
            },
          },
        },

        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
          },
        },

        teacher: {
          select: {
            id: true,
            employeeNumber: true,
            fullName: true,
          },
        },
      },

      orderBy: [
        {
          student: {
            fullName: "asc",
          },
        },
        {
          subject: {
            name: "asc",
          },
        },
      ],
    });

    const formattedGrades = grades.map((grade) => {
      const classMember = grade.student.classMembers[0];

      return {
        id: grade.id,
        academicYear: grade.academicYear,
        semester: grade.semester,

        student: {
          id: grade.student.id,
          studentNumber: grade.student.studentNumber,
          fullName: grade.student.fullName,
        },

        class: classMember
          ? {
              id: classMember.class.id,
              name: classMember.class.name,
              major: classMember.class.major,
              academicYear: classMember.class.academicYear,
            }
          : null,

        subject: grade.subject,

        assignment: grade.assignment
          ? Number(grade.assignment)
          : null,

        midterm: grade.midterm
          ? Number(grade.midterm)
          : null,

        finalExam: grade.finalExam
          ? Number(grade.finalExam)
          : null,

        finalScore: grade.finalScore
          ? Number(grade.finalScore)
          : 0,

        status: grade.status,

        teacher: grade.teacher,
      };
    });

    const scores = formattedGrades
      .map((grade) => grade.finalScore)
      .filter((score) => score > 0);

    const average =
      scores.length > 0
        ? scores.reduce((total, score) => total + score, 0) /
          scores.length
        : 0;

    const passed = formattedGrades.filter(
      (grade) => grade.finalScore >= 70,
    ).length;

    res.status(200).json({
      success: true,

      data: {
        grades: formattedGrades,

        statistics: {
          total: formattedGrades.length,
          average: Number(average.toFixed(2)),
          passed,
        },
      },
    });
  } catch (error) {
    console.error("[ERROR] getAllGrades:", error);

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}