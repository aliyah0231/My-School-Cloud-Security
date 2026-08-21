import "dotenv/config";

import {
  PrismaClient,
  UserRole,
  UserStatus,
  Gender,
  GradeStatus,
  GraduationStatus,
  DocumentStatus,
  DocumentType,
  AuditStatus,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import crypto from "node:crypto";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL belum ditemukan di file .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const PASSWORD = "admin123";
const EMAIL_DOMAIN = "smk.bina-bangsa.local";
const ACADEMIC_YEAR = "2026/2027";
const GRADE_ACADEMIC_YEAR = "2025/2026";

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function makeBirthDate(index: number): Date {
  const month = (index - 1) % 12;
  const day = ((index - 1) % 25) + 1;

  return new Date(2008, month, day);
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log("     SEED SISTEM ADMINISTRASI SMK");
  console.log("==============================================");
  console.log("");

  const passwordHash = await argon2.hash(PASSWORD);

  console.log("Menghapus data development lama...");

  await prisma.verificationRecord.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.diploma.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.graduation.deleteMany();
  await prisma.transcript.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  console.log("Data lama berhasil dihapus.");
  console.log("");

  console.log("Membuat akun sistem...");

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: `admin@${EMAIL_DOMAIN}`,
      passwordHash,
      role: UserRole.STAF_TU,
      status: UserStatus.ACTIVE,
    },
  });

  const kepalaSekolah = await prisma.user.create({
    data: {
      username: "kepala.sekolah",
      email: `kepala.sekolah@${EMAIL_DOMAIN}`,
      passwordHash,
      role: UserRole.KEPALA_SEKOLAH,
      status: UserStatus.ACTIVE,
    },
  });

  const mitra = await prisma.user.create({
    data: {
      username: "mitra.industri",
      email: `mitra.industri@${EMAIL_DOMAIN}`,
      passwordHash,
      role: UserRole.MITRA_INDUSTRI,
      status: UserStatus.ACTIVE,
    },
  });

  console.log("3 akun sistem berhasil dibuat.");
  console.log("");

  console.log("Membuat 10 akun guru...");

  const teacherUsers = [];

  for (let i = 1; i <= 10; i++) {
    const teacherUser = await prisma.user.create({
      data: {
        username: `guru${i}`,
        email: `guru${i}@${EMAIL_DOMAIN}`,
        passwordHash,
        role: UserRole.GURU,
        status: UserStatus.ACTIVE,
      },
    });

    teacherUsers.push(teacherUser);
  }

  const teacherNames = [
    "Budi Santoso, S.Kom.",
    "Siti Rahmawati, S.Pd.",
    "Andi Pratama, S.Kom.",
    "Dewi Lestari, S.Pd.",
    "Fajar Hidayat, S.Kom.",
    "Nur Aisyah, S.Pd.",
    "Rizky Maulana, S.Kom.",
    "Maya Putri, S.Pd.",
    "Ilham Akbar, S.Kom.",
    "Rina Marlina, S.Pd.",
  ];

const teachers = [];

