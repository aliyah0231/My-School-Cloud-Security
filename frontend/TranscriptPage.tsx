import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  FileText,
  Eye,
  X,
  AlertCircle,
} from "lucide-react";

const API_URL = "/api";

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

type Transcript = {
  id: string;

  student: {
    id: string;
    studentNumber: string;
    fullName: string;
  };

  class: {
    id: string;
    name: string;
    major: string;
    academicYear: string;
  } | null;

  transcript: {
    id: string;
    transcriptCode: string;
    totalCredits: number;
    averageScore: number | null;
    issuedAt: string | null;
  } | null;

  summary: {
    totalCredits: number;
    averageScore: number;
    totalSubjects: number;
  };

  grades: Grade[];
};

type TranscriptResponse = {
  success: boolean;
  message?: string;

  data?: {
    transcripts?: Transcript[];

    statistics?: {
      totalStudents: number;
      totalSubjects: number;
      overallAverage: number;
    };
  };
};

function getPredicate(score: number) {
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

export default function TranscriptPage() {
  const [transcripts, setTranscripts] =
    useState<Transcript[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [selectedTranscript, setSelectedTranscript] =
    useState<Transcript | null>(null);

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

      const response = await fetch(
        `${API_URL}/transcripts`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result: TranscriptResponse =
        await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil data transkrip.",
        );
      }

      setTranscripts(
        result.data?.transcripts || [],
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data transkrip.";

      setError(message);
      setTranscripts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadTranscripts();
  }, []);

  const filteredTranscripts = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return transcripts;
    }

    return transcripts.filter(
      (transcript) => {
        const nis =
          transcript.student.studentNumber
            .toLowerCase();

        const name =
          transcript.student.fullName
            .toLowerCase();

        const className =
          transcript.class?.name
            .toLowerCase() || "";

        const major =
          transcript.class?.major
            .toLowerCase() || "";

        return (
          nis.includes(keyword) ||
          name.includes(keyword) ||
          className.includes(keyword) ||
          major.includes(keyword)
        );
      },
    );
  }, [transcripts, search]);

  const totalCredits = useMemo(() => {
    return transcripts.reduce(
      (total, transcript) =>
        total +
        transcript.summary.totalCredits,
      0,
    );
  }, [transcripts]);

  const averageScore = useMemo(() => {
    if (transcripts.length === 0) {
      return 0;
    }

    const values = transcripts
      .map(
        (transcript) =>
          transcript.summary.averageScore,
      )
      .filter((score) => score > 0);

    if (values.length === 0) {
      return 0;
    }

    return (
      values.reduce(
        (total, score) =>
          total + score,
        0,
      ) / values.length
    );
  }, [transcripts]);

  return (
    <div className="academic-page">
      <div className="academic-header grade-header">
        <div className="grade-page-label">
          <div className="academic-icon">
            <FileText size={26} />
          </div>

          <div className="module-eyebrow grade-page-eyebrow">
            AKADEMIK
          </div>
        </div>

        <div className="academic-title grade-page-title">
          <div>
            <h2>Transkrip</h2>

            <p>
              Kelola dan pantau transkrip akademik siswa.
            </p>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            void loadTranscripts(true)
          }
          disabled={
            loading || refreshing
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

      <div className="document-card-grid">
        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>Total Siswa</h3>

              <p>
                Data transkrip siswa
              </p>
            </div>

            <div className="document-card-icon">
              <FileText size={20} />
            </div>
          </div>

          <div className="document-number">
            {transcripts.length}
          </div>

          <div className="document-label">
            Siswa memiliki transkrip
          </div>
        </div>

        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>Total SKS</h3>

              <p>
                Total kredit akademik
              </p>
            </div>

            <div className="document-card-icon">
              <FileText size={20} />
            </div>
          </div>

          <div className="document-number">
            {totalCredits}
          </div>

          <div className="document-label">
            SKS tercatat
          </div>
        </div>

        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>Rata-rata</h3>

              <p>
                Rata-rata nilai siswa
              </p>
            </div>

            <div className="document-card-icon">
              <FileText size={20} />
            </div>
          </div>

          <div className="document-number">
            {averageScore.toFixed(2)}
          </div>

          <div className="document-label">
            Nilai akademik
          </div>
        </div>
      </div>

      {error && (
        <div className="student-alert">
          <AlertCircle size={19} />

          <div>
            <strong>
              Data transkrip belum dapat dimuat.
            </strong>

            <span>{error}</span>
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

      <div className="academic-panel">
        <div className="academic-toolbar">
          <div className="academic-toolbar-title">
            <h3>Daftar Transkrip</h3>

            <span>
              {filteredTranscripts.length} data
              ditampilkan
            </span>
          </div>

          <div className="academic-search">
            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Cari NIS, nama, kelas, jurusan..."
            />

            {search && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
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
                Memuat data transkrip...
              </strong>

              <span>
                Mengambil data dari database sekolah.
              </span>
            </div>
          ) : filteredTranscripts.length ===
            0 ? (
            <div className="empty-academic">
              <div className="empty-academic-icon">
                <FileText size={28} />
              </div>

              <h3>
                {search
                  ? "Transkrip tidak ditemukan"
                  : "Belum ada data transkrip"}
              </h3>

              <p>
                {search
                  ? "Coba gunakan kata kunci lain."
                  : "Belum ada siswa dengan data transkrip."}
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
                  <th>Jurusan</th>
                  <th>Total SKS</th>
                  <th>Rata-rata</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredTranscripts.map(
                  (
                    transcript,
                    index,
                  ) => (
                    <tr
                      key={
                        transcript.id
                      }
                    >
                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {transcript.student
                          .studentNumber}
                      </td>

                      <td>
                        {
                          transcript.student
                            .fullName
                        }
                      </td>

                      <td>
                        {
                          transcript.class
                            ?.name || "-"
                        }
                      </td>

                      <td>
                        {
                          transcript.class
                            ?.major || "-"
                        }
                      </td>

                      <td>
                        {
                          transcript.summary
                            .totalCredits
                        }
                      </td>

                      <td>
                        <span className="score-value">
                          {transcript.summary.averageScore.toFixed(
                            2,
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`academic-badge ${
                            transcript.summary
                              .averageScore >=
                            70
                              ? "success"
                              : "danger"
                          }`}
                        >
                          {transcript.summary
                            .averageScore >=
                          70
                            ? "Lulus"
                            : "Belum Lulus"}
                        </span>
                      </td>

                      <td>
                        <div className="academic-actions-cell">
                          <button
                            className="table-action"
                            onClick={() =>
                              setSelectedTranscript(
                                transcript,
                              )
                            }
                            title="Lihat detail transkrip"
                          >
                            <Eye
                              size={16}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedTranscript && (
        <div
          className="form-modal-overlay"
          onClick={() =>
            setSelectedTranscript(
              null,
            )
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
                  DETAIL TRANSKRIP
                </div>

                <h3>
                  {
                    selectedTranscript
                      .student.fullName
                  }
                </h3>
              </div>

              <button
                className="form-modal-close"
                onClick={() =>
                  setSelectedTranscript(
                    null,
                  )
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
                      selectedTranscript
                        .student
                        .studentNumber
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Kelas</label>

                  <input
                    value={
                      selectedTranscript
                        .class?.name ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>Jurusan</label>

                  <input
                    value={
                      selectedTranscript
                        .class?.major ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Total SKS</label>

                  <input
                    value={
                      selectedTranscript
                        .summary
                        .totalCredits
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>Rata-rata</label>

                  <input
                    value={selectedTranscript.summary.averageScore.toFixed(
                      2,
                    )}
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>
                    Kode Transkrip
                  </label>

                  <input
                    value={
                      selectedTranscript
                        .transcript
                        ?.transcriptCode ||
                      "-"
                    }
                    readOnly
                  />
                </div>
              </div>

              <div className="academic-table-wrapper transcript-detail-table">
                <table className="academic-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Mata Pelajaran</th>
                      <th>Semester</th>
                      <th>SKS</th>
                      <th>Nilai</th>
                      <th>Predikat</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedTranscript.grades.map(
                      (grade, index) => {
                        const score =
                          grade.finalScore
                            ? Number(
                                grade.finalScore,
                              )
                            : 0;

                        return (
                          <tr
                            key={
                              grade.id
                            }
                          >
                            <td>
                              {index +
                                1}
                            </td>

                            <td>
                              <strong>
                                {
                                  grade
                                    .subject
                                    .name
                                }
                              </strong>

                              <small>
                                {
                                  grade
                                    .subject
                                    .code
                                }
                              </small>
                            </td>

                            <td>
                              {
                                grade.semester
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
                              {score.toFixed(
                                1,
                              )}
                            </td>

                            <td>
                              {getPredicate(
                                score,
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-modal-footer">
              <button
                className="cancel-button"
                onClick={() =>
                  setSelectedTranscript(
                    null,
                  )
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
