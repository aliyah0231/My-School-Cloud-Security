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
  studentId: string;
  subjectId: string;

  academicYear?: string;
  semester?: number;

  assignment?: number | null;
  midterm?: number | null;
  finalExam?: number | null;
  finalScore?: number | null;
  status?: string;

  student?: {
    id: string;
    studentNumber: string;
    fullName: string;
    class?: {
      id: string;
      name: string;
      major?: string | null;
      academicYear?: string;
    } | null;
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
};

type GradeResponse = {
  success: boolean;
  message?: string;
  data?: {
    grades?: Grade[];
  };
};

function getFinalScore(grade: Grade): number {
  if (typeof grade.finalScore === "number") {
    return grade.finalScore;
  }

  const assignment = grade.assignment ?? 0;
  const midterm = grade.midterm ?? 0;
  const finalExam = grade.finalExam ?? 0;

  return assignment * 0.3 + midterm * 0.3 + finalExam * 0.4;
}

function getGradeLabel(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
}

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return Number(value).toFixed(1);
}

export default function GradePage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);

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

      const result: GradeResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data nilai.",
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
        grade.student?.fullName?.toLowerCase() ?? "";

      const studentNumber =
        grade.student?.studentNumber?.toLowerCase() ?? "";

      const className =
        grade.student?.class?.name?.toLowerCase() ?? "";

      const subjectName =
        grade.subject?.name?.toLowerCase() ?? "";

      const subjectCode =
        grade.subject?.code?.toLowerCase() ?? "";

      return (
        studentName.includes(keyword) ||
        studentNumber.includes(keyword) ||
        className.includes(keyword) ||
        subjectName.includes(keyword) ||
        subjectCode.includes(keyword)
      );
    });
  }, [grades, search]);

  const averageScore = useMemo(() => {
    if (grades.length === 0) {
      return 0;
    }

    const total = grades.reduce(
      (sum, grade) => sum + getFinalScore(grade),
      0,
    );

    return total / grades.length;
  }, [grades]);

  const passedCount = useMemo(() => {
    return grades.filter(
      (grade) => getFinalScore(grade) >= 70,
    ).length;
  }, [grades]);

  return (
    <div className="academic-page">
      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <BookOpen size={22} />
          </div>

          <div>
            <div className="module-eyebrow">
              AKADEMIK
            </div>

            <h2>Nilai</h2>

            <p>
              Kelola dan pantau nilai akademik siswa.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="academic-refresh"
          onClick={() => void loadGrades(true)}
          disabled={loading || refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? "spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="academic-stats">
        <div className="academic-stat-card">
          <div className="academic-stat-label">
            Total Nilai
          </div>

          <div className="academic-stat-value">
            {grades.length}
          </div>

          <div className="academic-stat-description">
            Data nilai tersimpan
          </div>
        </div>

        <div className="academic-stat-card">
          <div className="academic-stat-label">
            Rata-rata
          </div>

          <div className="academic-stat-value">
            {averageScore.toFixed(2)}
          </div>

          <div className="academic-stat-description">
            Nilai akhir siswa
          </div>
        </div>

        <div className="academic-stat-card">
          <div className="academic-stat-label">
            Nilai Lulus
          </div>

          <div className="academic-stat-value">
            {passedCount}
          </div>

          <div className="academic-stat-description">
            Nilai akhir ≥ 70
          </div>
        </div>
      </div>

      {loading ? (
        <div className="academic-panel">
          <div className="empty-academic">
            <RefreshCw size={32} className="spin" />

            <h3>Memuat data nilai</h3>

            <p>
              Sedang mengambil data dari server.
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="academic-panel">
          <div className="empty-academic">
            <div className="empty-academic-icon">
              <AlertCircle size={28} />
            </div>

            <h3>Data nilai belum dapat dimuat.</h3>

            <p>{error}</p>

            <button
              type="button"
              onClick={() => void loadGrades()}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      ) : (
        <div className="academic-panel">
          <div className="academic-panel-header">
            <div>
              <h3>Daftar Nilai</h3>

              <p>
                {filteredGrades.length} data ditampilkan
              </p>
            </div>

            <div className="academic-search">
              <Search size={18} />

              <input
                type="text"
                placeholder="Cari NIS, nama, kelas, mapel..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>
          </div>

          {filteredGrades.length === 0 ? (
            <div className="empty-academic">
              <div className="empty-academic-icon">
                <BookOpen size={28} />
              </div>

              <h3>Belum ada data nilai</h3>

              <p>
                Database belum memiliki data nilai yang sesuai
                dengan pencarian.
              </p>
            </div>
          ) : (
            <div className="academic-table-wrapper">
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
                  {filteredGrades.map((grade, index) => {
                    const finalScore =
                      getFinalScore(grade);

                    const label =
                      getGradeLabel(finalScore);

                    return (
                      <tr key={grade.id}>
                        <td>{index + 1}</td>

                        <td>
                          {grade.student?.studentNumber ?? "-"}
                        </td>

                        <td>
                          <strong>
                            {grade.student?.fullName ?? "-"}
                          </strong>
                        </td>

                        <td>
                          {grade.student?.class?.name ?? "-"}
                        </td>

                        <td>
                          <div>
                            <strong>
                              {grade.subject?.name ?? "-"}
                            </strong>

                            {grade.subject?.code && (
                              <small>
                                {grade.subject.code}
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          {formatScore(grade.assignment)}
                        </td>

                        <td>
                          {formatScore(grade.midterm)}
                        </td>

                        <td>
                          {formatScore(grade.finalExam)}
                        </td>

                        <td>
                          <strong>
                            {finalScore.toFixed(1)}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`grade-badge grade-${label.toLowerCase()}`}
                          >
                            {label}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="academic-action"
                            onClick={() =>
                              setSelectedGrade(grade)
                            }
                            title="Lihat detail nilai"
                          >
                            <Eye size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedGrade && (
        <div
          className="academic-modal-backdrop"
          onClick={() => setSelectedGrade(null)}
        >
          <div
            className="academic-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="academic-modal-header">
              <div>
                <div className="module-eyebrow">
                  DETAIL NILAI
                </div>

                <h3>
                  {selectedGrade.subject?.name ?? "-"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedGrade(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="academic-detail-grid">
              <div>
                <span>NIS</span>
                <strong>
                  {selectedGrade.student?.studentNumber ??
                    "-"}
                </strong>
              </div>

              <div>
                <span>Nama</span>
                <strong>
                  {selectedGrade.student?.fullName ?? "-"}
                </strong>
              </div>

              <div>
                <span>Kelas</span>
                <strong>
                  {selectedGrade.student?.class?.name ??
                    "-"}
                </strong>
              </div>

              <div>
                <span>Mata Pelajaran</span>
                <strong>
                  {selectedGrade.subject?.name ?? "-"}
                </strong>
              </div>

              <div>
                <span>Tugas</span>
                <strong>
                  {formatScore(
                    selectedGrade.assignment,
                  )}
                </strong>
              </div>

              <div>
                <span>UTS</span>
                <strong>
                  {formatScore(
                    selectedGrade.midterm,
                  )}
                </strong>
              </div>

              <div>
                <span>UAS</span>
                <strong>
                  {formatScore(
                    selectedGrade.finalExam,
                  )}
                </strong>
              </div>

              <div>
                <span>Nilai Akhir</span>
                <strong>
                  {getFinalScore(
                    selectedGrade,
                  ).toFixed(1)}
                </strong>
              </div>

              <div>
                <span>Predikat</span>
                <strong>
                  {getGradeLabel(
                    getFinalScore(selectedGrade),
                  )}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>
                  {getFinalScore(selectedGrade) >= 70 ? (
                    <>
                      <CheckCircle2 size={16} />
                      Lulus
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      Belum Lulus
                    </>
                  )}
                </strong>
              </div>
            </div>

            <div className="academic-modal-footer">
              <button
                type="button"
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