for (let i = 1; i <= 10; i++) {
  const teacherUser = teacherUsers[i - 1];
  const teacherName = teacherNames[i - 1];

  if (!teacherUser || !teacherName) {
    throw new Error(`Data guru ke-${i} tidak tersedia.`);
  }

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNumber: `G${String(i).padStart(3, "0")}`,
      fullName: teacherName,
      phone: `0812${String(i).padStart(8, "0")}`,
      address: `Jl. Pendidikan No. ${i}, Makassar`,
    },
  });

  teachers.push(teacher);
}

  console.log("10 guru berhasil dibuat.");
  console.log("");

  console.log("Membuat 10 mata pelajaran...");

  const subjectsData = [
    {
      code: "MAT",
      name: "Matematika",
      description: "Matematika dasar dan terapan.",
      credits: 4,
    },
    {
      code: "BIN",
      name: "Bahasa Indonesia",
      description: "Bahasa Indonesia untuk akademik dan profesional.",
      credits: 4,
    },
    {
      code: "BIG",
      name: "Bahasa Inggris",
      description: "Bahasa Inggris untuk kebutuhan akademik dan profesional.",
      credits: 3,
    },
    {
      code: "PBO",
      name: "Pemrograman Berorientasi Objek",
      description: "Konsep pemrograman berbasis objek.",
      credits: 4,
    },
    {
      code: "WEB",
      name: "Pemrograman Web",
      description: "Pengembangan aplikasi web modern.",
      credits: 4,
    },
    {
      code: "BD",
      name: "Basis Data",
      description: "Perancangan dan implementasi basis data.",
      credits: 3,
    },
    {
      code: "JAR",
      name: "Jaringan Komputer",
      description: "Konsep jaringan komputer dan administrasi jaringan.",
      credits: 3,
    },
    {
      code: "PKN",
      name: "Pendidikan Pancasila",
      description: "Pendidikan Pancasila dan kewarganegaraan.",
      credits: 2,
    },
    {
      code: "AGM",
      name: "Pendidikan Agama",
      description: "Pendidikan agama dan karakter.",
      credits: 2,
    },
    {
      code: "PKK",
      name: "Produk Kreatif dan Kewirausahaan",
      description: "Kreativitas, inovasi, dan kewirausahaan.",
      credits: 3,
    },
  ];

  const subjects = [];

  for (const subjectData of subjectsData) {
    const subject = await prisma.subject.create({
      data: subjectData,
    });

    subjects.push(subject);
  }

  console.log("10 mata pelajaran berhasil dibuat.");
  console.log("");

  console.log("Membuat relasi guru dan mata pelajaran...");

  for (const teacher of teachers) {
    for (const subject of subjects) {
      await prisma.teacherSubject.create({
        data: {
          teacherId: teacher.id,
          subjectId: subject.id,
        },
      });
    }
  }

  console.log(
    `${teachers.length * subjects.length} relasi guru-mapel berhasil dibuat.`,
  );
  console.log("");

  console.log("Membuat 6 kelas...");

  const classData = [
    {
      name: "XI RPL 1",
      major: "Rekayasa Perangkat Lunak",
    },
    {
      name: "XI RPL 2",
      major: "Rekayasa Perangkat Lunak",
    },
    {
      name: "XI TKJ",
      major: "Teknik Komputer dan Jaringan",
    },
    {
      name: "XII RPL 1",
      major: "Rekayasa Perangkat Lunak",
    },
    {
      name: "XII RPL 2",
      major: "Rekayasa Perangkat Lunak",
    },
    {
      name: "XII TKJ",
      major: "Teknik Komputer dan Jaringan",
    },
  ];

  const classes = [];

