import {
  useEffect,
  useState,
} from "react";

import {
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

const API_URL = "/api";

type Student = {
  id: string;
  studentNumber: string;
  fullName: string;
};

type Diploma = {
  id: string;
  documentNumber: string;
  verificationCode: string;
  documentName: string;
  fileHash: string | null;
  fileSize: number | null;
  mimeType: string | null;
  status: string;
  issuedAt: string | null;
  createdAt: string;
};

type DiplomaItem = {
  id: string;

  student: Student;

  class: {
    id: string;
    name: string;
    major: string;
    academicYear: string;
  } | null;

  diploma: Diploma;
};

type DiplomaResponse = {
  success: boolean;
  message?: string;

  data?: {
    diplomas: DiplomaItem[];

    statistics: {
      totalStudents: number;
      totalDiplomas: number;
      approvedDiplomas: number;
      pendingDiplomas: number;
      rejectedDiplomas: number;
    };
  };
};

type StudentResponse = {
  success: boolean;
  message?: string;

  data?:
    | Student[]
    | {
        students?: Student[];
      };
};

type UploadResponse = {
  success: boolean;
  message?: string;

  data?: {
    id: string;
    documentNumber: string;
    verificationCode: string;
    documentName: string;
    fileHash: string;
    status: string;

    blockchain?: {
      transactionHash: string;
    };
  };
};

function getStatusLabel(
  status: string,
) {
  switch (status) {
    case "APPROVED":
      return "Disetujui";

    case "PENDING":
      return "Menunggu";

    case "REJECTED":
      return "Ditolak";

    default:
      return status;
  }
}

function getStatusClass(
  status: string,
) {
  switch (status) {
    case "APPROVED":
      return "success";

    case "PENDING":
      return "warning";

    case "REJECTED":
      return "danger";

    default:
      return "";
  }
}

export default function DiplomaPage() {
  const [diplomas, setDiplomas] =
    useState<DiplomaItem[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [statistics, setStatistics] =
    useState({
      totalStudents: 0,
      totalDiplomas: 0,
      approvedDiplomas: 0,
      pendingDiplomas: 0,
      rejectedDiplomas: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showUpload, setShowUpload] =
    useState(false);

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [uploadSuccess, setUploadSuccess] =
    useState("");

  const [lastVerificationCode, setLastVerificationCode] =
    useState("");

  const [lastTransactionHash, setLastTransactionHash] =
    useState("");

  const storedUser = JSON.parse(
    localStorage.getItem(
      "school_user",
    ) || "null",
  ) as {
    role?: string;
  } | null;

  const isStudent =
    storedUser?.role ===
    "SISWA";

  const canUpload =
    storedUser?.role ===
    "STAF_TU";

const canApprove =
  storedUser?.role ===
  "KEPALA_SEKOLAH";

  async function loadDiplomas(
    showRefresh = false,
  ) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const endpoint =
        isStudent
          ? `${API_URL}/diplomas/me`
          : `${API_URL}/diplomas`;

      const response =
        await fetch(
          endpoint,
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

      const result: DiplomaResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengambil data ijazah.",
        );
      }

      if (!result.data) {
        throw new Error(
          "Data ijazah tidak tersedia.",
        );
      }

      setDiplomas(
        result.data.diplomas ??
          [],
      );

      setStatistics(
        result.data.statistics ?? {
          totalStudents: 0,
          totalDiplomas: 0,
          approvedDiplomas: 0,
          pendingDiplomas: 0,
          rejectedDiplomas: 0,
        },
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data ijazah.";

      setError(message);

      setDiplomas([]);

      setStatistics({
        totalStudents: 0,
        totalDiplomas: 0,
        approvedDiplomas: 0,
        pendingDiplomas: 0,
        rejectedDiplomas: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadStudents() {
    if (!canUpload) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/students`,
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

      const result: StudentResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengambil data siswa.",
        );
      }

      let studentList: Student[] =
        [];

      if (
        Array.isArray(
          result.data,
        )
      ) {
        studentList =
          result.data;
      } else if (
        result.data &&
        Array.isArray(
          result.data.students,
        )
      ) {
        studentList =
          result.data.students;
      }

      setStudents(
        studentList,
      );
    } catch (err) {
      console.error(
        "[ERROR] loadStudents:",
        err,
      );

      setStudents([]);
    }
  }

  async function handleUpload(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setUploadError("");
      setUploadSuccess("");
      setLastVerificationCode("");
      setLastTransactionHash("");

      if (!selectedStudentId) {
        throw new Error(
          "Silakan pilih siswa.",
        );
      }

      if (!selectedFile) {
        throw new Error(
          "Silakan pilih file PDF ijazah.",
        );
      }

      if (
        selectedFile.type !==
        "application/pdf"
      ) {
        throw new Error(
          "File harus berformat PDF.",
        );
      }

      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "studentId",
        selectedStudentId,
      );

      formData.append(
        "diploma",
        selectedFile,
      );

      const response =
        await fetch(
          `${API_URL}/diplomas/upload`,
          {
            method: "POST",

            credentials:
              "include",

            body: formData,
          },
        );

      const result: UploadResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengupload ijazah.",
        );
      }

      const verificationCode =
        result.data
          ?.verificationCode ??
        "";

      const transactionHash =
        result.data
          ?.blockchain
          ?.transactionHash ??
        "";

      setUploadSuccess(
        result.message ||
          "Ijazah berhasil diupload.",
      );

      setLastVerificationCode(
        verificationCode,
      );

      setLastTransactionHash(
        transactionHash,
      );

      setSelectedStudentId(
        "",
      );

      setSelectedFile(
        null,
      );

      await loadDiplomas(
        true,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengupload ijazah.";

      setUploadError(
        message,
      );
    } finally {
      setUploading(
        false,
      );
    }
  }

  function closeUploadForm() {
    if (uploading) {
      return;
    }

    setShowUpload(
      false,
    );

    setSelectedStudentId(
      "",
    );

    setSelectedFile(
      null,
    );

    setUploadError(
      "",
    );

    setUploadSuccess(
      "",
    );

    setLastVerificationCode(
      "",
    );

    setLastTransactionHash(
      "",
    );
  }

async function handleApproveDiploma(
  diplomaId: string,
) {
  const confirmed =
    window.confirm(
      "Apakah Anda yakin ingin menyetujui dan menerbitkan ijazah ini?",
    );

  if (!confirmed) {
    return;
  }

  try {
    const response =
      await fetch(
        `${API_URL}/diplomas/${diplomaId}/approve`,
        {
          method:
            "PATCH",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        },
      );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      throw new Error(
        result.message ||
          "Gagal menyetujui ijazah.",
      );
    }

    alert(
      "Ijazah berhasil disetujui dan diterbitkan.",
    );

    await loadDiplomas(
      true,
    );
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Gagal menyetujui ijazah.";

    alert(message);
  }
}

async function handleRejectDiploma(
  diplomaId: string,
) {
  const confirmed = window.confirm(
    "Apakah Anda yakin ingin menolak ijazah ini?",
  );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/diplomas/${diplomaId}/reject`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      },
    );

    const contentType =
      response.headers.get("content-type");

    const result =
      contentType?.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
      throw new Error(
        result?.message ||
          `Gagal menolak ijazah. HTTP ${response.status}`,
      );
    }

    if (!result?.success) {
      throw new Error(
        result?.message ||
          "Gagal menolak ijazah.",
      );
    }

    alert("Ijazah berhasil ditolak.");

    await loadDiplomas(true);
  } catch (error) {
    console.error(
      "[ERROR] reject diploma:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Gagal menolak ijazah.";

    alert(message);
  }
}

  useEffect(() => {
    void loadDiplomas();

    if (canUpload) {
      void loadStudents();
    }
  }, []);

  return (
    <div className="academic-page">
      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <FileText
              size={26}
            />
          </div>

          <div>
            <div className="module-eyebrow">
              AKADEMIK
            </div>

            <h2>
              Ijazah
            </h2>

            <p>
              Kelola dan verifikasi
              ijazah seluruh siswa.
            </p>
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            gap:
              "10px",
          }}
        >
          {canUpload && (
            <button
              className="primary-button"
              onClick={() =>
                setShowUpload(
                  true,
                )
              }
            >
              <Upload
                size={17}
              />

              Upload Ijazah
            </button>
          )}

          <button
            className="secondary-button"
            onClick={() =>
              void loadDiplomas(
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
      </div>

      {showUpload &&
        canUpload && (
          <div className="academic-panel">
            <div className="academic-toolbar">
              <div className="academic-toolbar-title">
                <h3>
                  Upload Ijazah
                </h3>

                <span>
                  Hash SHA-256 akan
                  dicatat ke blockchain.
                </span>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeUploadForm
                }
                disabled={
                  uploading
                }
              >
                <X
                  size={17}
                />

                Tutup
              </button>
            </div>

            {uploadError && (
              <div className="student-alert">
                <AlertCircle
                  size={19}
                />

                <div>
                  <strong>
                    Upload gagal.
                  </strong>

                  <span>
                    {uploadError}
                  </span>
                </div>
              </div>
            )}

            {uploadSuccess && (
              <div className="student-alert">
                <CheckCircle2
                  size={19}
                />

                <div>
                  <strong>
                    Upload berhasil.
                  </strong>

                  <span>
                    {uploadSuccess}
                  </span>
                </div>
              </div>
            )}

            {lastVerificationCode && (
              <div
                style={{
                  marginTop:
                    "14px",
                  padding:
                    "14px",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "10px",
                }}
              >
                <strong>
                  Kode Verifikasi
                </strong>

                <div
                  style={{
                    marginTop:
                      "6px",
                    fontFamily:
                      "monospace",
                    wordBreak:
                      "break-all",
                  }}
                >
                  {
                    lastVerificationCode
                  }
                </div>
              </div>
            )}

            {lastTransactionHash && (
              <div
                style={{
                  marginTop:
                    "10px",
                  padding:
                    "14px",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "10px",
                }}
              >
                <strong>
                  Transaction Hash
                </strong>

                <div
                  style={{
                    marginTop:
                      "6px",
                    fontFamily:
                      "monospace",
                    wordBreak:
                      "break-all",
                  }}
                >
                  {
                    lastTransactionHash
                  }
                </div>
              </div>
            )}

            <form
              onSubmit={
                handleUpload
              }
              style={{
                marginTop:
                  "18px",
                display:
                  "grid",
                gap:
                  "16px",
              }}
            >
              <div>
                <label>
                  <strong>
                    Pilih Siswa
                  </strong>
                </label>

                <select
                  value={
                    selectedStudentId
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedStudentId(
                      event
                        .target
                        .value,
                    )
                  }
                  disabled={
                    uploading
                  }
                  style={{
                    width:
                      "100%",
                    marginTop:
                      "8px",
                    padding:
                      "12px",
                  }}
                >
                  <option
                    value=""
                  >
                    -- Pilih
                    Siswa --
                  </option>

                  {students.map(
                    (
                      student,
                    ) => (
                      <option
                        key={
                          student.id
                        }
                        value={
                          student.id
                        }
                      >
                        {
                          student.studentNumber
                        }{" "}
                        -{" "}
                        {
                          student.fullName
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label>
                  <strong>
                    File Ijazah
                    PDF
                  </strong>
                </label>

                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={
                    uploading
                  }
                  onChange={(
                    event,
                  ) =>
                    setSelectedFile(
                      event
                        .target
                        .files?.[0] ??
                        null,
                    )
                  }
                  style={{
                    display:
                      "block",
                    marginTop:
                      "8px",
                  }}
                />

                {selectedFile && (
                  <div
                    style={{
                      marginTop:
                        "8px",
                    }}
                  >
                    File:{" "}
                    <strong>
                      {
                        selectedFile.name
                      }
                    </strong>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    uploading
                  }
                >
                  {uploading ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="rotate-icon"
                      />

                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload
                        size={17}
                      />

                      Upload ke
                      Blockchain
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      {error && (
        <div className="student-alert">
          <AlertCircle
            size={19}
          />

          <div>
            <strong>
              Data ijazah belum
              dapat dimuat.
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            onClick={() =>
              void loadDiplomas()
            }
          >
            Coba Lagi
          </button>
        </div>
      )}

      {loading ? (
        <div className="academic-panel">
          <div className="table-state">
            <RefreshCw
              size={26}
              className="rotate-icon"
            />

            <strong>
              Memuat data
              ijazah...
            </strong>

            <span>
              Mengambil data dari
              database sekolah.
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="document-card-grid">
            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Total Ijazah
                  </h3>

                  <p>
                    Seluruh dokumen
                  </p>
                </div>

                <div className="document-card-icon">
                  <FileText
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics.totalDiplomas
                }
              </div>

              <div className="document-label">
                dokumen
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Disetujui
                  </h3>

                  <p>
                    Ijazah valid
                  </p>
                </div>

                <div className="document-card-icon">
                  <CheckCircle2
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics.approvedDiplomas
                }
              </div>

              <div className="document-label">
                dokumen
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Menunggu
                  </h3>

                  <p>
                    Perlu pemeriksaan
                  </p>
                </div>

                <div className="document-card-icon">
                  <Clock3
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics.pendingDiplomas
                }
              </div>

              <div className="document-label">
                dokumen
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>
                    Ditolak
                  </h3>

                  <p>
                    Perlu diperbaiki
                  </p>
                </div>

                <div className="document-card-icon">
                  <XCircle
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics.rejectedDiplomas
                }
              </div>

              <div className="document-label">
                dokumen
              </div>
            </div>
          </div>

          <div className="academic-panel">
            <div className="academic-toolbar">
              <div className="academic-toolbar-title">
                <h3>
                  Daftar Ijazah
                </h3>

                <span>
                  {
                    diplomas.length
                  }{" "}
                  data
                </span>
              </div>
            </div>

            <div className="academic-table-wrapper">
              {diplomas.length ===
              0 ? (
                <div className="empty-academic">
                  <div className="empty-academic-icon">
                    <FileText
                      size={28}
                    />
                  </div>

                  <h3>
                    Belum ada data
                    ijazah
                  </h3>

                  <p>
                    Belum terdapat
                    dokumen ijazah
                    siswa.
                  </p>
                </div>
              ) : (
                <table className="academic-table">
                  <thead>
                    <tr>
                      <th>
                        No
                      </th>

                      <th>
                        NIS
                      </th>

                      <th>
                        Nama Siswa
                      </th>

                      <th>
                        Kelas
                      </th>

                      <th>
                        Nomor Ijazah
                      </th>

                      <th>
                        Kode
                        Verifikasi
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Tanggal
                        Terbit
                      </th>
                    </tr>
                  </thead>

{canApprove && (
  <th>
    Aksi
  </th>
)}

                  <tbody>
                    {diplomas.map(
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
                            {
                              item
                                .diploma
                                .documentNumber
                            }
                          </td>

                          <td>
                            <strong className="academic-code">
                              {
                                item
                                  .diploma
                                  .verificationCode
                              }
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`academic-badge ${getStatusClass(
                                item
                                  .diploma
                                  .status,
                              )}`}
                            >
                              {getStatusLabel(
                                item
                                  .diploma
                                  .status,
                              )}
                            </span>
                          </td>

                          <td>
                            {item
                              .diploma
                              .issuedAt
                              ? new Date(
                                  item
                                    .diploma
                                    .issuedAt,
                                ).toLocaleDateString(
                                  "id-ID",
                                )
                              : "Belum diterbitkan"}
                          </td>

{canApprove && (
  <td>
    {item.diploma.status === "PENDING" ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <button
          type="button"
          className="primary-button"
          onClick={() =>
            void handleApproveDiploma(
              item.diploma.id,
            )
          }
          style={{
            minHeight: "34px",
            padding: "0 12px",
            fontSize: "11px",
          }}
        >
          <CheckCircle2 size={15} />
          Setujui
        </button>

        <button
          type="button"
          onClick={() =>
            void handleRejectDiploma(
              item.diploma.id,
            )
          }
          style={{
            minHeight: "34px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "0 12px",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#dc2626",
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <XCircle size={15} />
          Tolak
        </button>
      </div>
    ) : item.diploma.status === "APPROVED" ? (
      <span
        style={{
          color: "#168247",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        Sudah diterbitkan
      </span>
    ) : (
      <span
        style={{
          color: "#dc2626",
          fontSize: "11px",
          fontWeight: 700,
        }}
      >
        Ditolak
      </span>
    )}
  </td>
)}                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}