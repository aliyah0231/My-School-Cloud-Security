import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  FileText,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Link2,
  SearchCheck,
  LoaderCircle,
} from "lucide-react";

const API_URL = "/api";

/* =========================================================
   TYPES
   ========================================================= */

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

  blockchainHash?: string | null;
  blockchainTxHash?: string | null;
  blockchainRegisteredAt?: string | null;
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

type BlockchainVerification = {
  studentId: string;
  studentName: string;
  valid: boolean;
  message: string;

  blockchainHash?: string | null;
  currentHash?: string | null;
  transactionHash?: string | null;
  registeredAt?: string | number | null;
};

/* =========================================================
   HELPERS
   ========================================================= */

function getGradeLabel(
  score: number,
) {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";

  return "E";
}

function shortenHash(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  if (value.length <= 22) {
    return value;
  }

  return `${value.slice(
    0,
    12,
  )}...${value.slice(-10)}`;
}

function formatDate(
  value?: string | number | null,
) {
  if (!value) {
    return "-";
  }

  let date: Date;

  if (
    typeof value === "number"
  ) {
    date = new Date(
      value * 1000,
    );
  } else {
    date = new Date(value);
  }

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "id-ID",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function TranscriptPage() {
  const [transcripts, setTranscripts] =
    useState<TranscriptItem[]>([]);

  const [statistics, setStatistics] =
    useState({
      totalStudents: 0,
      totalSubjects: 0,
      overallAverage: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [
    registeringStudentId,
    setRegisteringStudentId,
  ] = useState<string | null>(
    null,
  );

  const [
    verifyingStudentId,
    setVerifyingStudentId,
  ] = useState<string | null>(
    null,
  );

  const [
    verification,
    setVerification,
  ] =
    useState<BlockchainVerification | null>(
      null,
    );

  const storedUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "school_user",
        ) || "null",
      ) as {
        role?: string;
      } | null;
    } catch {
      return null;
    }
  })();

  const currentRole =
    storedUser?.role ?? "";

  const isStudent =
    currentRole === "SISWA";

  const canRegisterBlockchain =
    currentRole === "STAF_TU" ||
    currentRole ===
      "KEPALA_SEKOLAH";

  /* =======================================================
     LOAD TRANSCRIPT
     ======================================================= */

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

      const endpoint = isStudent
        ? `${API_URL}/transcripts/me`
        : `${API_URL}/transcripts`;

      const response = await fetch(
        endpoint,
        {
          method: "GET",
          credentials: "include",

          headers: {
            Accept:
              "application/json",
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

      /* =========================
         DATA SISWA
         ========================= */

      if (isStudent) {
        const student =
          result.data.student;

        const transcript =
          result.data.transcript ??
          null;

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
              result.data.class ??
              null,

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

      /* =========================
         ADMIN / GURU / TU
         ========================= */

      const adminTranscripts =
        result.data.transcripts ??
        [];

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

  /* =======================================================
     REGISTER TRANSCRIPT BLOCKCHAIN
     ======================================================= */

  async function handleRegisterBlockchain(
    item: TranscriptItem,
  ) {
    try {
      setActionError("");
      setActionMessage("");
      setVerification(null);

      setRegisteringStudentId(
        item.student.id,
      );

      const response = await fetch(
        `${API_URL}/transcripts/${item.student.id}/blockchain`,
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",
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
            "Gagal mendaftarkan transkrip ke blockchain.",
        );
      }

      setActionMessage(
        result.message ||
          `Transkrip ${item.student.fullName} berhasil didaftarkan ke blockchain.`,
      );

      await loadTranscripts(
        true,
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Gagal mendaftarkan transkrip ke blockchain.",
      );
    } finally {
      setRegisteringStudentId(
        null,
      );
    }
  }

  /* =======================================================
     VERIFY TRANSCRIPT BLOCKCHAIN
     ======================================================= */

  async function handleVerifyBlockchain(
    item: TranscriptItem,
  ) {
    try {
      setActionError("");
      setActionMessage("");
      setVerification(null);

      setVerifyingStudentId(
        item.student.id,
      );

      const response = await fetch(
        `${API_URL}/transcripts/${item.student.id}/blockchain/verify`,
        {
          method: "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
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
            "Gagal memverifikasi transkrip.",
        );
      }

      const data =
        result.data ?? {};

      /*
       * Dibuat toleran terhadap beberapa
       * struktur response backend.
       */
      const blockchain =
        data.blockchain ?? {};

      const valid =
        Boolean(
          data.valid ??
            blockchain.valid,
        );

      setVerification({
        studentId:
          item.student.id,

        studentName:
          item.student.fullName,

        valid,

        message:
          result.message ||
          (valid
            ? "Integritas transkrip sesuai dengan blockchain."
            : "Integritas transkrip tidak sesuai dengan blockchain."),

        blockchainHash:
          data.blockchainHash ??
          blockchain.blockchainHash ??
          blockchain.storedHash ??
          item.transcript
            ?.blockchainHash ??
          null,

        currentHash:
          data.currentHash ??
          blockchain.currentHash ??
          blockchain.submittedHash ??
          null,

        transactionHash:
          data.blockchainTxHash ??
          blockchain.transactionHash ??
          item.transcript
            ?.blockchainTxHash ??
          null,

        registeredAt:
          data.blockchainRegisteredAt ??
          blockchain.registeredAt ??
          item.transcript
            ?.blockchainRegisteredAt ??
          null,
      });
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi transkrip.",
      );
    } finally {
      setVerifyingStudentId(
        null,
      );
    }
  }

  useEffect(() => {
    void loadTranscripts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="academic-page">
      {/* ================================================
          HEADER
          ================================================ */}

      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <FileText size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              AKADEMIK & BLOCKCHAIN
            </div>

            <h2>
              Transkrip Nilai
            </h2>

            <p>
              Rekapitulasi nilai
              akademik dan verifikasi
              integritas transkrip.
            </p>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            void loadTranscripts(
              true,
            )
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

      {/* ================================================
          ERROR LOAD
          ================================================ */}

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

      {/* ================================================
          ACTION SUCCESS
          ================================================ */}

      {actionMessage && (
        <div
          style={{
            marginBottom: "18px",
            padding: "14px 16px",
            border:
              "1px solid #bbf7d0",
            borderRadius: "12px",
            background: "#f0fdf4",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2
            size={20}
          />

          <strong>
            {actionMessage}
          </strong>
        </div>
      )}

      {/* ================================================
          ACTION ERROR
          ================================================ */}

      {actionError && (
        <div
          style={{
            marginBottom: "18px",
            padding: "14px 16px",
            border:
              "1px solid #fecaca",
            borderRadius: "12px",
            background: "#fef2f2",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle
            size={20}
          />

          <strong>
            {actionError}
          </strong>
        </div>
      )}

      {/* ================================================
          LOADING
          ================================================ */}

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
          {/* ============================================
              STATISTICS
              ============================================ */}

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

          {/* ============================================
              DAFTAR TRANSKRIP
              ============================================ */}

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
                      <th>
                        Jurusan
                      </th>
                      <th>SKS</th>
                      <th>
                        Jumlah
                        Nilai
                      </th>
                      <th>
                        Rata-rata
                      </th>
                      <th>
                        Transkrip
                      </th>
                      <th>
                        Blockchain
                      </th>
                      <th>Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {transcripts.map(
                      (
                        item,
                        index,
                      ) => {
                        const blockchainRegistered =
                          Boolean(
                            item
                              .transcript
                              ?.blockchainHash,
                          );

                        const registering =
                          registeringStudentId ===
                          item.student
                            .id;

                        const verifying =
                          verifyingStudentId ===
                          item.student
                            .id;

                        return (
                          <tr
                            key={
                              item.id
                            }
                          >
                            <td>
                              {index +
                                1}
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
                                ? item
                                    .class
                                    .name
                                : "-"}
                            </td>

                            <td>
                              {item.class
                                ? item
                                    .class
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

                            <td>
                              {blockchainRegistered ? (
                                <div>
                                  <span className="academic-badge success">
                                    TERDAFTAR
                                  </span>

                                  <div
                                    style={{
                                      marginTop:
                                        "6px",

                                      fontSize:
                                        "11px",

                                      color:
                                        "#64748b",
                                    }}
                                    title={
                                      item
                                        .transcript
                                        ?.blockchainHash ??
                                      ""
                                    }
                                  >
                                    {shortenHash(
                                      item
                                        .transcript
                                        ?.blockchainHash,
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span
                                  className="academic-badge danger"
                                >
                                  BELUM
                                  TERDAFTAR
                                </span>
                              )}
                            </td>

                            <td>
                              <div
                                style={{
                                  display:
                                    "flex",
                                  flexWrap:
                                    "wrap",
                                  gap:
                                    "7px",
                                }}
                              >
                                {!blockchainRegistered &&
                                  canRegisterBlockchain &&
                                  item.transcript && (
                                    <button
                                      type="button"
                                      className="secondary-button"
                                      disabled={
                                        registering ||
                                        verifying
                                      }
                                      onClick={() =>
                                        void handleRegisterBlockchain(
                                          item,
                                        )
                                      }
                                      style={{
                                        padding:
                                          "7px 10px",
                                      }}
                                    >
                                      {registering ? (
                                        <LoaderCircle
                                          size={
                                            15
                                          }
                                          className="rotate-icon"
                                        />
                                      ) : (
                                        <Link2
                                          size={
                                            15
                                          }
                                        />
                                      )}

                                      {registering
                                        ? "Mendaftarkan..."
                                        : "Daftarkan"}
                                    </button>
                                  )}

                                {blockchainRegistered && (
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    disabled={
                                      registering ||
                                      verifying
                                    }
                                    onClick={() =>
                                      void handleVerifyBlockchain(
                                        item,
                                      )
                                    }
                                    style={{
                                      padding:
                                        "7px 10px",
                                    }}
                                  >
                                    {verifying ? (
                                      <LoaderCircle
                                        size={
                                          15
                                        }
                                        className="rotate-icon"
                                      />
                                    ) : (
                                      <SearchCheck
                                        size={
                                          15
                                        }
                                      />
                                    )}

                                    {verifying
                                      ? "Memeriksa..."
                                      : "Verifikasi"}
                                  </button>
                                )}

                                {!item.transcript && (
                                  <span
                                    style={{
                                      fontSize:
                                        "12px",
                                      color:
                                        "#94a3b8",
                                    }}
                                  >
                                    Transkrip
                                    belum
                                    tersedia
                                  </span>
                                )}
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

          {/* ============================================
              BLOCKCHAIN VERIFICATION RESULT
              ============================================ */}

          {verification && (
            <div
              className="academic-panel"
              style={{
                marginTop:
                  "18px",
              }}
            >
              <div
                style={{
                  padding:
                    "20px",
                }}
              >
                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap:
                      "10px",
                    marginBottom:
                      "18px",
                  }}
                >
                  <ShieldCheck
                    size={25}
                  />

                  <div>
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      Hasil
                      Verifikasi
                      Blockchain
                    </h3>

                    <small>
                      Transkrip{" "}
                      {
                        verification.studentName
                      }
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    padding:
                      "14px 16px",
                    borderRadius:
                      "10px",

                    border:
                      verification.valid
                        ? "1px solid #bbf7d0"
                        : "1px solid #fecaca",

                    background:
                      verification.valid
                        ? "#f0fdf4"
                        : "#fef2f2",

                    color:
                      verification.valid
                        ? "#166534"
                        : "#b91c1c",

                    fontWeight:
                      700,
                  }}
                >
                  {verification.valid
                    ? "✓ VALID — data transkrip saat ini sesuai dengan hash blockchain."
                    : "✕ TIDAK VALID — data transkrip saat ini berbeda dengan data yang telah dicatat pada blockchain."}
                </div>

                <div
                  style={{
                    display:
                      "grid",

                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",

                    gap:
                      "12px",

                    marginTop:
                      "16px",
                  }}
                >
                  <div
                    style={{
                      padding:
                        "14px",

                      border:
                        "1px solid #e2e8f0",

                      borderRadius:
                        "10px",
                    }}
                  >
                    <small>
                      Hash Blockchain
                    </small>

                    <div
                      title={
                        verification.blockchainHash ??
                        ""
                      }
                      style={{
                        marginTop:
                          "6px",
                        fontWeight:
                          700,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {shortenHash(
                        verification.blockchainHash,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding:
                        "14px",

                      border:
                        "1px solid #e2e8f0",

                      borderRadius:
                        "10px",
                    }}
                  >
                    <small>
                      Hash Data
                      Sekarang
                    </small>

                    <div
                      title={
                        verification.currentHash ??
                        ""
                      }
                      style={{
                        marginTop:
                          "6px",
                        fontWeight:
                          700,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {shortenHash(
                        verification.currentHash,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding:
                        "14px",

                      border:
                        "1px solid #e2e8f0",

                      borderRadius:
                        "10px",
                    }}
                  >
                    <small>
                      Transaction
                      Hash
                    </small>

                    <div
                      title={
                        verification.transactionHash ??
                        ""
                      }
                      style={{
                        marginTop:
                          "6px",
                        fontWeight:
                          700,
                        overflowWrap:
                          "anywhere",
                      }}
                    >
                      {shortenHash(
                        verification.transactionHash,
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      padding:
                        "14px",

                      border:
                        "1px solid #e2e8f0",

                      borderRadius:
                        "10px",
                    }}
                  >
                    <small>
                      Waktu
                      Registrasi
                    </small>

                    <div
                      style={{
                        marginTop:
                          "6px",
                        fontWeight:
                          700,
                      }}
                    >
                      {formatDate(
                        verification.registeredAt,
                      )}
                    </div>
                  </div>
                </div>

                {verification.message && (
                  <div
                    style={{
                      marginTop:
                        "12px",
                      color:
                        "#64748b",
                      fontSize:
                        "12px",
                    }}
                  >
                    {
                      verification.message
                    }
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================
              DETAIL NILAI
              ============================================ */}

          {transcripts.length >
            0 && (
            <div
              className="academic-panel"
              style={{
                marginTop:
                  "18px",
              }}
            >
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
                ).length ===
                0 ? (
                  <div className="empty-academic">
                    <div className="empty-academic-icon">
                      <BookOpen
                        size={28}
                      />
                    </div>

                    <h3>
                      Belum ada
                      nilai
                    </h3>

                    <p>
                      Belum
                      terdapat nilai
                      yang disetujui
                      untuk siswa
                      ini.
                    </p>
                  </div>
                ) : (
                  <table className="academic-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>NIS</th>
                        <th>
                          Siswa
                        </th>
                        <th>Kode</th>
                        <th>
                          Mata
                          Pelajaran
                        </th>
                        <th>
                          Semester
                        </th>
                        <th>SKS</th>
                        <th>
                          Nilai
                        </th>
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
                                  {index +
                                    1}
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