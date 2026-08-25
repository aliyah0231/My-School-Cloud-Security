import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  RefreshCw,
  BookOpen,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  Pencil,
  ShieldCheck,
  LoaderCircle,
  Link2,
} from "lucide-react";

const API_URL = "/api";

/* =========================================================
   TYPES
   ========================================================= */

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

type BlockchainAudit = {
  gradeId: string;

  studentName: string;
  subjectName: string;

  oldScore: number;
  newScore: number;

  auditLogId?: string | null;

  verificationCode?: string | null;

  documentType?: string | null;

  hash?: string | null;

  transactionHash?: string | null;

  changedAt?: string | null;
};

type UpdateGradeResponse = {
  success: boolean;
  message?: string;

  data?: {
    grade?: Grade;

    updatedGrade?: Grade;

    audit?: {
      auditLogId?: string;
      verificationCode?: string;
      documentType?: string;
      hash?: string;
      transactionHash?: string;
      changedAt?: string;
    };
  };
};

/* =========================================================
   HELPERS
   ========================================================= */

function getFinalScore(
  grade: Grade,
): number {
  if (
    typeof grade.finalScore ===
      "number" &&
    grade.finalScore >= 0
  ) {
    return grade.finalScore;
  }

  const assignment =
    grade.assignment ?? 0;

  const midterm =
    grade.midterm ?? 0;

  const finalExam =
    grade.finalExam ?? 0;

  return (
    assignment * 0.3 +
    midterm * 0.3 +
    finalExam * 0.4
  );
}

