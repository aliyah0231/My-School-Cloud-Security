import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export async function getSubjects(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                employeeNumber: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Data mata pelajaran berhasil diambil.",
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSubjectById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "ID mata pelajaran tidak valid.",
  });
}

    const subject = await prisma.subject.findUnique({
      where: {
        id,
      },
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                employeeNumber: true,
                fullName: true,
              },
            },
          },
        },
        grades: {
          select: {
            id: true,
            academicYear: true,
            semester: true,
            finalScore: true,
            status: true,
          },
        },
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Mata pelajaran tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data mata pelajaran berhasil diambil.",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}

export async function createSubject(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      code,
      name,
      description,
      credits,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Kode dan nama mata pelajaran wajib diisi.",
      });
    }

    const existingSubject = await prisma.subject.findUnique({
      where: {
        code: String(code).trim(),
      },
    });

    if (existingSubject) {
      return res.status(409).json({
        success: false,
        message: "Kode mata pelajaran sudah digunakan.",
      });
    }

    const subject = await prisma.subject.create({
      data: {
        code: String(code).trim(),
        name: String(name).trim(),
        description: description
          ? String(description).trim()
          : null,
        credits: credits
          ? Number(credits)
          : 1,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Mata pelajaran berhasil ditambahkan.",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubject(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "ID mata pelajaran tidak valid.",
  });
}

    const existingSubject =
      await prisma.subject.findUnique({
        where: {
          id,
        },
      });

    if (!existingSubject) {
      return res.status(404).json({
        success: false,
        message: "Mata pelajaran tidak ditemukan.",
      });
    }

    const {
      code,
      name,
      description,
      credits,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message: "Kode dan nama mata pelajaran wajib diisi.",
      });
    }

    const duplicateSubject =
      await prisma.subject.findFirst({
        where: {
          code: String(code).trim(),
          NOT: {
            id,
          },
        },
      });

    if (duplicateSubject) {
      return res.status(409).json({
        success: false,
        message: "Kode mata pelajaran sudah digunakan.",
      });
    }

    const subject = await prisma.subject.update({
      where: {
        id,
      },
      data: {
        code: String(code).trim(),
        name: String(name).trim(),
        description: description
          ? String(description).trim()
          : null,
        credits: credits
          ? Number(credits)
          : 1,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Mata pelajaran berhasil diperbarui.",
      data: subject,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubject(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "ID mata pelajaran tidak valid.",
  });
}

    const subject = await prisma.subject.findUnique({
      where: {
        id,
      },
      include: {
        grades: {
          select: {
            id: true,
          },
        },
        teachers: {
          select: {
            id: true,
          },
          take: 1,
        },
      },
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Mata pelajaran tidak ditemukan.",
      });
    }

    if (
      subject.grades.length > 0 ||
      subject.teachers.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Mata pelajaran tidak dapat dihapus karena masih digunakan oleh guru atau data nilai.",
      });
    }

    await prisma.subject.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Mata pelajaran berhasil dihapus.",
    });
  } catch (error) {
    next(error);
  }
}