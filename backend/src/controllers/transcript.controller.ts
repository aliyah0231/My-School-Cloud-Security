import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import { prisma } from "../config/prisma.js";

import {
  calculateSha256,
} from "../utils/hash.js";

import {
  registerDocumentOnBlockchain,
  verifyDocumentOnBlockchain,
  getDocumentFromBlockchain,
} from "../services/blockchain/blockchain.service.js";


/*
 * =========================================================
 * MEMBENTUK DATA TRANSKRIP UNTUK HASH
 * =========================================================
 */
function buildTranscriptPayload(
  student: {
    studentNumber: string;
    fullName: string;
  },

  grades: Array<{
    academicYear: string;
    semester: number;
    finalScore: unknown;

    subject: {
      code: string;
      name: string;
      credits: number;
    };
  }>,
) {
  let totalCredits = 0;
  let totalWeightedScore = 0;

  const normalizedGrades = grades.map(
    (grade) => {
      const finalScore =
        grade.finalScore !== null &&
        grade.finalScore !== undefined
          ? Number(grade.finalScore)
          : 0;

      totalCredits +=
        grade.subject.credits;

      totalWeightedScore +=
        finalScore *
        grade.subject.credits;

      return {
        academicYear:
          grade.academicYear,

        semester:
          grade.semester,

        subjectCode:
          grade.subject.code,

        subjectName:
          grade.subject.name,

        credits:
          grade.subject.credits,

        finalScore,
      };
    },
  );

  const averageScore =
    totalCredits > 0
      ? Number(
          (
            totalWeightedScore /
            totalCredits
          ).toFixed(2),
        )
      : 0;

  const payload = {
    documentType: "TRANSCRIPT",

    studentNumber:
      student.studentNumber,

    studentName:
      student.fullName,

    totalCredits,

    averageScore,

    grades:
      normalizedGrades,
  };

  return {
    payload,
    totalCredits,
    averageScore,
  };
}


/*
 * =========================================================
 * MENGAMBIL DATA SISWA + NILAI
 * =========================================================
 */
async function getStudentTranscriptData(
  studentId: string,
) {
  const student =
    await prisma.student.findUnique({
      where: {
        id: studentId,
      },

      select: {
        id: true,
        studentNumber: true,
        fullName: true,

        grades: {
          where: {
            status: "APPROVED",
          },

          select: {
            academicYear: true,
            semester: true,
            finalScore: true,

            subject: {
              select: {
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
                code: "asc",
              },
            },
          ],
        },
      },
    });

  if (!student) {
    return null;
  }

  const calculated =
    buildTranscriptPayload(
      student,
      student.grades,
    );

  return {
    student,
    ...calculated,
  };
}


/*
 * =========================================================
 * SISWA MELIHAT TRANSKRIP SENDIRI
 * =========================================================
 */
export async function getMyTranscript(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message:
          "Authentication diperlukan.",
      });

      return;
    }

    const student =
      await prisma.student.findUnique({
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
        message:
          "Data siswa tidak ditemukan.",
      });

      return;
    }

    const data =
      await getStudentTranscriptData(
        student.id,
      );

    if (!data) {
      res.status(404).json({
        success: false,
        message:
          "Data transkrip tidak ditemukan.",
      });

      return;
    }

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

          blockchainHash: true,
          blockchainTxHash: true,
          blockchainRegisteredAt: true,
        },
      });

    res.status(200).json({
      success: true,

      data: {
        student,

        transcript,

        summary: {
          totalCredits:
            data.totalCredits,

          averageScore:
            data.averageScore,
        },

        grades:
          data.student.grades,

        blockchain: {
          registered:
            Boolean(
              transcript?.blockchainHash,
            ),

          verificationCode:
            transcript?.transcriptCode ??
            null,

          transactionHash:
            transcript?.blockchainTxHash ??
            null,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] getMyTranscript:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Terjadi kesalahan pada server.",
    });
  }
}


/*
 * =========================================================
 * MELIHAT SEMUA TRANSKRIP
 * =========================================================
 */
