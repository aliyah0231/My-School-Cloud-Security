import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  RefreshCw,
  Award,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  Upload,
  X,
  Building2,
  CalendarDays,
  ShieldCheck,
  PenLine,
  SearchCheck,
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

type Certificate = {
  id: string;
  documentNumber: string;
  verificationCode: string;
  documentName: string;
  documentType: string;
  fileHash: string | null;
  fileSize: number | null;
  mimeType: string | null;
  institutionName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  issuedAt: string | null;

  dudiWalletAddress?: string | null;
  dudiSignedHash?: string | null;
  dudiSignedAt?: string | null;
  dudiSignedBy?: string | null;

  createdAt: string;
};

type CertificateItem = {
  id: string;
  student: Student;
  class: {
    id: string;
    name: string;
    major: string;
    academicYear: string;
  } | null;
  certificate: Certificate;
};

type CertificateResponse = {
  success: boolean;
  message?: string;
  data?: {
    certificates: CertificateItem[];
    statistics: {
      totalStudents: number;
      totalCertificates: number;
      approvedCertificates: number;
      pendingCertificates: number;
      rejectedCertificates: number;
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
    documentType: string;
    fileHash: string;
    status: string;
    blockchain?: {
      transactionHash: string;
    };
  };
};

type ActionResponse = {
  success: boolean;
  message?: string;
};

type DudiSignResponse = {
  success: boolean;
  message?: string;
  data?: {
    certificate?: {
      id: string;
      documentNumber: string;
      verificationCode: string;
      documentName: string;
      documentType: string;
      status: string;
      dudiWalletAddress: string | null;
      dudiSignedHash: string | null;
      dudiSignedAt: string | null;
      dudiSignedBy: string | null;
    };
    digitalSignature?: {
      valid: boolean;
      walletAddress: string;
      signedHash: string;
      signedAt: string;
      signerRole: string;
    };
    blockchain?: {
      valid: boolean;
      documentType: string;
      registeredAt: number;
    };
  };
};

type DudiVerifyResponse = {
  success: boolean;
  message?: string;
  data?: {
    valid: boolean;
    integrity: {
      currentFileHash: string;
      storedFileHash: string;
      signedHash: string;
      storedHashMatches: boolean;
      signedHashMatches: boolean;
    };
    digitalSignature: {
      valid: boolean;
      walletAddress: string;
      recoveredAddress: string | null;
      signedAt: string | null;
      signedByUserId: string | null;
    };
    blockchain: {
      valid: boolean;
      documentType: string;
      registeredAt: number;
    };
  };
};

type VerificationResult = {
  certificateId: string;
  valid: boolean;
  signatureValid: boolean;
  blockchainValid: boolean;
  storedHashMatches: boolean;
  signedHashMatches: boolean;
  walletAddress: string;
  message: string;
};

/* =========================================================
   HELPERS
   ========================================================= */

function getStatusLabel(status: string) {
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

function getStatusClass(status: string) {
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

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID");
}

function shortenWallet(wallet: string | null | undefined) {
  if (!wallet) return "-";
  if (wallet.length <= 14) return wallet;

  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

function VerificationBox({
  label,
  valid,
}: {
  label: string;
  valid: boolean;
}) {
  return (
    <div
      style={{
        padding: "14px",
        border: valid
          ? "1px solid #bbf7d0"
          : "1px solid #fecaca",
        borderRadius: "10px",
        background: valid
          ? "#f0fdf4"
          : "#fef2f2",
      }}
    >
      <small
        style={{
          display: "block",
          color: "#64748b",
          marginBottom: "7px",
        }}
      >
        {label}
      </small>

      <strong
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: valid ? "#15803d" : "#dc2626",
        }}
      >
        {valid ? (
          <CheckCircle2 size={17} />
        ) : (
          <XCircle size={17} />
        )}

        {valid ? "VALID" : "INVALID"}
      </strong>
    </div>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CertificatePage() {
  const [certificates, setCertificates] =
    useState<CertificateItem[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    approvedCertificates: 0,
    pendingCertificates: 0,
    rejectedCertificates: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [actionLoadingId, setActionLoadingId] =
    useState<string | null>(null);

  const [dudiMessage, setDudiMessage] = useState("");
  const [dudiError, setDudiError] = useState("");
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  /* =======================================================
     USER / ROLE
     ======================================================= */

  const storedUser = JSON.parse(
    localStorage.getItem("school_user") || "null",
  ) as { role?: string } | null;

  const isStudent = storedUser?.role === "SISWA";
  const canUpload = storedUser?.role === "STAF_TU";
  const canApprove =
    storedUser?.role === "KEPALA_SEKOLAH";
  const canDudiSign =
    storedUser?.role === "MITRA_INDUSTRI";

  /* =======================================================
     UPLOAD STATE
     ======================================================= */

  const [showUpload, setShowUpload] = useState(false);
  const [selectedStudentId, setSelectedStudentId] =
    useState("");
  const [documentType, setDocumentType] =
    useState("PKL_CERTIFICATE");
  const [institutionName, setInstitutionName] =
    useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] =
    useState("");
  const [lastVerificationCode, setLastVerificationCode] =
    useState("");
  const [lastTransactionHash, setLastTransactionHash] =
    useState("");
  const [lastFileHash, setLastFileHash] =
    useState("");

  /* =======================================================
     LOAD CERTIFICATES
     ======================================================= */

  async function loadCertificates(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const endpoint = isStudent
        ? `${API_URL}/certificates/me`
        : `${API_URL}/certificates`;

      const response = await fetch(endpoint, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const result =
        (await response.json()) as CertificateResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil data sertifikat PKL.",
        );
      }

      if (!result.data) {
        throw new Error(
          "Data sertifikat tidak tersedia.",
        );
      }

      setCertificates(result.data.certificates ?? []);
      setStatistics(
        result.data.statistics ?? {
          totalStudents: 0,
          totalCertificates: 0,
          approvedCertificates: 0,
          pendingCertificates: 0,
          rejectedCertificates: 0,
        },
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data sertifikat PKL.";

      setError(message);
      setCertificates([]);
      setStatistics({
        totalStudents: 0,
        totalCertificates: 0,
        approvedCertificates: 0,
        pendingCertificates: 0,
        rejectedCertificates: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     LOAD STUDENTS
     ======================================================= */

  async function loadStudents() {
    if (!canUpload) return;

    try {
      const response = await fetch(
        `${API_URL}/students`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        (await response.json()) as StudentResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Gagal mengambil data siswa.",
        );
      }

      let studentList: Student[] = [];

      if (Array.isArray(result.data)) {
        studentList = result.data;
      } else if (
        result.data &&
        Array.isArray(result.data.students)
      ) {
        studentList = result.data.students;
      }

      setStudents(studentList);
    } catch (err) {
      console.error("[ERROR] loadStudents:", err);
      setStudents([]);
    }
  }

  /* =======================================================
     UPLOAD
     ======================================================= */

  function resetUploadForm() {
    setSelectedStudentId("");
    setDocumentType("PKL_CERTIFICATE");
    setInstitutionName("");
    setStartDate("");
    setEndDate("");
    setSelectedFile(null);
    setUploadError("");
    setUploadSuccess("");
    setLastVerificationCode("");
    setLastTransactionHash("");
    setLastFileHash("");
  }

  function closeUploadForm() {
    if (uploading) return;
    setShowUpload(false);
    resetUploadForm();
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setUploadError("");
      setUploadSuccess("");
      setLastVerificationCode("");
      setLastTransactionHash("");
      setLastFileHash("");

      if (!selectedStudentId) {
        throw new Error("Silakan pilih siswa.");
      }

      if (!institutionName.trim()) {
        throw new Error(
          "Nama instansi PKL wajib diisi.",
        );
      }

      if (!startDate) {
        throw new Error(
          "Tanggal mulai PKL wajib diisi.",
        );
      }

      if (!endDate) {
        throw new Error(
          "Tanggal selesai PKL wajib diisi.",
        );
      }

      if (new Date(endDate) < new Date(startDate)) {
        throw new Error(
          "Tanggal selesai tidak boleh sebelum tanggal mulai.",
        );
      }

      if (!selectedFile) {
        throw new Error(
          "Silakan pilih file PDF sertifikat.",
        );
      }

      if (
        selectedFile.type !== "application/pdf" &&
        !selectedFile.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new Error(
          "File harus berformat PDF.",
        );
      }

      setUploading(true);

      const formData = new FormData();
      formData.append("studentId", selectedStudentId);
      formData.append("documentType", documentType);
      formData.append(
        "institutionName",
        institutionName.trim(),
      );
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("certificate", selectedFile);

      const response = await fetch(
        `${API_URL}/certificates/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        },
      );

      const contentType =
        response.headers.get("content-type");

      const result = contentType?.includes(
        "application/json",
      )
        ? ((await response.json()) as UploadResponse)
        : null;

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message ||
            `Gagal mengupload sertifikat. HTTP ${response.status}`,
        );
      }

      setUploadSuccess(
        result.message ||
          "Sertifikat berhasil diupload.",
      );
      setLastVerificationCode(
        result.data?.verificationCode ?? "",
      );
      setLastTransactionHash(
        result.data?.blockchain?.transactionHash ??
          "",
      );
      setLastFileHash(result.data?.fileHash ?? "");

      setSelectedStudentId("");
      setInstitutionName("");
      setStartDate("");
      setEndDate("");
      setSelectedFile(null);

      await loadCertificates(true);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Gagal mengupload sertifikat.",
      );
    } finally {
      setUploading(false);
    }
  }

  /* =======================================================
     APPROVE / REJECT
     ======================================================= */

  async function handleApproveCertificate(
    certificateId: string,
  ) {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menyetujui dan menerbitkan sertifikat ini?",
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(certificateId);

      const response = await fetch(
        `${API_URL}/certificates/${certificateId}/approve`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        (await response.json()) as ActionResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Gagal menyetujui sertifikat. HTTP ${response.status}`,
        );
      }

      alert(
        "Sertifikat berhasil disetujui dan diterbitkan.",
      );
      await loadCertificates(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menyetujui sertifikat.";

      alert(message);
      console.error(
        "[ERROR] approve certificate:",
        err,
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleRejectCertificate(
    certificateId: string,
  ) {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin menolak sertifikat ini?",
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(certificateId);

      const response = await fetch(
        `${API_URL}/certificates/${certificateId}/reject`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        (await response.json()) as ActionResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Gagal menolak sertifikat. HTTP ${response.status}`,
        );
      }

      alert("Sertifikat berhasil ditolak.");
      await loadCertificates(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal menolak sertifikat.";

      alert(message);
      console.error(
        "[ERROR] reject certificate:",
        err,
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  /* =======================================================
     DUDI DIGITAL SIGNATURE
     ======================================================= */

  async function handleDudiSign(
    certificateId: string,
  ) {
    if (
      !window.confirm(
        "Tandatangani sertifikat ini secara digital sebagai Mitra Industri (DUDI)?",
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(certificateId);
      setDudiMessage("");
      setDudiError("");
      setVerificationResult(null);

      const response = await fetch(
        `${API_URL}/certificates/${certificateId}/dudi-sign`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      const result =
        (await response.json()) as DudiSignResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Digital Signature DUDI gagal. HTTP ${response.status}`,
        );
      }

      setDudiMessage(
        result.message ||
          "Sertifikat berhasil ditandatangani oleh DUDI.",
      );

      await loadCertificates(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Digital Signature DUDI gagal.";

      setDudiError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleVerifyDudi(
    certificateId: string,
  ) {
    try {
      setActionLoadingId(certificateId);
      setDudiMessage("");
      setDudiError("");
      setVerificationResult(null);

      const response = await fetch(
        `${API_URL}/certificates/${certificateId}/dudi-signature/verify`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const result =
        (await response.json()) as DudiVerifyResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        throw new Error(
          result.message ||
            `Verifikasi Digital Signature gagal. HTTP ${response.status}`,
        );
      }

      setVerificationResult({
        certificateId,
        valid: result.data.valid,
        signatureValid:
          result.data.digitalSignature.valid,
        blockchainValid:
          result.data.blockchain.valid,
        storedHashMatches:
          result.data.integrity.storedHashMatches,
        signedHashMatches:
          result.data.integrity.signedHashMatches,
        walletAddress:
          result.data.digitalSignature.walletAddress,
        message: result.message || "",
      });
    } catch (err) {
      setDudiError(
        err instanceof Error
          ? err.message
          : "Gagal memverifikasi Digital Signature DUDI.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  /* =======================================================
     EFFECT
     ======================================================= */

  useEffect(() => {
    void loadCertificates();

    if (canUpload) {
      void loadStudents();
    }
    // Role berasal dari localStorage dan stabil selama halaman aktif.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div className="academic-page">
      {/* HEADER */}
      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <Award size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              AKADEMIK
            </div>
            <h2>Sertifikat PKL</h2>
            <p>
              Kelola sertifikat praktik kerja lapangan
              atau magang seluruh siswa.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {canUpload && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowUpload(true)}
            >
              <Upload size={17} />
              Upload Sertifikat
            </button>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void loadCertificates(true)
            }
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? "rotate-icon" : ""
              }
            />
            Refresh
          </button>
        </div>
      </div>

      {/* UPLOAD PANEL */}
      {canUpload && showUpload && (
        <div
          className="academic-panel"
          style={{ marginBottom: "18px" }}
        >
          <div
            style={{
              padding: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "18px",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  Upload Sertifikat PKL
                </h3>
                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#64748b",
                  }}
                >
                  Hash file akan dicatat ke blockchain.
                </p>
              </div>

              <button
                type="button"
                onClick={closeUploadForm}
                disabled={uploading}
                aria-label="Tutup"
                style={{
                  width: "36px",
                  height: "36px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  background: "#fff",
                  cursor: uploading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div
                style={{
                  padding: "12px 14px",
                  marginBottom: "14px",
                  border: "1px solid #fecaca",
                  borderRadius: "10px",
                  background: "#fef2f2",
                  color: "#b91c1c",
                }}
              >
                <strong>{uploadError}</strong>
              </div>
            )}

            {uploadSuccess && (
              <div
                style={{
                  padding: "14px",
                  marginBottom: "14px",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  color: "#166534",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom:
                      lastVerificationCode ||
                      lastFileHash ||
                      lastTransactionHash
                        ? "10px"
                        : 0,
                  }}
                >
                  <CheckCircle2 size={18} />
                  <strong>{uploadSuccess}</strong>
                </div>

                {lastVerificationCode && (
                  <div style={{ fontSize: "12px" }}>
                    Kode Verifikasi:{" "}
                    <strong>
                      {lastVerificationCode}
                    </strong>
                  </div>
                )}

                {lastFileHash && (
                  <div
                    style={{
                      fontSize: "12px",
                      overflowWrap: "anywhere",
                      marginTop: "5px",
                    }}
                  >
                    SHA-256:{" "}
                    <strong>{lastFileHash}</strong>
                  </div>
                )}

                {lastTransactionHash && (
                  <div
                    style={{
                      fontSize: "12px",
                      overflowWrap: "anywhere",
                      marginTop: "5px",
                    }}
                  >
                    Transaction Hash:{" "}
                    <strong>
                      {lastTransactionHash}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={(event) =>
                void handleUpload(event)
              }
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label>
                  <strong>Siswa</strong>
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(event) =>
                    setSelectedStudentId(
                      event.target.value,
                    )
                  }
                  disabled={uploading}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    marginTop: "8px",
                    padding: "0 12px",
                  }}
                >
                  <option value="">
                    -- Pilih Siswa --
                  </option>
                  {students.map((student) => (
                    <option
                      key={student.id}
                      value={student.id}
                    >
                      {student.studentNumber} -{" "}
                      {student.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>
                  <strong>Jenis Sertifikat</strong>
                </label>
                <select
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(
                      event.target.value,
                    )
                  }
                  disabled={uploading}
                  style={{
                    width: "100%",
                    minHeight: "44px",
                    marginTop: "8px",
                    padding: "0 12px",
                  }}
                >
                  <option value="PKL_CERTIFICATE">
                    Sertifikat PKL
                  </option>
                  <option value="INTERNSHIP_CERTIFICATE">
                    Sertifikat Magang
                  </option>
                </select>
              </div>

              <div>
                <label>
                  <strong>
                    Instansi / Perusahaan
                  </strong>
                </label>
                <div
                  style={{
                    position: "relative",
                  }}
                >
                  <Building2
                    size={17}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "21px",
                      color: "#94a3b8",
                    }}
                  />
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(event) =>
                      setInstitutionName(
                        event.target.value,
                      )
                    }
                    placeholder="Contoh: PT Telkom Indonesia"
                    disabled={uploading}
                    style={{
                      width: "100%",
                      minHeight: "44px",
                      marginTop: "8px",
                      padding: "0 12px 0 38px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label>
                  <strong>
                    File Sertifikat PDF
                  </strong>
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={uploading}
                  onChange={(event) =>
                    setSelectedFile(
                      event.target.files?.[0] ??
                        null,
                    )
                  }
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: "8px",
                  }}
                />
                {selectedFile && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",
                      color: "#64748b",
                    }}
                  >
                    File:{" "}
                    <strong>
                      {selectedFile.name}
                    </strong>
                  </div>
                )}
              </div>

              <div>
                <label>
                  <strong>Tanggal Mulai PKL</strong>
                </label>
                <div style={{ position: "relative" }}>
                  <CalendarDays
                    size={17}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "21px",
                      color: "#94a3b8",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) =>
                      setStartDate(
                        event.target.value,
                      )
                    }
                    disabled={uploading}
                    style={{
                      width: "100%",
                      minHeight: "44px",
                      marginTop: "8px",
                      padding: "0 12px 0 38px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div>
                <label>
                  <strong>
                    Tanggal Selesai PKL
                  </strong>
                </label>
                <div style={{ position: "relative" }}>
                  <CalendarDays
                    size={17}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "21px",
                      color: "#94a3b8",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) =>
                      setEndDate(
                        event.target.value,
                      )
                    }
                    disabled={uploading}
                    style={{
                      width: "100%",
                      minHeight: "44px",
                      marginTop: "8px",
                      padding: "0 12px 0 38px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: "4px",
                }}
              >
                <button
                  type="submit"
                  className="primary-button"
                  disabled={uploading}
                  style={{ minWidth: "230px" }}
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
                      <Upload size={17} />
                      Upload ke Blockchain
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DUDI MESSAGE */}
      {dudiMessage && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 16px",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            background: "#f0fdf4",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <CheckCircle2 size={19} />
          <strong>{dudiMessage}</strong>
        </div>
      )}

      {dudiError && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 16px",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <AlertCircle size={19} />
          <strong>{dudiError}</strong>
        </div>
      )}

      {/* ERROR LOAD */}
      {error && (
        <div className="student-alert">
          <AlertCircle size={19} />
          <div>
            <strong>
              Data sertifikat belum dapat dimuat.
            </strong>
            <span>{error}</span>
          </div>
          <button
            onClick={() =>
              void loadCertificates()
            }
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="academic-panel">
          <div className="table-state">
            <RefreshCw
              size={26}
              className="rotate-icon"
            />
            <strong>
              Memuat data sertifikat...
            </strong>
            <span>
              Mengambil data dari database sekolah.
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* STATISTICS */}
          <div className="document-card-grid">
            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>Total Sertifikat</h3>
                  <p>Seluruh dokumen</p>
                </div>
                <div className="document-card-icon">
                  <Award size={20} />
                </div>
              </div>
              <div className="document-number">
                {statistics.totalCertificates}
              </div>
              <div className="document-label">
                dokumen
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>Disetujui</h3>
                  <p>Sertifikat valid</p>
                </div>
                <div className="document-card-icon">
                  <CheckCircle2 size={20} />
                </div>
              </div>
              <div className="document-number">
                {statistics.approvedCertificates}
              </div>
              <div className="document-label">
                dokumen
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>Menunggu</h3>
                  <p>Perlu pemeriksaan</p>
                </div>
                <div className="document-card-icon">
                  <Clock3 size={20} />
                </div>
              </div>
              <div className="document-number">
                {statistics.pendingCertificates}
              </div>
              <div className="document-label">
                dokumen
              </div>
            </div>

            <div className="document-card">
              <div className="document-card-header">
                <div>
                  <h3>Ditolak</h3>
                  <p>Perlu diperbaiki</p>
                </div>
                <div className="document-card-icon">
                  <XCircle size={20} />
                </div>
              </div>
              <div className="document-number">
                {statistics.rejectedCertificates}
              </div>
              <div className="document-label">
                dokumen
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="academic-panel">
            <div className="academic-toolbar">
              <div className="academic-toolbar-title">
                <h3>Daftar Sertifikat PKL</h3>
                <span>
                  {certificates.length} data
                </span>
              </div>
            </div>

            <div className="academic-table-wrapper">
              {certificates.length === 0 ? (
                <div className="empty-academic">
                  <div className="empty-academic-icon">
                    <Award size={28} />
                  </div>
                  <h3>Belum ada sertifikat</h3>
                  <p>
                    Belum terdapat sertifikat PKL
                    atau magang siswa.
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
                      <th>Nomor Sertifikat</th>
                      <th>Kode Verifikasi</th>
                      <th>Instansi</th>
                      <th>Periode</th>
                      <th>Status</th>
                      <th>Tanggal Terbit</th>

                      {canDudiSign && (
                        <th>Digital Signature</th>
                      )}

                      {(canApprove ||
                        canDudiSign) && <th>Aksi</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {certificates.map(
                      (item, index) => {
                        const certificate =
                          item.certificate;
                        const isBusy =
                          actionLoadingId ===
                          certificate.id;

                        return (
                          <tr key={item.id}>
                            <td>{index + 1}</td>

                            <td>
                              <strong className="academic-code">
                                {
                                  item.student
                                    .studentNumber
                                }
                              </strong>
                            </td>

                            <td>
                              {item.student.fullName}
                            </td>

                            <td>
                              {item.class
                                ? item.class.name
                                : "-"}
                            </td>

                            <td>
                              {
                                certificate.documentNumber
                              }
                            </td>

                            <td>
                              <strong className="academic-code">
                                {
                                  certificate.verificationCode
                                }
                              </strong>
                            </td>

                            <td>
                              {certificate.institutionName ||
                                "-"}
                            </td>

                            <td>
                              {formatDate(
                                certificate.startDate,
                              )}{" "}
                              -{" "}
                              {formatDate(
                                certificate.endDate,
                              )}
                            </td>

                            <td>
                              <span
                                className={`academic-badge ${getStatusClass(
                                  certificate.status,
                                )}`}
                              >
                                {getStatusLabel(
                                  certificate.status,
                                )}
                              </span>
                            </td>

                            <td>
                              {certificate.issuedAt
                                ? formatDate(
                                    certificate.issuedAt,
                                  )
                                : "Belum diterbitkan"}
                            </td>

                            {canDudiSign && (
                              <td>
                                {certificate.dudiSignedAt ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection:
                                        "column",
                                      gap: "4px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        display:
                                          "inline-flex",
                                        alignItems:
                                          "center",
                                        gap: "5px",
                                        color:
                                          "#15803d",
                                        fontWeight: 700,
                                        fontSize:
                                          "11px",
                                      }}
                                    >
                                      <ShieldCheck
                                        size={14}
                                      />
                                      Ditandatangani
                                      DUDI
                                    </span>

                                    <small
                                      style={{
                                        color:
                                          "#64748b",
                                      }}
                                      title={
                                        certificate.dudiWalletAddress ||
                                        undefined
                                      }
                                    >
                                      {shortenWallet(
                                        certificate.dudiWalletAddress,
                                      )}
                                    </small>

                                    <small
                                      style={{
                                        color:
                                          "#64748b",
                                      }}
                                    >
                                      {formatDate(
                                        certificate.dudiSignedAt,
                                      )}
                                    </small>
                                  </div>
                                ) : (
                                  <span
                                    style={{
                                      color: "#b45309",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Belum
                                    ditandatangani
                                  </span>
                                )}
                              </td>
                            )}

                            {(canApprove ||
                              canDudiSign) && (
                              <td>
                                {canApprove && (
                                  <>
                                    {certificate.status ===
                                    "PENDING" ? (
                                      <div
                                        style={{
                                          display:
                                            "flex",
                                          alignItems:
                                            "center",
                                          gap: "8px",
                                          whiteSpace:
                                            "nowrap",
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className="primary-button"
                                          disabled={
                                            isBusy
                                          }
                                          onClick={() =>
                                            void handleApproveCertificate(
                                              certificate.id,
                                            )
                                          }
                                          style={{
                                            minHeight:
                                              "34px",
                                            padding:
                                              "0 12px",
                                            fontSize:
                                              "11px",
                                          }}
                                        >
                                          {isBusy ? (
                                            <RefreshCw
                                              size={
                                                15
                                              }
                                              className="rotate-icon"
                                            />
                                          ) : (
                                            <CheckCircle2
                                              size={
                                                15
                                              }
                                            />
                                          )}
                                          Setujui
                                        </button>

                                        <button
                                          type="button"
                                          disabled={
                                            isBusy
                                          }
                                          onClick={() =>
                                            void handleRejectCertificate(
                                              certificate.id,
                                            )
                                          }
                                          style={{
                                            minHeight:
                                              "34px",
                                            display:
                                              "inline-flex",
                                            alignItems:
                                              "center",
                                            justifyContent:
                                              "center",
                                            gap: "6px",
                                            padding:
                                              "0 12px",
                                            border:
                                              "1px solid #fecaca",
                                            borderRadius:
                                              "8px",
                                            background:
                                              "#fef2f2",
                                            color:
                                              "#dc2626",
                                            fontSize:
                                              "11px",
                                            fontWeight: 700,
                                            cursor:
                                              isBusy
                                                ? "not-allowed"
                                                : "pointer",
                                            opacity:
                                              isBusy
                                                ? 0.6
                                                : 1,
                                          }}
                                        >
                                          <XCircle
                                            size={15}
                                          />
                                          Tolak
                                        </button>
                                      </div>
                                    ) : certificate.status ===
                                      "APPROVED" ? (
                                      <span
                                        style={{
                                          color:
                                            "#168247",
                                          fontSize:
                                            "11px",
                                          fontWeight: 700,
                                        }}
                                      >
                                        Sudah diterbitkan
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          color:
                                            "#dc2626",
                                          fontSize:
                                            "11px",
                                          fontWeight: 700,
                                        }}
                                      >
                                        Ditolak
                                      </span>
                                    )}
                                  </>
                                )}

                                {canDudiSign && (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems:
                                        "center",
                                      gap: "8px",
                                      whiteSpace:
                                        "nowrap",
                                    }}
                                  >
                                    {certificate.status !==
                                    "APPROVED" ? (
                                      <span
                                        style={{
                                          color:
                                            "#64748b",
                                          fontSize:
                                            "11px",
                                          fontWeight: 600,
                                        }}
                                      >
                                        Menunggu
                                        persetujuan
                                      </span>
                                    ) : !certificate.dudiSignedAt ? (
                                      <button
                                        type="button"
                                        className="primary-button"
                                        disabled={
                                          isBusy
                                        }
                                        onClick={() =>
                                          void handleDudiSign(
                                            certificate.id,
                                          )
                                        }
                                        style={{
                                          minHeight:
                                            "34px",
                                          padding:
                                            "0 12px",
                                          fontSize:
                                            "11px",
                                        }}
                                      >
                                        {isBusy ? (
                                          <RefreshCw
                                            size={15}
                                            className="rotate-icon"
                                          />
                                        ) : (
                                          <PenLine
                                            size={15}
                                          />
                                        )}
                                        Tandatangani
                                        Digital
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        disabled={
                                          isBusy
                                        }
                                        onClick={() =>
                                          void handleVerifyDudi(
                                            certificate.id,
                                          )
                                        }
                                        style={{
                                          minHeight:
                                            "34px",
                                          display:
                                            "inline-flex",
                                          alignItems:
                                            "center",
                                          justifyContent:
                                            "center",
                                          gap: "6px",
                                          padding:
                                            "0 12px",
                                          border:
                                            "1px solid #bfdbfe",
                                          borderRadius:
                                            "8px",
                                          background:
                                            "#eff6ff",
                                          color:
                                            "#1d4ed8",
                                          fontSize:
                                            "11px",
                                          fontWeight: 700,
                                          cursor:
                                            isBusy
                                              ? "not-allowed"
                                              : "pointer",
                                          opacity:
                                            isBusy
                                              ? 0.6
                                              : 1,
                                        }}
                                      >
                                        {isBusy ? (
                                          <RefreshCw
                                            size={15}
                                            className="rotate-icon"
                                          />
                                        ) : (
                                          <SearchCheck
                                            size={15}
                                          />
                                        )}
                                        Verifikasi
                                        Signature
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* VERIFICATION RESULT */}
          {verificationResult && (
            <div
              className="academic-panel"
              style={{ marginTop: "18px" }}
            >
              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "18px",
                  }}
                >
                  <ShieldCheck size={24} />

                  <div>
                    <h3 style={{ margin: 0 }}>
                      Hasil Verifikasi Digital
                      Signature DUDI
                    </h3>
                    <small>
                      Pemeriksaan signature,
                      integritas file, dan
                      blockchain.
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(190px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <VerificationBox
                    label="Digital Signature"
                    valid={
                      verificationResult.signatureValid
                    }
                  />

                  <VerificationBox
                    label="Integritas File"
                    valid={
                      verificationResult.storedHashMatches &&
                      verificationResult.signedHashMatches
                    }
                  />

                  <VerificationBox
                    label="Blockchain"
                    valid={
                      verificationResult.blockchainValid
                    }
                  />

                  <div
                    style={{
                      padding: "14px",
                      border:
                        "1px solid #e2e8f0",
                      borderRadius: "10px",
                      background: "#ffffff",
                    }}
                  >
                    <small
                      style={{
                        display: "block",
                        color: "#64748b",
                        marginBottom: "6px",
                      }}
                    >
                      Wallet DUDI
                    </small>

                    <strong
                      title={
                        verificationResult.walletAddress
                      }
                    >
                      {shortenWallet(
                        verificationResult.walletAddress,
                      )}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background:
                      verificationResult.valid
                        ? "#f0fdf4"
                        : "#fef2f2",
                    color:
                      verificationResult.valid
                        ? "#166534"
                        : "#b91c1c",
                    fontWeight: 700,
                  }}
                >
                  {verificationResult.valid
                    ? "✓ Sertifikat valid, Digital Signature DUDI sah, integritas file terjaga, dan hash sesuai blockchain."
                    : "✕ Verifikasi gagal. Signature, integritas file, atau blockchain tidak sesuai."}
                </div>

                {verificationResult.message && (
                  <div
                    style={{
                      marginTop: "8px",
                      color: "#64748b",
                      fontSize: "12px",
                    }}
                  >
                    {verificationResult.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}