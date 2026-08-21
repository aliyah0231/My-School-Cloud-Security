import { prisma } from "../config/prisma.js";



export async function getStudents() {
  return prisma.student.findMany({
    orderBy: {
      fullName: "asc",
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
      classMembers: {
        include: {
          class: true,
        },
      },
    },
  });
}

export async function getStudentById(id: string) {
  return prisma.student.findUnique({
    where: { id },
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
      classMembers: {
        include: {
          class: true,
        },
      },
      grades: {
        include: {
          subject: true,
          teacher: true,
        },
      },
      transcript: true,
      graduation: true,
      diplomas: true,
      certificates: true,
    },
  });
}

export async function createStudent(data: {
  userId?: string;
  studentNumber: string;
  fullName: string;
  gender?: "LAKI_LAKI" | "PEREMPUAN";
  birthPlace?: string;
  birthDate?: Date;
  address?: string;
  phone?: string;
  graduationYear?: number;
}) {
  return prisma.student.create({
    data,
  });
}

export async function updateStudent(
  id: string,
  data: {
    userId?: string;
    studentNumber?: string;
    fullName?: string;
    gender?: "LAKI_LAKI" | "PEREMPUAN";
    birthPlace?: string;
    birthDate?: Date;
    address?: string;
    phone?: string;
    graduationYear?: number;
  },
) {
  return prisma.student.update({
    where: { id },
    data,
  });
}

export async function deleteStudent(id: string) {
  return prisma.student.delete({
    where: { id },
  });
}