export async function getAllTranscripts(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message:
          "Authentication diperlukan.",
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
              academicYear: true,
              semester: true,
              finalScore: true,

              subject: {
                select: {
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
                  code: "asc",
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

    blockchainHash: true,
    blockchainTxHash: true,
    blockchainRegisteredAt: true,
  },
},
},

        orderBy: {
          fullName: "asc",
        },
      });

    const transcripts =
      students.map(
        (student) => {
          const classMember =
            student.classMembers[0];

          const calculated =
            buildTranscriptPayload(
              student,
              student.grades,
            );

          return {
            id: student.id,

            student: {
              id: student.id,

              studentNumber:
                student.studentNumber,

              fullName:
                student.fullName,
            },

            class:
              classMember
                ? {
                    id:
                      classMember.class.id,

                    name:
                      classMember.class.name,

                    major:
                      classMember.class.major,

                    academicYear:
                      classMember.class
                        .academicYear,
                  }
                : null,

            transcript:
              student.transcript,

            summary: {
              totalCredits:
                calculated.totalCredits,

              averageScore:
                calculated.averageScore,

              totalSubjects:
                student.grades.length,
            },

            blockchain: {
              registered:
                Boolean(
                  student.transcript
                    ?.blockchainHash,
                ),

              verificationCode:
                student.transcript
                  ?.transcriptCode ??
                null,

              transactionHash:
                student.transcript
                  ?.blockchainTxHash ??
                null,
            },

            grades:
              student.grades,
          };
        },
      );

    const averageScores =
      transcripts
        .map(
          (item) =>
            item.summary.averageScore,
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
          totalStudents:
            transcripts.length,

          totalSubjects:
            transcripts.reduce(
              (total, transcript) =>
                total +
                transcript.summary
                  .totalSubjects,
              0,
            ),

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
      message:
        "Terjadi kesalahan pada server.",
    });
  }
}

/*
 * =========================================================
 * HELPER DATA TRANSKRIP UNTUK BLOCKCHAIN
 * =========================================================
 */
async function getTranscriptBlockchainData(
  studentId: string,
) {
  const student =
    await prisma.student.findUnique({
      where: {
        id: studentId,
      },

      select: {
        id: true,
        studentNumber: true,
        fullName: true,

        grades: {
          where: {
            status: "APPROVED",
          },

          select: {
            academicYear: true,
            semester: true,
            finalScore: true,

            subject: {
              select: {
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
                code: "asc",
              },
            },
          ],
        },
      },
    });

  if (!student) {
    return null;
  }

  let totalCredits = 0;
  let totalWeightedScore = 0;

  const normalizedGrades =
    student.grades.map(
      (grade) => {
        const finalScore =
          grade.finalScore !== null
            ? Number(
                grade.finalScore,
              )
            : 0;

        totalCredits +=
          grade.subject.credits;

        totalWeightedScore +=
          finalScore *
          grade.subject.credits;

        return {
          academicYear:
            grade.academicYear,

          semester:
            grade.semester,

          subjectCode:
            grade.subject.code,

          subjectName:
            grade.subject.name,

          credits:
            grade.subject.credits,

          finalScore,
        };
      },
    );

  const averageScore =
    totalCredits > 0
      ? Number(
          (
            totalWeightedScore /
            totalCredits
          ).toFixed(2),
        )
      : 0;

  const payload = {
    documentType:
      "TRANSCRIPT",

    studentNumber:
      student.studentNumber,

    studentName:
      student.fullName,

    totalCredits,

    averageScore,

    grades:
      normalizedGrades,
  };

  return {
    student,
    totalCredits,
    averageScore,
    payload,
  };
}

/*
 * =========================================================
 * DAFTARKAN TRANSKRIP KE BLOCKCHAIN
 * =========================================================
 */
