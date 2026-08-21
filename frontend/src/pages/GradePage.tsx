import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  BookOpen,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const API_URL = "/api";

type Grade = {
  id: string;
  academicYear?: string;
  semester?: number;

  student?: {
    id: string;
    studentNumber: string;
    fullName: string;
  } | null;

  class?: {
    id: string;
    name: string;
    major?: string | null;
    academicYear?: string;
  } | null;

  subject?: {
    id: string;
    name: string;
    code?: string | null;
    credits?: number;
  } | null;

  teacher?: {
    id: string;
    employeeNumber: string;
    fullName: string;
  } | null;

  assignment?: number | null;
  midterm?: number | null;
  finalExam?: number | null;
  finalScore?: number | null;
  status?: string;
};

type GradeResponse = {
  success: boolean;
  message?: string;
  data?: {
    grades?: Grade[];
    statistics?: {
      total?: number;
      average?: number;
      passed?: number;
    };
  };
};

function getFinalScore(grade: Grade): number {
  if (
    typeof grade.finalScore === "number" &&
    grade.finalScore > 0
  ) {
    return grade.finalScore;
  }

  const assignment = grade.assignment ?? 0;
  const midterm = grade.midterm ?? 0;
  const finalExam = grade.finalExam ?? 0;

  return (
    assignment * 0.3 +
    midterm * 0.3 +
    finalExam * 0.4
  );
}

function getGradeLabel(score: number): string {
  if (score >= 90) {
    return "A";
  }

  if (score >= 80) {
    return "B";
  }

  if (score >= 70) {
    return "C";
  }

  if (score >= 60) {
    return "D";
  }

  return "E";
}

