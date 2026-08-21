import { useEffect, useState } from "react";
import {
  RefreshCw,
  FileText,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = "/api";

type Student = {
  id: string;
  studentNumber: string;
  fullName: string;
};

type Transcript = {
  id: string;
  transcriptCode: string;
  totalCredits: number;
  averageScore: number | null;
  issuedAt: string | null;
};

type Grade = {
  id: string;
  academicYear: string;
  semester: number;
  finalScore: number | null;

  subject: {
    id: string;
    code: string;
    name: string;
    credits: number;
  };
};

type TranscriptItem = {
  id: string;

  student: Student;

  class: {
    id: string;
    name: string;
    major: string;
    academicYear: string;
  } | null;

  transcript: Transcript | null;

  summary: {
    totalCredits: number;
    averageScore: number;
    totalSubjects: number;
  };

  grades: Grade[];
};

function getGradeLabel(score: number) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";

  return "E";
}

export default function TranscriptPage() {
  const [transcripts, setTranscripts] =
    useState<TranscriptItem[]>([]);

  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalSubjects: 0,
    overallAverage: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadTranscripts(
    showRefresh = false,
  ) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Ambil data user yang sedang login
      const storedUser = JSON.parse(
        localStorage.getItem("school_user") ||
          "null",
      ) as { role?: string } | null;

      const isStudent =
        storedUser?.role === "SISWA";

      // SISWA menggunakan endpoint /me
      // Role lain menggunakan endpoint biasa
      const endpoint = isStudent
        ? `${API_URL}/transcripts/me`
        : `${API_URL}/transcripts`;

      const response = await fetch(
        endpoint,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result: any =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengambil data transkrip.",
        );
      }

      if (!result.data) {
        throw new Error(
          "Data transkrip tidak tersedia.",
        );
      }

      // ==============================
      // DATA UNTUK SISWA
      // ==============================

      if (isStudent) {
        const student =
          result.data.student;

        const transcript =
          result.data.transcript ?? null;

        const grades: Grade[] =
          result.data.grades ?? [];

        if (!student) {
          throw new Error(
            "Data siswa tidak ditemukan.",
          );
        }

        const totalCredits =
          Number(
            result.data.summary
              ?.totalCredits ?? 0,
          );

        const averageScore =
          Number(
            result.data.summary
              ?.averageScore ?? 0,
          );

        const totalSubjects =
          Number(
            result.data.summary
              ?.totalSubjects ??
              grades.length,
          );

        const studentItem: TranscriptItem =
          {
            id: student.id,

            student: {
              id: student.id,
              studentNumber:
                student.studentNumber,
              fullName:
                student.fullName,
            },

            class:
              result.data.class ?? null,

            transcript,

            summary: {
              totalCredits,
              averageScore,
              totalSubjects,
            },

            grades,
          };

        setTranscripts([
          studentItem,
        ]);

        setStatistics({
          totalStudents: 1,
          totalSubjects,
          overallAverage:
            averageScore,
        });

        return;
      }

      // ==============================
      // DATA UNTUK ADMIN / GURU / TU
      // ==============================

      const adminTranscripts =
        result.data.transcripts ?? [];

      setTranscripts(
        adminTranscripts,
      );

      setStatistics(
        result.data.statistics ?? {
          totalStudents: 0,
          totalSubjects: 0,
          overallAverage: 0,
        },
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data transkrip.";

      setError(message);

      setTranscripts([]);

      setStatistics({
        totalStudents: 0,
        totalSubjects: 0,
        overallAverage: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadTranscripts();
  }, []);

  return (
    <div className="academic-page">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <FileText size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              AKADEMIK
            </div>

            <h2>
              Transkrip Nilai
            </h2>

            <p>
              Lihat rekapitulasi nilai
              akademik siswa.
            </p>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            void loadTranscripts(true)
          }
          disabled={
            loading ||
            refreshing
          }
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? "rotate-icon"
                : ""
            }
          />

          {refreshing
            ? "Memuat..."
            : "Refresh"}
        </button>
      </div>

      {/* ========================= */}
      {/* ERROR */}
      {/* ========================= */}

      {error && (
        <div className="student-alert">
          <AlertCircle
            size={19}
          />

          <div>
            <strong>
              Data transkrip belum
              dapat dimuat.
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            onClick={() =>
              void loadTranscripts()
            }
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ========================= */}
      {/* LOADING */}
      {/* ========================= */}

      {loading ? (
        <div className="academic-panel">
          <div className="table-state">
            <RefreshCw
              size={26}
              className="rotate-icon"
            />

            <strong>
              Memuat data
              transkrip...
            </strong>

            <span>
              Mengambil data dari
              database sekolah.
            </span>
          </div>
        </div>
      ) : (
        <>

          {/* ===================== */}
          {/* STATISTIK */}
          {/* ===================== */}

          <div className="document-card-grid">

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Total Siswa
                  </h3>

                  <p>
                    Siswa dengan
                    data transkrip
                  </p>
                </div>

                <div className="document-card-icon">
                  <GraduationCap
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics
                    .totalStudents
                }
              </div>

              <div className="document-label">
                siswa
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Total Nilai
                  </h3>

                  <p>
                    Nilai yang
                    disetujui
                  </p>
                </div>

                <div className="document-card-icon">
                  <BookOpen
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics
                    .totalSubjects
                }
              </div>

              <div className="document-label">
                data nilai
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Rata-rata
                  </h3>

                  <p>
                    Nilai akademik
                  </p>
                </div>

                <div className="document-card-icon">
                  <CheckCircle2
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {Number(
                  statistics
                    .overallAverage,
                ).toFixed(2)}
              </div>

              <div className="document-label">
                nilai rata-rata
              </div>
            </div>
          </div>

          {/* ===================== */}
          {/* DAFTAR TRANSKRIP */}
          {/* ===================== */}

          <div className="academic-panel">

            <div className="academic-toolbar">
              <div className="academic-toolbar-title">

                <h3>
                  Daftar Transkrip
                  Nilai
                </h3>

                <span>
                  {
                    transcripts.length
                  }{" "}
                  data siswa
                </span>

              </div>
            </div>

            <div className="academic-table-wrapper">

              {transcripts.length ===
              0 ? (
                <div className="empty-academic">

                  <div className="empty-academic-icon">
                    <FileText
                      size={28}
                    />
                  </div>

                  <h3>
                    Belum ada data
                    transkrip
                  </h3>

                  <p>
                    Belum terdapat
                    data nilai siswa
                    yang disetujui.
                  </p>

                </div>
              ) : (
                <table className="academic-table">

                  <thead>
                    <tr>
                      <th>No</th>
                      <th>NIS</th>
                      <th>
                        Nama Siswa
                      </th>
                      <th>Kelas</th>
                      <th>Jurusan</th>
                      <th>SKS</th>
                      <th>
                        Jumlah Nilai
                      </th>
                      <th>
                        Rata-rata
                      </th>
                      <th>
                        Transkrip
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {transcripts.map(
                      (
                        item,
                        index,
                      ) => (
                        <tr
                          key={
                            item.id
                          }
                        >

                          <td>
                            {
                              index +
                              1
                            }
                          </td>

                          <td>
                            <strong className="academic-code">
                              {
                                item
                                  .student
                                  .studentNumber
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item
                                .student
                                .fullName
                            }
                          </td>

                          <td>
                            {item.class
                              ? item.class
                                  .name
                              : "-"}
                          </td>

                          <td>
                            {item.class
                              ? item.class
                                  .major
                              : "-"}
                          </td>

                          <td>
                            {
                              item
                                .summary
                                .totalCredits
                            }
                          </td>

                          <td>
                            {
                              item
                                .summary
                                .totalSubjects
                            }
                          </td>

                          <td>
                            <span className="score-value">
                              {Number(
                                item
                                  .summary
                                  .averageScore,
                              ).toFixed(
                                2,
                              )}
                            </span>
                          </td>

                          <td>
                            {item.transcript ? (
                              <span className="academic-badge success">
                                {
                                  item
                                    .transcript
                                    .transcriptCode
                                }
                              </span>
                            ) : (
                              <span className="academic-badge danger">
                                Belum
                                terbit
                              </span>
                            )}
                          </td>

                        </tr>
                      ),
                    )}

                  </tbody>
                </table>
              )}

            </div>
          </div>

          {/* ===================== */}
          {/* DETAIL NILAI */}
          {/* ===================== */}

          {transcripts.length >
            0 && (
            <div className="academic-panel">

              <div className="academic-toolbar">
                <div className="academic-toolbar-title">

                  <h3>
                    Detail Nilai
                  </h3>

                </div>
              </div>

              <div className="academic-table-wrapper">

                {transcripts.flatMap(
                  (item) =>
                    item.grades.map(
                      (grade) => ({
                        item,
                        grade,
                      }),
                    ),
                ).length === 0 ? (
                  <div className="empty-academic">

                    <div className="empty-academic-icon">
                      <BookOpen
                        size={28}
                      />
                    </div>

                    <h3>
                      Belum ada nilai
                    </h3>

                    <p>
                      Belum terdapat
                      nilai yang
                      disetujui untuk
                      siswa ini.
                    </p>

                  </div>
                ) : (
                  <table className="academic-table">

                    <thead>
                      <tr>
                        <th>No</th>
                        <th>NIS</th>
                        <th>Siswa</th>
                        <th>Kode</th>
                        <th>
                          Mata Pelajaran
                        </th>
                        <th>
                          Semester
                        </th>
                        <th>SKS</th>
                        <th>Nilai</th>
                        <th>
                          Predikat
                        </th>
                      </tr>
                    </thead>

                    <tbody>

                      {transcripts
                        .flatMap(
                          (item) =>
                            item.grades.map(
                              (
                                grade,
                              ) => ({
                                item,
                                grade,
                              }),
                            ),
                        )
                        .map(
                          (
                            {
                              item,
                              grade,
                            },
                            index,
                          ) => {
                            const score =
                              grade.finalScore !==
                              null
                                ? Number(
                                    grade.finalScore,
                                  )
                                : 0;

                            return (
                              <tr
                                key={`${item.id}-${grade.id}`}
                              >

                                <td>
                                  {
                                    index +
                                    1
                                  }
                                </td>

                                <td>
                                  {
                                    item
                                      .student
                                      .studentNumber
                                  }
                                </td>

                                <td>
                                  {
                                    item
                                      .student
                                      .fullName
                                  }
                                </td>

                                <td>
                                  <strong className="academic-code">
                                    {
                                      grade
                                        .subject
                                        .code
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    grade
                                      .subject
                                      .name
                                  }
                                </td>

                                <td>
                                  {
                                    grade
                                      .semester
                                  }
                                </td>

                                <td>
                                  {
                                    grade
                                      .subject
                                      .credits
                                  }
                                </td>

                                <td>
                                  <span className="score-value">
                                    {score.toFixed(
                                      1,
                                    )}
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={`academic-badge ${
                                      score >=
                                      70
                                        ? "success"
                                        : "danger"
                                    }`}
                                  >
                                    {getGradeLabel(
                                      score,
                                    )}
                                  </span>
                                </td>

                              </tr>
                            );
                          },
                        )}

                    </tbody>
                  </table>
                )}

              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}