export async function registerTranscriptBlockchain(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message:
          "Authentication diperlukan.",
      });

      return;
    }

    const studentId = String(
      req.params.studentId,);

    if (!studentId) {
      res.status(400).json({
        success: false,
        message:
          "Student ID diperlukan.",
      });

      return;
    }

    const data =
      await getStudentTranscriptData(
        studentId,
      );

    if (!data) {
      res.status(404).json({
        success: false,
        message:
          "Data siswa tidak ditemukan.",
      });

      return;
    }

    if (
      data.student.grades.length === 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Transkrip belum memiliki nilai APPROVED.",
      });

      return;
    }

    const serializedTranscript =
      JSON.stringify(
        data.payload,
      );

    const transcriptHash =
      calculateSha256(
        serializedTranscript,
      );

    const verificationCode =
      `TRANS-${data.student.studentNumber}-${Date.now()}`;

    const blockchainResult =
      await registerDocumentOnBlockchain(
        verificationCode,
        "TRANSCRIPT",
        transcriptHash,
      );

    const transcript =
      await prisma.transcript.upsert({
        where: {
          studentId:
            data.student.id,
        },

        update: {
          transcriptCode:
            verificationCode,

          totalCredits:
            data.totalCredits,

          averageScore:
            data.averageScore,

          issuedAt:
            new Date(),

          blockchainHash:
            transcriptHash,

          blockchainTxHash:
            blockchainResult
              .transactionHash,

          blockchainRegisteredAt:
            new Date(),
        },

        create: {
          studentId:
            data.student.id,

          transcriptCode:
            verificationCode,

          totalCredits:
            data.totalCredits,

          averageScore:
            data.averageScore,

          issuedAt:
            new Date(),

          blockchainHash:
            transcriptHash,

          blockchainTxHash:
            blockchainResult
              .transactionHash,

          blockchainRegisteredAt:
            new Date(),
        },
      });

    res.status(201).json({
      success: true,

      message:
        "Transkrip berhasil diregistrasikan ke blockchain.",

      data: {
        transcript: {
          id:
            transcript.id,

          transcriptCode:
            transcript.transcriptCode,

          totalCredits:
            transcript.totalCredits,

          averageScore:
            transcript.averageScore,
        },

        blockchain: {
          documentType:
            "TRANSCRIPT",

          verificationCode,

          documentHash:
            transcriptHash,

          transactionHash:
            blockchainResult
              .transactionHash,
        },
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] registerTranscriptBlockchain:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal mendaftarkan transkrip ke blockchain.",
    });
  }
}


/*
 * =========================================================
 * VERIFIKASI TRANSKRIP DENGAN BLOCKCHAIN
 * =========================================================
 */
export async function verifyTranscriptBlockchain(
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

    const studentId = String(
      req.params.studentId,
    );

    if (!studentId) {
      res.status(400).json({
        success: false,
        message: "Student ID diperlukan.",
      });

      return;
    }

    const transcript =
      await prisma.transcript.findUnique({
        where: {
          studentId,
        },
      });

    if (
      !transcript ||
      !transcript.blockchainHash
    ) {
      res.status(404).json({
        success: false,
        message:
          "Transkrip belum diregistrasikan ke blockchain.",
      });

      return;
    }

    const data =
      await getTranscriptBlockchainData(
        studentId,
      );

    // kode berikutnya tetap
    if (!data) {
      res.status(404).json({
        success: false,
        message:
          "Data siswa tidak ditemukan.",
      });

      return;
    }

    const currentHash =
      calculateSha256(
        JSON.stringify(
          data.payload,
        ),
      );

    const result =
      await verifyDocumentOnBlockchain(
        transcript.transcriptCode,
        currentHash,
      );

    const blockchainDocument =
      await getDocumentFromBlockchain(
        transcript.transcriptCode,
      );

    res.status(200).json({
      success: true,

      message:
        result.valid
          ? "Transkrip VALID dan sesuai dengan blockchain."
          : "Transkrip TIDAK VALID. Data transkrip telah berubah atau tidak sesuai dengan blockchain.",

      data: {
        valid:
          result.valid,

        verificationCode:
          transcript.transcriptCode,

        currentHash,

        registeredHash:
          blockchainDocument.documentHash,

        documentType:
          result.documentType,

        registeredAt:
          result.registeredAt,

        transactionHash:
          transcript.blockchainTxHash,
      },
    });
  } catch (error) {
    console.error(
      "[ERROR] verifyTranscriptBlockchain:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Gagal memverifikasi transkrip dengan blockchain.",
    });
  }
}