function getGradeLabel(
  score: number,
): string {
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

function shortenHash(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  if (value.length <= 26) {
    return value;
  }

  return `${value.slice(
    0,
    13,
  )}...${value.slice(-11)}`;
}

function formatDate(
  value?: string | null,
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
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

export default function GradePage() {
  const [grades, setGrades] =
    useState<Grade[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    selectedGrade,
    setSelectedGrade,
  ] = useState<Grade | null>(
    null,
  );

  const [
    editingGrade,
    setEditingGrade,
  ] = useState<Grade | null>(
    null,
  );

  const [
    editFinalScore,
    setEditFinalScore,
  ] = useState("");

  const [
    updateLoading,
    setUpdateLoading,
  ] = useState(false);

  const [
    updateError,
    setUpdateError,
  ] = useState("");

  const [
    updateMessage,
    setUpdateMessage,
  ] = useState("");

  const [
    blockchainAudit,
    setBlockchainAudit,
  ] =
    useState<BlockchainAudit | null>(
      null,
    );

  /* =======================================================
     CURRENT ROLE
     ======================================================= */

  const currentUser = (() => {
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
    currentUser?.role ?? "";

  const canEditGrade =
    currentRole === "GURU" ||
    currentRole === "STAF_TU" ||
    currentRole ===
      "KEPALA_SEKOLAH";

  /* =======================================================
     LOAD GRADES
     ======================================================= */

  async function loadGrades(
    showRefresh = false,
  ) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response =
        await fetch(
          `${API_URL}/grades`,
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

      const result: GradeResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengambil data nilai.",
        );
      }

      setGrades(
        result.data?.grades ??
          [],
      );
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

  /* =======================================================
     FILTER
     ======================================================= */

  const filteredGrades =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return grades;
      }

      return grades.filter(
        (grade) => {
          const studentName =
            grade.student
              ?.fullName
              ?.toLowerCase() ||
            "";

          const studentNumber =
            grade.student
              ?.studentNumber
              ?.toLowerCase() ||
            "";

          const className =
            grade.class
              ?.name
              ?.toLowerCase() ||
            "";

          const major =
            grade.class
              ?.major
              ?.toLowerCase() ||
            "";

          const subjectName =
            grade.subject
              ?.name
              ?.toLowerCase() ||
            "";

          const subjectCode =
            grade.subject
              ?.code
              ?.toLowerCase() ||
            "";

          return (
            studentName.includes(
              keyword,
            ) ||
            studentNumber.includes(
              keyword,
            ) ||
            className.includes(
              keyword,
            ) ||
            major.includes(
              keyword,
            ) ||
            subjectName.includes(
              keyword,
            ) ||
            subjectCode.includes(
              keyword,
            )
          );
        },
      );
    }, [grades, search]);

  /* =======================================================
     STATISTICS
     ======================================================= */

  const averageScore =
    useMemo(() => {
      if (
        grades.length === 0
      ) {
        return 0;
      }

      const scores =
        grades.map(
          (grade) =>
            getFinalScore(
              grade,
            ),
        );

      const total =
        scores.reduce(
          (sum, score) =>
            sum + score,
          0,
        );

      return (
        total /
        scores.length
      );
    }, [grades]);

  const passedCount =
    useMemo(() => {
      return grades.filter(
        (grade) =>
          getFinalScore(
            grade,
          ) >= 70,
      ).length;
    }, [grades]);

  /* =======================================================
     OPEN EDIT
     ======================================================= */

  function openEditGrade(
    grade: Grade,
  ) {
    const currentScore =
      getFinalScore(grade);

    setEditingGrade(grade);

    setEditFinalScore(
      currentScore.toFixed(
        2,
      ),
    );

    setUpdateError("");
    setUpdateMessage("");
  }

  function closeEditGrade() {
    if (updateLoading) {
      return;
    }

    setEditingGrade(null);

    setEditFinalScore("");

    setUpdateError("");
  }

  /* =======================================================
     UPDATE GRADE + BLOCKCHAIN AUDIT
     ======================================================= */

  async function handleUpdateGrade() {
    if (!editingGrade) {
      return;
    }

    try {
      setUpdateError("");
      setUpdateMessage("");

      const newScore =
        Number(
          editFinalScore,
        );

      if (
        Number.isNaN(
          newScore,
        )
      ) {
        throw new Error(
          "Nilai akhir harus berupa angka.",
        );
      }

      if (
        newScore < 0 ||
        newScore > 100
      ) {
        throw new Error(
          "Nilai akhir harus berada antara 0 sampai 100.",
        );
      }

      const oldScore =
        getFinalScore(
          editingGrade,
        );

      if (
        Number(
          oldScore.toFixed(2),
        ) ===
        Number(
          newScore.toFixed(2),
        )
      ) {
        throw new Error(
          "Nilai baru sama dengan nilai lama.",
        );
      }

      const confirmed =
        window.confirm(
          `Ubah nilai ${editingGrade.student?.fullName ?? "siswa"} dari ${oldScore.toFixed(
            2,
          )} menjadi ${newScore.toFixed(
            2,
          )}?\n\nPerubahan ini akan dicatat sebagai audit blockchain.`,
        );

      if (!confirmed) {
        return;
      }

      setUpdateLoading(true);

      const response =
        await fetch(
          `${API_URL}/grades/${editingGrade.id}`,
          {
            method: "PUT",

            credentials:
              "include",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                finalScore:
                  newScore,
              }),
          },
        );

      const result =
        (await response.json()) as UpdateGradeResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            `Gagal memperbarui nilai. HTTP ${response.status}`,
        );
      }

      const audit =
        result.data?.audit;

      /*
       * Update dianggap sukses hanya jika backend
       * mengembalikan bukti audit blockchain.
       */
      if (
        !audit
          ?.verificationCode ||
        !audit.hash ||
        !audit.transactionHash
      ) {
        throw new Error(
          "Nilai diperbarui tetapi informasi audit blockchain tidak lengkap.",
        );
      }

      setBlockchainAudit({
        gradeId:
          editingGrade.id,

        studentName:
          editingGrade
            .student
            ?.fullName ??
          "-",

        subjectName:
          editingGrade
            .subject
            ?.name ??
          "-",

        oldScore,

        newScore,

        auditLogId:
          audit.auditLogId ??
          null,

        verificationCode:
          audit.verificationCode ??
          null,

        documentType:
          audit.documentType ??
          null,

        hash:
          audit.hash ??
          null,

        transactionHash:
          audit.transactionHash ??
          null,

        changedAt:
          audit.changedAt ??
          null,
      });

      setUpdateMessage(
        result.message ||
          "Nilai berhasil diperbarui dan perubahan dicatat ke blockchain.",
      );

      setEditingGrade(null);

      setEditFinalScore("");

      await loadGrades(
        true,
      );
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui nilai.",
      );
    } finally {
      setUpdateLoading(false);
    }
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="academic-page">
      {/* =================================================
          HEADER
          ================================================= */}

      <div className="academic-header grade-header">
        <div className="grade-page-label">
          <div className="academic-icon">
            <BookOpen
              size={26}
            />
          </div>

          <div className="module-eyebrow grade-page-eyebrow">
            AKADEMIK & BLOCKCHAIN
          </div>
        </div>

        <div className="academic-title grade-page-title">
          <div>
            <h2>
              Nilai
            </h2>

            <p>
              Kelola nilai akademik
              dan catat perubahan
              melalui audit
              blockchain.
            </p>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            void loadGrades(
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

      {/* =================================================
          STATISTICS
          ================================================= */}

      <div className="document-card-grid">
        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>
                Total Nilai
              </h3>

              <p>
                Data nilai
                tersimpan
              </p>
            </div>

            <div className="document-card-icon">
              <BookOpen
                size={20}
              />
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
              <h3>
                Rata-rata
              </h3>

              <p>
                Nilai akhir
                siswa
              </p>
            </div>

            <div className="document-card-icon">
              <CheckCircle2
                size={20}
              />
            </div>
          </div>

          <div className="document-number">
            {averageScore.toFixed(
              2,
            )}
          </div>

          <div className="document-label">
            Nilai rata-rata
          </div>
        </div>

        <div className="document-card">
          <div className="document-card-header">
            <div>
              <h3>
                Nilai Lulus
              </h3>

              <p>
                Nilai akhir ≥ 70
              </p>
            </div>

            <div className="document-card-icon">
              <CheckCircle2
                size={20}
              />
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

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="student-alert">
          <AlertCircle
            size={19}
          />

          <div>
            <strong>
              Data nilai belum
              dapat dimuat.
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            onClick={() =>
              void loadGrades()
            }
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* =================================================
          UPDATE SUCCESS
          ================================================= */}

      {updateMessage && (
        <div
          style={{
            marginBottom:
              "18px",

            padding:
              "14px 16px",

            border:
              "1px solid #bbf7d0",

            borderRadius:
              "12px",

            background:
              "#f0fdf4",

            color:
              "#166534",

            display: "flex",

            alignItems:
              "center",

            gap: "10px",
          }}
        >
          <CheckCircle2
            size={20}
          />

          <div>
            <strong>
              Update Nilai
              Berhasil
            </strong>

            <div
              style={{
                fontSize:
                  "13px",

                marginTop:
                  "3px",
              }}
            >
              {updateMessage}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          BLOCKCHAIN AUDIT RESULT
          ================================================= */}

      {blockchainAudit && (
        <div
          className="academic-panel"
          style={{
            marginBottom:
              "20px",
          }}
        >
          <div
            style={{
              padding: "22px",
            }}
          >
            <div
              style={{
                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",

                gap: "14px",

                flexWrap:
                  "wrap",

                marginBottom:
                  "18px",
              }}
            >
              <div
                style={{
                  display: "flex",

                  alignItems:
                    "center",

                  gap: "12px",
                }}
              >
                <div className="document-card-icon">
                  <ShieldCheck
                    size={21}
                  />
                </div>

                <div>
                  <div className="module-eyebrow">
                    BLOCKCHAIN
                    AUDIT
                  </div>

                  <h3
                    style={{
                      margin:
                        "2px 0 0",
                    }}
                  >
                    Perubahan
                    Nilai Tercatat
                  </h3>
                </div>
              </div>

              <span className="academic-badge success">
                AUDIT BERHASIL
              </span>
            </div>

            <div
              style={{
                padding:
                  "14px 16px",

                borderRadius:
                  "10px",

                background:
                  "#f0fdf4",

                border:
                  "1px solid #bbf7d0",

                color:
                  "#166534",

                display: "flex",

                gap: "10px",

                alignItems:
                  "center",

                marginBottom:
                  "18px",
              }}
            >
              <CheckCircle2
                size={20}
              />

              <strong>
                Perubahan nilai
                berhasil dicatat
                ke blockchain dan
                AuditLog.
              </strong>
            </div>

            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(210px, 1fr))",

                gap: "12px",
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
                  Siswa
                </small>

                <div
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",
                  }}
                >
                  {
                    blockchainAudit.studentName
                  }
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
                  Mata Pelajaran
                </small>

                <div
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",
                  }}
                >
                  {
                    blockchainAudit.subjectName
                  }
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
                  Nilai Lama
                </small>

                <div
                  style={{
                    fontWeight:
                      800,

                    fontSize:
                      "18px",

                    marginTop:
                      "5px",
                  }}
                >
                  {blockchainAudit.oldScore.toFixed(
                    2,
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
                  Nilai Baru
                </small>

                <div
                  style={{
                    fontWeight:
                      800,

                    fontSize:
                      "18px",

                    marginTop:
                      "5px",
                  }}
                >
                  {blockchainAudit.newScore.toFixed(
                    2,
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
                  Document Type
                </small>

                <div
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",
                  }}
                >
                  {blockchainAudit.documentType ||
                    "GRADE_AUDIT"}
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
                  Waktu Perubahan
                </small>

                <div
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",
                  }}
                >
                  {formatDate(
                    blockchainAudit.changedAt,
                  )}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop:
                  "14px",

                display: "grid",

                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",

                gap: "12px",
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
                  Verification
                  Code
                </small>

                <div
                  title={
                    blockchainAudit.verificationCode ||
                    ""
                  }
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {shortenHash(
                    blockchainAudit.verificationCode,
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
                  SHA-256 Audit
                  Hash
                </small>

                <div
                  title={
                    blockchainAudit.hash ||
                    ""
                  }
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {shortenHash(
                    blockchainAudit.hash,
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
                  Transaction Hash
                </small>

                <div
                  title={
                    blockchainAudit.transactionHash ||
                    ""
                  }
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {shortenHash(
                    blockchainAudit.transactionHash,
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
                  Audit Log ID
                </small>

                <div
                  title={
                    blockchainAudit.auditLogId ||
                    ""
                  }
                  style={{
                    fontWeight:
                      700,

                    marginTop:
                      "5px",

                    overflowWrap:
                      "anywhere",
                  }}
                >
                  {shortenHash(
                    blockchainAudit.auditLogId,
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TABLE
          ================================================= */}

      <div className="academic-panel">
        <div className="academic-toolbar">
          <div className="academic-toolbar-title">
            <h3>
              Daftar Nilai
            </h3>

            <span>
              {
                filteredGrades.length
              }{" "}
              data ditampilkan
            </span>
          </div>

          <div className="academic-search">
            <Search
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Cari NIS, nama, kelas, mapel..."
            />

            {search && (
              <button
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
                title="Hapus pencarian"
              >
                <X
                  size={16}
                />
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
                Memuat data
                nilai...
              </strong>

              <span>
                Mengambil data
                dari database
                sekolah.
              </span>
            </div>
          ) : filteredGrades.length ===
            0 ? (
            <div className="empty-academic">
              <div className="empty-academic-icon">
                <BookOpen
                  size={28}
                />
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
                  <th>
                    Nama Siswa
                  </th>
                  <th>Kelas</th>
                  <th>
                    Mata Pelajaran
                  </th>
                  <th>Tugas</th>
                  <th>UTS</th>
                  <th>UAS</th>
                  <th>
                    Nilai Akhir
                  </th>
                  <th>
                    Predikat
                  </th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredGrades.map(
                  (
                    grade,
                    index,
                  ) => {
                    const finalScore =
                      getFinalScore(
                        grade,
                      );

                    const gradeLabel =
                      getGradeLabel(
                        finalScore,
                      );

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
                          <strong className="academic-code">
                            {grade
                              .student
                              ?.studentNumber ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {grade
                              .student
                              ?.fullName ||
                              "-"}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {grade
                              .class
                              ?.name ||
                              "-"}
                          </strong>

                          {grade
                            .class
                            ?.major && (
                            <small>
                              {
                                grade
                                  .class
                                  .major
                              }
                            </small>
                          )}
                        </td>

                        <td>
                          <strong>
                            {grade
                              .subject
                              ?.name ||
                              "-"}
                          </strong>

                          {grade
                            .subject
                            ?.code && (
                            <small>
                              {
                                grade
                                  .subject
                                  .code
                              }
                            </small>
                          )}
                        </td>

                        <td>
                          {grade.assignment ??
                            "-"}
                        </td>

                        <td>
                          {grade.midterm ??
                            "-"}
                        </td>

                        <td>
                          {grade.finalExam ??
                            "-"}
                        </td>

                        <td>
                          <span className="score-value">
                            {finalScore.toFixed(
                              1,
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`academic-badge ${
                              finalScore >=
                              70
                                ? "success"
                                : "danger"
                            }`}
                          >
                            {
                              gradeLabel
                            }
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
                              <Eye
                                size={16}
                              />
                            </button>

                            {canEditGrade && (
                              <button
                                className="table-action"
                                onClick={() =>
                                  openEditGrade(
                                    grade,
                                  )
                                }
                                title="Ubah nilai dengan audit blockchain"
                              >
                                <Pencil
                                  size={
                                    16
                                  }
                                />
                              </button>
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

      {/* =================================================
          DETAIL MODAL
          ================================================= */}

      {selectedGrade && (
        <div
          className="form-modal-overlay"
          onClick={() =>
            setSelectedGrade(
              null,
            )
          }
        >
          <div
            className="form-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="form-modal-header">
              <div>
                <div className="module-eyebrow">
                  DETAIL NILAI
                </div>

                <h3>
                  {selectedGrade
                    .student
                    ?.fullName ||
                    "Detail Nilai"}
                </h3>
              </div>

              <button
                className="form-modal-close"
                onClick={() =>
                  setSelectedGrade(
                    null,
                  )
                }
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <div className="form-content">
              <div className="form-grid">
                <div className="form-field">
                  <label>
                    NIS
                  </label>

                  <input
                    value={
                      selectedGrade
                        .student
                        ?.studentNumber ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Kelas
                  </label>

                  <input
                    value={
                      selectedGrade
                        .class
                        ?.name ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Jurusan
                  </label>

                  <input
                    value={
                      selectedGrade
                        .class
                        ?.major ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Tahun
                    Akademik
                  </label>

                  <input
                    value={
                      selectedGrade.academicYear ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Semester
                  </label>

                  <input
                    value={
                      selectedGrade.semester ??
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>
                    Mata
                    Pelajaran
                  </label>

                  <input
                    value={
                      selectedGrade
                        .subject
                        ?.name ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nilai Tugas
                  </label>

                  <input
                    value={
                      selectedGrade.assignment ??
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nilai UTS
                  </label>

                  <input
                    value={
                      selectedGrade.midterm ??
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nilai UAS
                  </label>

                  <input
                    value={
                      selectedGrade.finalExam ??
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nilai Akhir
                  </label>

                  <input
                    value={getFinalScore(
                      selectedGrade,
                    ).toFixed(
                      1,
                    )}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Predikat
                  </label>

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
                  <label>
                    Status
                  </label>

                  <input
                    value={
                      selectedGrade.status ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>
                    Guru
                  </label>

                  <input
                    value={
                      selectedGrade
                        .teacher
                        ?.fullName ||
                      "-"
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
                  setSelectedGrade(
                    null,
                  )
                }
              >
                Tutup
              </button>

              {canEditGrade && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    const grade =
                      selectedGrade;

                    setSelectedGrade(
                      null,
                    );

                    openEditGrade(
                      grade,
                    );
                  }}
                >
                  <Pencil
                    size={16}
                  />

                  Ubah Nilai
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          EDIT + BLOCKCHAIN MODAL
          ================================================= */}

      {editingGrade && (
        <div
          className="form-modal-overlay"
          onClick={
            closeEditGrade
          }
        >
          <div
            className="form-modal"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="form-modal-header">
              <div>
                <div className="module-eyebrow">
                  BLOCKCHAIN
                  GRADE AUDIT
                </div>

                <h3>
                  Ubah Nilai
                </h3>

                <p
                  style={{
                    margin:
                      "5px 0 0",

                    color:
                      "#64748b",

                    fontSize:
                      "13px",
                  }}
                >
                  Perubahan akan
                  dicatat sebagai
                  audit blockchain.
                </p>
              </div>

              <button
                className="form-modal-close"
                onClick={
                  closeEditGrade
                }
                disabled={
                  updateLoading
                }
              >
                <X
                  size={19}
                />
              </button>
            </div>

            <div className="form-content">
              <div className="form-grid">
                <div className="form-field">
                  <label>
                    NIS
                  </label>

                  <input
                    value={
                      editingGrade
                        .student
                        ?.studentNumber ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Siswa
                  </label>

                  <input
                    value={
                      editingGrade
                        .student
                        ?.fullName ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field full">
                  <label>
                    Mata
                    Pelajaran
                  </label>

                  <input
                    value={
                      editingGrade
                        .subject
                        ?.name ||
                      "-"
                    }
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nilai Lama
                  </label>

                  <input
                    value={getFinalScore(
                      editingGrade,
                    ).toFixed(
                      2,
                    )}
                    readOnly
                  />
                </div>

                <div className="form-field">
                  <label>
                    Nilai Baru
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      editFinalScore
                    }
                    onChange={(
                      event,
                    ) =>
                      setEditFinalScore(
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={
                      updateLoading
                    }
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "16px",

                  padding:
                    "14px 16px",

                  border:
                    "1px solid #bfdbfe",

                  borderRadius:
                    "10px",

                  background:
                    "#eff6ff",

                  color:
                    "#1e40af",

                  display: "flex",

                  gap: "10px",

                  alignItems:
                    "flex-start",
                }}
              >
                <ShieldCheck
                  size={20}
                />

                <div>
                  <strong>
                    Audit
                    Blockchain
                  </strong>

                  <div
                    style={{
                      marginTop:
                        "4px",

                      fontSize:
                        "12px",

                      lineHeight:
                        1.5,
                    }}
                  >
                    Backend akan
                    membuat hash
                    audit,
                    mendaftarkannya
                    ke blockchain,
                    kemudian
                    menyimpan
                    perubahan ke
                    PostgreSQL dan
                    AuditLog.
                  </div>
                </div>
              </div>

              {updateError && (
                <div
                  style={{
                    marginTop:
                      "14px",

                    padding:
                      "12px 14px",

                    background:
                      "#fef2f2",

                    color:
                      "#b91c1c",

                    border:
                      "1px solid #fecaca",

                    borderRadius:
                      "9px",

                    display:
                      "flex",

                    gap: "8px",
                  }}
                >
                  <AlertCircle
                    size={18}
                  />

                  <span>
                    {
                      updateError
                    }
                  </span>
                </div>
              )}
            </div>

            <div className="form-modal-footer">
              <button
                className="cancel-button"
                onClick={
                  closeEditGrade
                }
                disabled={
                  updateLoading
                }
              >
                Batal
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  void handleUpdateGrade()
                }
                disabled={
                  updateLoading
                }
              >
                {updateLoading ? (
                  <LoaderCircle
                    size={17}
                    className="rotate-icon"
                  />
                ) : (
                  <Link2
                    size={17}
                  />
                )}

                {updateLoading
                  ? "Mencatat Blockchain..."
                  : "Simpan + Blockchain"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}