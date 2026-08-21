import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";

export async function getTeachers(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        classes: {
          select: {
            id: true,
            name: true,
            major: true,
            academicYear: true,
          },
        },
      },
      orderBy: {
        fullName: "asc",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Data guru berhasil diambil.",
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTeacherById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "ID guru tidak valid.",
  });
}

    const teacher = await prisma.teacher.findUnique({
      where: {
        id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
        subjects: {
          include: {
            subject: true,
          },
        },
        classes: true,
        grades: {
          include: {
            subject: true,
            student: {
              select: {
                id: true,
                studentNumber: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Data guru tidak ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data guru berhasil diambil.",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTeacher(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const {
      employeeNumber,
      fullName,
      phone,
      address,
    } = req.body;

    if (!employeeNumber || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Nomor pegawai dan nama lengkap wajib diisi.",
      });
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: {
        employeeNumber,
      },
    });

    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: "Nomor pegawai sudah terdaftar.",
      });
    }

    const teacher = await prisma.teacher.create({
      data: {
        employeeNumber,
        fullName,
        phone: phone || null,
        address: address || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Data guru berhasil ditambahkan.",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTeacher(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "ID guru tidak valid.",
  });
}

    const {
      employeeNumber,
      fullName,
      phone,
      address,
    } = req.body;

    const existingTeacher = await prisma.teacher.findUnique({
      where: {
        id,
      },
    });

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Data guru tidak ditemukan.",
      });
    }

    if (employeeNumber && employeeNumber !== existingTeacher.employeeNumber) {
      const duplicateTeacher = await prisma.teacher.findUnique({
        where: {
          employeeNumber,
        },
      });

      if (duplicateTeacher) {
        return res.status(409).json({
          success: false,
          message: "Nomor pegawai sudah digunakan guru lain.",
        });
      }
    }

    const teacher = await prisma.teacher.update({
      where: {
        id,
      },
      data: {
        employeeNumber: employeeNumber ?? existingTeacher.employeeNumber,
        fullName: fullName ?? existingTeacher.fullName,
        phone: phone ?? existingTeacher.phone,
        address: address ?? existingTeacher.address,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Data guru berhasil diperbarui.",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTeacher(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

if (typeof id !== "string") {
  return res.status(400).json({
    success: false,
    message: "ID guru tidak valid.",
  });
}

    const existingTeacher = await prisma.teacher.findUnique({
      where: {
        id,
      },
    });

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Data guru tidak ditemukan.",
      });
    }

    await prisma.teacher.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Data guru berhasil dihapus.",
    });
  } catch (error) {
    next(error);
  }
}