export default function GradePage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selectedGrade, setSelectedGrade] =
    useState<Grade | null>(null);

  async function loadGrades(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`${API_URL}/grades`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const result: GradeResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil data nilai.",
        );
      }

      setGrades(result.data?.grades ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data nilai.";

      setError(message);
      setGrades([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadGrades();
  }, []);

  const filteredGrades = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return grades;
    }

    return grades.filter((grade) => {
      const studentName =
        grade.student?.fullName?.toLowerCase() || "";

      const studentNumber =
        grade.student?.studentNumber?.toLowerCase() ||
        "";

      const className =
        grade.class?.name?.toLowerCase() || "";

      const major =
        grade.class?.major?.toLowerCase() || "";

      const subjectName =
        grade.subject?.name?.toLowerCase() || "";

      const subjectCode =
        grade.subject?.code?.toLowerCase() || "";

      return (
        studentName.includes(keyword) ||
        studentNumber.includes(keyword) ||
        className.includes(keyword) ||
        major.includes(keyword) ||
        subjectName.includes(keyword) ||
        subjectCode.includes(keyword)
      );
    });
  }, [grades, search]);

  const averageScore = useMemo(() => {
    if (grades.length === 0) {
      return 0;
    }

    const scores = grades.map((grade) =>
      getFinalScore(grade),
    );

    const total = scores.reduce(
      (sum, score) => sum + score,
      0,
    );

    return total / scores.length;
  }, [grades]);

  const passedCount = useMemo(() => {
    return grades.filter(
      (grade) => getFinalScore(grade) >= 70,
    ).length;
  }, [grades]);

  return (
    <div className="academic-page">
<div className="academic-header grade-header">
  <div className="grade-page-label">
    <div className="academic-icon">
      <BookOpen size={26} />
    </div>

    <div className="module-eyebrow grade-page-eyebrow">
      AKADEMIK
    </div>
  </div>

  <div className="academic-title grade-page-title">
    <div>
      <h2>Nilai</h2>

      <p>
        Kelola dan pantau nilai akademik siswa.
      </p>
    </div>
  </div>

  <button
    className="secondary-button"
    onClick={() => void loadGrades(true)}
    disabled={loading || refreshing}
  >
    <RefreshCw
      size={17}
      className={
        refreshing ? "rotate-icon" : ""
      }
    />

    {refreshing ? "Memuat..." : "Refresh"}
  </button>
</div>

      <div className="document-card-grid">
        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>Total Nilai</h3>
              <p>Data nilai tersimpan</p>
            </div>

            <div className="document-card-icon">
              <BookOpen size={20} />
            </div>
          </div>

          <div className="document-number">
            {grades.length}
          </div>

          <div className="document-label">
            Data nilai
          </div>
        </div>

        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>Rata-rata</h3>
              <p>Nilai akhir siswa</p>
            </div>

            <div className="document-card-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="document-number">
            {averageScore.toFixed(2)}
          </div>

          <div className="document-label">
            Nilai rata-rata
          </div>
        </div>

        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>Nilai Lulus</h3>
              <p>Nilai akhir ≥ 70</p>
            </div>

            <div className="document-card-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="document-number">
            {passedCount}
          </div>

          <div className="document-label">
            Data memenuhi KKM
          </div>
        </div>
      </div>

      {error && (
        <div className="student-alert">
          <AlertCircle size={19} />

          <div>
            <strong>
              Data nilai belum dapat dimuat.
            </strong>

            <span>{error}</span>
          </div>

          <button
            onClick={() => void loadGrades()}
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="academic-panel">
        <div className="academic-toolbar">
          <div className="academic-toolbar-title">
            <h3>Daftar Nilai</h3>

            <span>
              {filteredGrades.length} data ditampilkan
            </span>
          </div>

          <div className="academic-search">
            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari NIS, nama, kelas, mapel..."
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
                title="Hapus pencarian"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="academic-table-wrapper">
          {loading ? (
            <div className="table-state">
              <RefreshCw
                size={26}
                className="rotate-icon"
              />

              <strong>
                Memuat data nilai...
              </strong>

              <span>
                Mengambil data dari database sekolah.
              </span>
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="empty-academic">
              <div className="empty-academic-icon">
                <BookOpen size={28} />
              </div>

              <h3>
                {search
                  ? "Nilai tidak ditemukan"
                  : "Belum ada data nilai"}
              </h3>

              <p>
                {search
                  ? "Coba gunakan kata kunci lain."
                  : "Database belum memiliki data nilai."}
              </p>
            </div>
          ) : (
            <table className="academic-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Kelas</th>
                  <th>Mata Pelajaran</th>
                  <th>Tugas</th>
                  <th>UTS</th>
                  <th>UAS</th>
                  <th>Nilai Akhir</th>
                  <th>Predikat</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredGrades.map(
                  (grade, index) => {
                    const finalScore =
                      getFinalScore(grade);

                    const gradeLabel =
                      getGradeLabel(finalScore);

                    return (
                      <tr key={grade.id}>
                        <td>{index + 1}</td>

                        <td>
                          <strong className="academic-code">
                            {grade.student
                              ?.studentNumber || "-"}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {grade.student?.fullName ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {grade.class?.name || "-"}
                          </strong>

                          {grade.class?.major && (
                            <small>
                              {grade.class.major}
                            </small>
                          )}
                        </td>

                        <td>
                          <strong>
                            {grade.subject?.name ||
                              "-"}
                          </strong>

                          {grade.subject?.code && (
                            <small>
                              {grade.subject.code}
                            </small>
                          )}
                        </td>

                        <td>
                          {grade.assignment ?? "-"}
                        </td>

                        <td>
                          {grade.midterm ?? "-"}
                        </td>

                        <td>
                          {grade.finalExam ?? "-"}
                        </td>

                        <td>
                          <span className="score-value">
                            {finalScore.toFixed(1)}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`academic-badge ${
                              finalScore >= 70
                                ? "success"
                                : "danger"
                            }`}
                          >
                            {gradeLabel}
                          </span>
                        </td>

                        <td>
                          <div className="academic-actions-cell">
                            <button
                              className="table-action"
                              onClick={() =>
                                setSelectedGrade(
                                  grade,
                                )
                              }
                              title="Lihat detail nilai"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
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

      {selectedGrade && (
        <div
          className="form-modal-overlay"
          onClick={() =>
            setSelectedGrade(null)
          }
        >
          <div
            className="form-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="form-modal-header">
              <div>
                <div className="module-eyebrow">
                  DETAIL NILAI
                </div>

                <h3>
                  {selectedGrade.student?.fullName ||
                    "Detail Nilai"}
                </h3>
              </div>

              <button
                className="form-modal-close"
                onClick={() =>
                  setSelectedGrade(null)
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="form-content">
              <div className="form-grid">
                <div className="form-field">
                  <label>NIS</label>

                  <input
                    value={
                      selectedGrade.student
                        ?.studentNumber || "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Kelas</label>

                  <input
                    value={
                      selectedGrade.class?.name || "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Jurusan</label>

                  <input
                    value={
                      selectedGrade.class?.major || "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Tahun Akademik</label>

                  <input
                    value={
                      selectedGrade.academicYear ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Semester</label>

                  <input
                    value={
                      selectedGrade.semester ?? "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>
                    Mata Pelajaran
                  </label>

                  <input
                    value={
                      selectedGrade.subject?.name ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Nilai Tugas</label>

                  <input
                    value={
                      selectedGrade.assignment ??
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Nilai UTS</label>

                  <input
                    value={
                      selectedGrade.midterm ?? "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Nilai UAS</label>

                  <input
                    value={
                      selectedGrade.finalExam ?? "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Nilai Akhir</label>

                  <input
                    value={getFinalScore(
                      selectedGrade,
                    ).toFixed(1)}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Predikat</label>

                  <input
                    value={getGradeLabel(
                      getFinalScore(
                        selectedGrade,
                      ),
                    )}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Status</label>

                  <input
                    value={
                      selectedGrade.status || "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>Guru</label>

                  <input
                    value={
                      selectedGrade.teacher
                        ?.fullName || "-"
                    }
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="form-modal-footer">
              <button
                className="cancel-button"
                onClick={() =>
                  setSelectedGrade(null)
                }
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}