import type { Response } from "express";

import type {
  AuthenticatedRequest,
} from "../middleware/auth.middleware.js";

import {
  prisma,
} from "../config/prisma.js";

import {
  calculateSha256,
} from "../utils/hash.js";

import {
  registerDocumentOnBlockchain,
} from "../services/blockchain/blockchain.service.js";

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

/*
 * =========================================================
 * UPDATE NILAI + BLOCKCHAIN AUDIT TRAIL
 * =========================================================
 *
 * PUT /api/grades/:gradeId
 */
export async function updateGradeWithBlockchainAudit(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  try {
    /*
     * =====================================================
     * AUTHENTICATION
     * =====================================================
     */
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication diperlukan.",
      });

      return;
    }


    /*
     * =====================================================
     * GRADE ID
     * =====================================================
     */
    const gradeId =
      String(
        req.params.gradeId,
      );


    if (!gradeId) {
      res.status(400).json({
        success: false,
        message: "Grade ID diperlukan.",
      });

      return;
    }


    /*
     * =====================================================
     * NILAI BARU
     * =====================================================
     */
    const rawFinalScore =
      req.body?.finalScore;


    if (
      rawFinalScore === undefined ||
      rawFinalScore === null ||
      rawFinalScore === ""
    ) {
      res.status(400).json({
        success: false,
        message: "Nilai akhir wajib diisi.",
      });

      return;
    }


    const newFinalScore =
      Number(
        rawFinalScore,
      );


    if (
      !Number.isFinite(
        newFinalScore,
      ) ||
      newFinalScore < 0 ||
      newFinalScore > 100
    ) {
      res.status(400).json({
        success: false,
        message:
          "Nilai akhir harus berada pada rentang 0 sampai 100.",
      });

      return;
    }


    /*
     * =====================================================
     * AMBIL NILAI LAMA
     * =====================================================
     */
    const existingGrade =
      await prisma.grade.findUnique({
        where: {
          id: gradeId,
        },

        select: {
          id: true,

          studentId: true,
          subjectId: true,
          teacherId: true,

          academicYear: true,
          semester: true,

          finalScore: true,
          status: true,

          student: {
            select: {
              id: true,
              studentNumber: true,
              fullName: true,
            },
          },

          subject: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },

          teacher: {
            select: {
              id: true,
              userId: true,
              employeeNumber: true,
              fullName: true,
            },
          },
        },
      });


    if (!existingGrade) {
      res.status(404).json({
        success: false,
        message: "Data nilai tidak ditemukan.",
      });

      return;
    }


    /*
     * =====================================================
     * OTORISASI GURU
     * =====================================================
     *
     * GURU hanya boleh mengubah nilai
     * yang memang ditugaskan kepadanya.
     *
     * STAF_TU dan KEPALA_SEKOLAH
     * diperbolehkan oleh route.
     */
    if (
      req.user.role ===
      "GURU"
    ) {
      const teacher =
        await prisma.teacher.findUnique({
          where: {
            userId:
              req.user.id,
          },

          select: {
            id: true,
          },
        });


      if (
        !teacher ||
        teacher.id !==
          existingGrade.teacherId
      ) {
        res.status(403).json({
          success: false,
          message:
            "Guru tidak memiliki hak untuk mengubah nilai ini.",
        });

        return;
      }
    }


    const oldFinalScore =
      existingGrade.finalScore !==
      null
        ? Number(
            existingGrade.finalScore,
          )
        : null;


    /*
     * Tidak perlu membuat transaksi blockchain
     * apabila nilainya sama.
     */
    if (
      oldFinalScore ===
      newFinalScore
    ) {
      res.status(400).json({
        success: false,
        message:
          "Nilai baru sama dengan nilai sebelumnya.",
      });

      return;
    }


    /*
     * =====================================================
     * AUDIT TIMESTAMP
     * =====================================================
     */
    const changedAt =
      new Date();


    /*
     * =====================================================
     * PAYLOAD AUDIT
     * =====================================================
     *
     * Data penting perubahan nilai dibentuk
     * menjadi struktur tetap sebelum SHA-256.
     */
    const auditPayload = {
      auditType:
        "GRADE_CHANGE",

      gradeId:
        existingGrade.id,

      student: {
        id:
          existingGrade.student.id,

        studentNumber:
          existingGrade.student
            .studentNumber,

        fullName:
          existingGrade.student
            .fullName,
      },

      subject: {
        id:
          existingGrade.subject.id,

        code:
          existingGrade.subject.code,

        name:
          existingGrade.subject.name,
      },

      academicYear:
        existingGrade.academicYear,

      semester:
        existingGrade.semester,

      oldFinalScore,

      newFinalScore,

      changedBy: {
        userId:
          req.user.id,

        role:
          req.user.role,
      },

      changedAt:
        changedAt.toISOString(),
    };


    /*
     * =====================================================
     * SHA-256
     * =====================================================
     */
    const auditHash =
      calculateSha256(
        JSON.stringify(
          auditPayload,
        ),
      );


    /*
     * Verification code harus unik.
     */
    const verificationCode =
      `GRADE-AUDIT-${existingGrade.id}-${Date.now()}`;


    /*
     * =====================================================
     * REGISTER AUDIT HASH KE BLOCKCHAIN
     * =====================================================
     */
    const blockchainResult =
      await registerDocumentOnBlockchain(
        verificationCode,
        "GRADE_AUDIT",
        auditHash,
      );


    /*
     * =====================================================
     * UPDATE DB + AUDIT LOG
     * =====================================================
     *
     * Kedua operasi database dibuat dalam
     * transaction PostgreSQL.
     */
    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedGrade =
            await tx.grade.update({
              where: {
                id:
                  existingGrade.id,
              },

              data: {
                finalScore:
                  newFinalScore,
              },

              select: {
                id: true,
                finalScore: true,
                updatedAt: true,
              },
            });


          const auditLog =
            await tx.auditLog.create({
              data: {
                userId:
                  req.user!.id,

   role:
        req.user!.role as
          | "SISWA"
          | "GURU"
          | "STAF_TU"
          | "KEPALA_SEKOLAH"
          | "MITRA_INDUSTRI",


                action:
                  "GRADE_UPDATE_BLOCKCHAIN",

                resource:
                  "GRADE",

                resourceId:
                  existingGrade.id,

                ipAddress:
                  req.ip ?? null,

                status:
                  "SUCCESS",

                metadata: {
                  gradeId:
                    existingGrade.id,

                  studentId:
                    existingGrade.student.id,

                  studentNumber:
                    existingGrade.student
                      .studentNumber,

                  studentName:
                    existingGrade.student
                      .fullName,

                  subjectId:
                    existingGrade.subject.id,

                  subjectCode:
                    existingGrade.subject.code,

                  subjectName:
                    existingGrade.subject.name,

                  academicYear:
                    existingGrade.academicYear,

                  semester:
                    existingGrade.semester,

                  oldFinalScore,

                  newFinalScore,

                  blockchain: {
                    documentType:
                      "GRADE_AUDIT",

                    verificationCode,

                    hash:
                      auditHash,

                    transactionHash:
                      blockchainResult
                        .transactionHash,
                  },

                  changedAt:
                    changedAt.toISOString(),
                },
              },
            });


          return {
            updatedGrade,
            auditLog,
          };
        },
      );


    /*
     * =====================================================
     * RESPONSE
     * =====================================================
     */
    res.status(200).json({
      success: true,

      message:
        "Nilai berhasil diperbarui dan audit perubahan telah dicatat ke blockchain.",

      data: {
        grade: {
          id:
            result.updatedGrade.id,

          oldFinalScore,

          newFinalScore:
            Number(
              result.updatedGrade
                .finalScore,
            ),

          updatedAt:
            result.updatedGrade
              .updatedAt,
        },

        audit: {
          auditLogId:
            result.auditLog.id,

          verificationCode,

          documentType:
            "GRADE_AUDIT",

          hash:
            auditHash,

          transactionHash:
            blockchainResult
              .transactionHash,

          changedAt:
            changedAt.toISOString(),
        },
      },
    });

  } catch (error) {
    console.error(
      "[ERROR] updateGradeWithBlockchainAudit:",
      error,
    );


    res.status(500).json({
      success: false,

      message:
        "Gagal memperbarui nilai atau mencatat audit blockchain.",
    });
  }
}