for (let i = 0; i < classData.length; i++) {
  const classItem = classData[i];
  const teacher = teachers[i];

  if (!classItem || !teacher) {
    throw new Error(`Data kelas atau guru ke-${i + 1} tidak tersedia.`);
  }

  const schoolClass = await prisma.class.create({
    data: {
      name: classItem.name,
      major: classItem.major,
      academicYear: ACADEMIC_YEAR,
      teacherId: teacher.id,
    },
  });

  classes.push(schoolClass);
}

  console.log("6 kelas berhasil dibuat.");
  console.log("");

  console.log("Membuat 36 akun siswa...");

  const studentNames = [
    "Ahmad Rizky",
    "Muhammad Fadli",
    "Andi Saputra",
    "Rizal Maulana",
    "Fikri Ramadhan",
    "Ilham Kurniawan",
    "Ardiansyah Putra",
    "Reza Pratama",
    "Dimas Arya",
    "Fajar Nugraha",
    "Rian Hidayat",
    "Alif Akbar",
    "Bagas Prasetyo",
    "Iqbal Ramadhan",
    "Rizky Firmansyah",
    "Salsabila Putri",
    "Aulia Rahma",
    "Nurul Aisyah",
    "Dewi Anggraini",
    "Putri Maharani",
    "Nabila Sari",
    "Ayu Lestari",
    "Maya Safitri",
    "Citra Ramadhani",
    "Intan Permata",
    "Fitri Handayani",
    "Nadia Amalia",
    "Rani Oktaviani",
    "Vina Amelia",
    "Siti Nurhaliza",
    "Lina Marlina",
    "Sarah Azzahra",
    "Tiara Anjani",
    "Fitria Wulandari",
    "Nisa Rahmawati",
    "Alya Maharani",
  ];

  const students = [];

  for (let i = 1; i <= 36; i++) {
    const studentUser = await prisma.user.create({
      data: {
        username: `siswa${i}`,
        email: `siswa${i}@${EMAIL_DOMAIN}`,
        passwordHash,
        role: UserRole.SISWA,
        status: UserStatus.ACTIVE,
      },
    });

const studentName = studentNames[i - 1];

if (!studentName) {
  throw new Error(`Nama siswa ke-${i} tidak tersedia.`);
}

const student = await prisma.student.create({
  data: {
    userId: studentUser.id,
    studentNumber: `2026${String(i).padStart(4, "0")}`,
    fullName: studentName,
        gender:
          i % 2 === 0
            ? Gender.PEREMPUAN
            : Gender.LAKI_LAKI,
        birthPlace: "Makassar",
        birthDate: makeBirthDate(i),
        address: `Jl. Pendidikan No. ${i}, Makassar`,
        phone: `0821${String(i).padStart(8, "0")}`,
        graduationYear: 2026,
      },
    });

    students.push(student);

const schoolClass = classes[(i - 1) % classes.length];

if (!schoolClass) {
  throw new Error(`Kelas untuk siswa ke-${i} tidak tersedia.`);
}

await prisma.classMember.create({
  data: {
    studentId: student.id,
    classId: schoolClass.id,
  },
});
  }

  console.log("36 siswa berhasil dibuat.");
  console.log("");

  console.log("Membuat data nilai...");

  let gradeCount = 0;

for (
  let studentIndex = 0;
  studentIndex < students.length;
  studentIndex++
) {
  const student = students[studentIndex];

  if (!student) {
    throw new Error(
      `Data siswa index ${studentIndex} tidak tersedia.`,
    );
  }

  for (
    let subjectIndex = 0;
    subjectIndex < subjects.length;
    subjectIndex++
  ) {
    const subject = subjects[subjectIndex];

    if (!subject) {
      throw new Error(
        `Data mata pelajaran index ${subjectIndex} tidak tersedia.`,
      );
    }

    const teacher =
      teachers[subjectIndex % teachers.length];

    if (!teacher) {
      throw new Error(
        `Data guru index ${subjectIndex % teachers.length} tidak tersedia.`,
      );
    }

      const assignment =
        75 + ((studentIndex + subjectIndex) % 16);

      const midterm =
        76 + ((studentIndex * 2 + subjectIndex) % 15);

      const finalExam =
        78 + ((studentIndex + subjectIndex * 2) % 13);

      const finalScore =
        assignment * 0.2 +
        midterm * 0.3 +
        finalExam * 0.5;

      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: subject.id,
          teacherId: teacher.id,
          academicYear: GRADE_ACADEMIC_YEAR,
          semester: 2,
          assignment,
          midterm,
          finalExam,
          finalScore: Number(finalScore.toFixed(2)),
          status: GradeStatus.APPROVED,
        },
      });

      gradeCount++;
    }
  }

  console.log(`${gradeCount} data nilai berhasil dibuat.`);
  console.log("");

  console.log("Membuat transkrip, kelulusan, ijazah, dan sertifikat...");

  const totalCredits = subjects.reduce(
    (total, subject) => total + subject.credits,
    0,
  );

