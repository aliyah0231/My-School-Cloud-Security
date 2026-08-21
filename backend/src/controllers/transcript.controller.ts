import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";

export async function getMyTranscript(
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
        status: "APPROVED",
      },
      select: {
        id: true,
        academicYear: true,
        semester: true,
        finalScore: true,
        subject: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
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

    let totalCredits = 0;
    let totalWeightedScore = 0;

    for (const grade of grades) {
      const score = grade.finalScore
        ? Number(grade.finalScore)
        : 0;

      totalCredits += grade.subject.credits;
      totalWeightedScore +=
        score * grade.subject.credits;
    }

    const averageScore =
      totalCredits > 0
        ? Number(
            (
              totalWeightedScore / totalCredits
            ).toFixed(2),
          )
        : null;

    const transcript =
      await prisma.transcript.findUnique({
        where: {
          studentId: student.id,
        },
        select: {
          id: true,
          transcriptCode: true,
          totalCredits: true,
          averageScore: true,
          issuedAt: true,
        },
      });

    res.status(200).json({
      success: true,
      data: {
        student,
        transcript,
        summary: {
          totalCredits,
          averageScore,
        },
        grades,
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getMyTranscript:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}


/**
 * Mengambil seluruh transkrip siswa untuk admin/staf.
 */
export async function getAllTranscripts(
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

    const students =
      await prisma.student.findMany({
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

          grades: {
            where: {
              status: "APPROVED",
            },
            select: {
              id: true,
              academicYear: true,
              semester: true,
              finalScore: true,
              subject: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  credits: true,
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
          },

          transcript: {
            select: {
              id: true,
              transcriptCode: true,
              totalCredits: true,
              averageScore: true,
              issuedAt: true,
            },
          },
        },

        orderBy: {
          fullName: "asc",
        },
      });

    const transcripts = students.map(
      (student) => {
        const classMember =
          student.classMembers[0];

        let totalCredits = 0;
        let totalWeightedScore = 0;

        for (const grade of student.grades) {
          const score = grade.finalScore
            ? Number(grade.finalScore)
            : 0;

          totalCredits +=
            grade.subject.credits;

          totalWeightedScore +=
            score * grade.subject.credits;
        }

        const averageScore =
          totalCredits > 0
            ? Number(
                (
                  totalWeightedScore /
                  totalCredits
                ).toFixed(2),
              )
            : 0;

        return {
          id: student.id,

          student: {
            id: student.id,
            studentNumber:
              student.studentNumber,
            fullName: student.fullName,
          },

          class: classMember
            ? {
                id: classMember.class.id,
                name: classMember.class.name,
                major: classMember.class.major,
                academicYear:
                  classMember.class.academicYear,
              }
            : null,

          transcript:
            student.transcript,

          summary: {
            totalCredits,
            averageScore,
            totalSubjects:
              student.grades.length,
          },

          grades: student.grades,
        };
      },
    );

    const totalStudents =
      transcripts.length;

    const totalSubjects =
      transcripts.reduce(
        (total, transcript) =>
          total +
          transcript.summary.totalSubjects,
        0,
      );

    const averageScores =
      transcripts
        .map(
          (transcript) =>
            transcript.summary.averageScore,
        )
        .filter(
          (score) => score > 0,
        );

    const overallAverage =
      averageScores.length > 0
        ? Number(
            (
              averageScores.reduce(
                (total, score) =>
                  total + score,
                0,
              ) /
              averageScores.length
            ).toFixed(2),
          )
        : 0;

    res.status(200).json({
      success: true,

      data: {
        transcripts,

        statistics: {
          totalStudents,
          totalSubjects,
          overallAverage,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getAllTranscripts:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
    });
  }
}