for (let i = 0; i < students.length; i++) {
  const student = students[i];

  if (!student) {
    throw new Error(
      `Data siswa index ${i} tidak tersedia.`,
    );
  }

  const averageScore = 82 + (i % 10);

    await prisma.transcript.create({
      data: {
        studentId: student.id,
        transcriptCode: `TRX-${student.studentNumber}`,
        totalCredits,
        averageScore,
        issuedAt: new Date(),
      },
    });

    await prisma.graduation.create({
      data: {
        studentId: student.id,
        graduationYear: 2026,
        status: GraduationStatus.PASSED,
        finalAverage: averageScore,
        decisionDate: new Date(),
        notes: "Dinyatakan lulus.",
      },
    });

    const diplomaHash = hash(
      `DIPLOMA-${student.studentNumber}-2026`,
    );

    await prisma.diploma.create({
      data: {
        studentId: student.id,
        documentNumber: `IJZ-${student.studentNumber}`,
        verificationCode: `VERIFY-IJZ-${student.studentNumber}`,
        documentName: `Ijazah ${student.fullName}`,
        filePath: `/documents/diplomas/${student.studentNumber}.pdf`,
        fileHash: diplomaHash,
        fileSize: 250000,
        mimeType: "application/pdf",
        status: DocumentStatus.APPROVED,
        issuedAt: new Date(),
      },
    });

    const certificateHash = hash(
      `PKL-${student.studentNumber}-2026`,
    );

    await prisma.certificate.create({
      data: {
        studentId: student.id,
        documentNumber: `PKL-${student.studentNumber}`,
        verificationCode: `VERIFY-PKL-${student.studentNumber}`,
        documentName: `Sertifikat PKL ${student.fullName}`,
        documentType: DocumentType.PKL_CERTIFICATE,
        filePath: `/documents/certificates/${student.studentNumber}.pdf`,
        fileHash: certificateHash,
        fileSize: 180000,
        mimeType: "application/pdf",
        institutionName: "PT Industri Digital Indonesia",
        startDate: new Date(2026, 0, 5),
        endDate: new Date(2026, 2, 31),
        status: DocumentStatus.APPROVED,
        issuedAt: new Date(),
      },
    });
  }

  console.log("36 transkrip berhasil dibuat.");
  console.log("36 data kelulusan berhasil dibuat.");
  console.log("36 ijazah berhasil dibuat.");
  console.log("36 sertifikat PKL berhasil dibuat.");
  console.log("");

  console.log("Membuat audit log...");

  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        role: UserRole.STAF_TU,
        action: "SEED_DATABASE",
        resource: "system",
        status: AuditStatus.SUCCESS,
        metadata: {
          source: "development_seed",
          students: students.length,
          teachers: teachers.length,
          subjects: subjects.length,
          classes: classes.length,
        },
      },
      {
        userId: kepalaSekolah.id,
        role: UserRole.KEPALA_SEKOLAH,
        action: "SEED_DATABASE",
        resource: "system",
        status: AuditStatus.SUCCESS,
        metadata: {
          source: "development_seed",
        },
      },
      {
        userId: mitra.id,
        role: UserRole.MITRA_INDUSTRI,
        action: "SEED_DATABASE",
        resource: "system",
        status: AuditStatus.SUCCESS,
        metadata: {
          source: "development_seed",
        },
      },
    ],
  });

  console.log("Audit log berhasil dibuat.");
  console.log("");
  console.log("==============================================");
  console.log("           SEED DATABASE BERHASIL");
  console.log("==============================================");
  console.log(`Siswa      : ${students.length}`);
  console.log(`Guru       : ${teachers.length}`);
  console.log(`Mapel      : ${subjects.length}`);
  console.log(`Kelas      : ${classes.length}`);
  console.log(`Nilai      : ${gradeCount}`);
  console.log(`Transkrip  : ${students.length}`);
  console.log(`Kelulusan  : ${students.length}`);
  console.log(`Ijazah     : ${students.length}`);
  console.log(`Sertifikat : ${students.length}`);
  console.log("");
  console.log(`Password seluruh akun : ${PASSWORD}`);
  console.log("");
  console.log(`Admin      : admin@${EMAIL_DOMAIN}`);
  console.log(`Kepala     : kepala.sekolah@${EMAIL_DOMAIN}`);
  console.log(`Mitra      : mitra.industri@${EMAIL_DOMAIN}`);
  console.log(`Guru       : guru1@${EMAIL_DOMAIN} sampai guru10@${EMAIL_DOMAIN}`);
  console.log(`Siswa      : siswa1@${EMAIL_DOMAIN} sampai siswa36@${EMAIL_DOMAIN}`);
  console.log("==============================================");
}

main()
  .catch((error) => {
    console.error("");
    console.error("==============================================");
    console.error("SEED DATABASE GAGAL");
    console.error("==============================================");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });