import {
  useEffect,
  useState,
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

/* =========================================================
   HELPERS
   ========================================================= */

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

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "-";
  }

  return new Date(
    value,
  ).toLocaleDateString(
    "id-ID",
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function CertificatePage() {
  const [
    certificates,
    setCertificates,
  ] = useState<
    CertificateItem[]
  >([]);

  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);

  const [
    statistics,
    setStatistics,
  ] = useState({
    totalStudents: 0,
    totalCertificates: 0,
    approvedCertificates: 0,
    pendingCertificates: 0,
    rejectedCertificates: 0,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionLoadingId,
    setActionLoadingId,
  ] = useState<string | null>(
    null,
  );

  /* =======================================================
     USER
     ======================================================= */

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

  /* =======================================================
     UPLOAD STATE
     ======================================================= */

  const [
    showUpload,
    setShowUpload,
  ] = useState(false);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    documentType,
    setDocumentType,
  ] = useState(
    "PKL_CERTIFICATE",
  );

  const [
    institutionName,
    setInstitutionName,
  ] = useState("");

  const [
    startDate,
    setStartDate,
  ] = useState("");

  const [
    endDate,
    setEndDate,
  ] = useState("");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null,
  );

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    uploadError,
    setUploadError,
  ] = useState("");

  const [
    uploadSuccess,
    setUploadSuccess,
  ] = useState("");

  const [
    lastVerificationCode,
    setLastVerificationCode,
  ] = useState("");

  const [
    lastTransactionHash,
    setLastTransactionHash,
  ] = useState("");

  const [
    lastFileHash,
    setLastFileHash,
  ] = useState("");

  /* =======================================================
     LOAD CERTIFICATES
     ======================================================= */

  async function loadCertificates(
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
          ? `${API_URL}/certificates/me`
          : `${API_URL}/certificates`;

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

      const result =
        (await response.json()) as CertificateResponse;

      if (
        !response.ok ||
        !result.success
      ) {
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

      setCertificates(
        result.data
          .certificates ?? [],
      );

      setStatistics(
        result.data
          .statistics ?? {
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

      const result =
        (await response.json()) as StudentResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ||
            "Gagal mengambil data siswa.",
        );
      }

      let studentList:
        Student[] = [];

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

  /* =======================================================
     RESET FORM
     ======================================================= */

  function resetUploadForm() {
    setSelectedStudentId("");
    setDocumentType(
      "PKL_CERTIFICATE",
    );
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
    if (uploading) {
      return;
    }

    setShowUpload(false);
    resetUploadForm();
  }

  /* =======================================================
     UPLOAD CERTIFICATE
     ======================================================= */

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
      setLastFileHash("");

      if (!selectedStudentId) {
        throw new Error(
          "Silakan pilih siswa.",
        );
      }

      if (
        !institutionName.trim()
      ) {
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

      if (
        new Date(endDate) <
        new Date(startDate)
      ) {
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
        "documentType",
        documentType,
      );

      formData.append(
        "institutionName",
        institutionName.trim(),
      );

      formData.append(
        "startDate",
        startDate,
      );

      formData.append(
        "endDate",
        endDate,
      );

      formData.append(
        "certificate",
        selectedFile,
      );

      const response =
        await fetch(
          `${API_URL}/certificates/upload`,
          {
            method:
              "POST",

            credentials:
              "include",

            body:
              formData,
          },
        );

      const contentType =
        response.headers.get(
          "content-type",
        );

      const result =
        contentType?.includes(
          "application/json",
        )
          ? ((await response.json()) as UploadResponse)
          : null;

      if (
        !response.ok ||
        !result?.success
      ) {
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
        result.data
          ?.verificationCode ??
          "",
      );

      setLastTransactionHash(
        result.data
          ?.blockchain
          ?.transactionHash ??
          "",
      );

      setLastFileHash(
        result.data
          ?.fileHash ??
          "",
      );

      setSelectedStudentId("");
      setInstitutionName("");
      setStartDate("");
      setEndDate("");
      setSelectedFile(null);

      await loadCertificates(
        true,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengupload sertifikat.";

      setUploadError(
        message,
      );
    } finally {
      setUploading(
        false,
      );
    }
  }

  /* =======================================================
     APPROVE CERTIFICATE
     ======================================================= */

  async function handleApproveCertificate(
    certificateId: string,
  ) {
    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menyetujui dan menerbitkan sertifikat ini?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        certificateId,
      );

      const response =
        await fetch(
          `${API_URL}/certificates/${certificateId}/approve`,
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

      const contentType =
        response.headers.get(
          "content-type",
        );

      const result =
        contentType?.includes(
          "application/json",
        )
          ? ((await response.json()) as ActionResponse)
          : null;

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `Gagal menyetujui sertifikat. HTTP ${response.status}`,
        );
      }

      alert(
        "Sertifikat berhasil disetujui dan diterbitkan.",
      );

      await loadCertificates(
        true,
      );
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
      setActionLoadingId(
        null,
      );
    }
  }

  /* =======================================================
     REJECT CERTIFICATE
     ======================================================= */

  async function handleRejectCertificate(
    certificateId: string,
  ) {
    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menolak sertifikat ini?",
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        certificateId,
      );

      const response =
        await fetch(
          `${API_URL}/certificates/${certificateId}/reject`,
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

      const contentType =
        response.headers.get(
          "content-type",
        );

      const result =
        contentType?.includes(
          "application/json",
        )
          ? ((await response.json()) as ActionResponse)
          : null;

      if (
        !response.ok ||
        !result?.success
      ) {
        throw new Error(
          result?.message ||
            `Gagal menolak sertifikat. HTTP ${response.status}`,
        );
      }

      alert(
        "Sertifikat berhasil ditolak.",
      );

      await loadCertificates(
        true,
      );
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
      setActionLoadingId(
        null,
      );
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
            <Award
              size={26}
            />
          </div>

          <div>
            <div className="module-eyebrow">
              AKADEMIK
            </div>

            <h2>
              Sertifikat PKL
            </h2>

            <p>
              Kelola sertifikat praktik
              kerja lapangan atau magang
              seluruh siswa.
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
              type="button"
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

              Upload Sertifikat
            </button>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              void loadCertificates(
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

      {/* FORM UPLOAD */}

      {showUpload &&
        canUpload && (
          <div className="academic-panel">
            <div className="academic-toolbar">
              <div className="academic-toolbar-title">
                <h3>
                  Upload Sertifikat PKL
                </h3>

                <span>
                  Hash SHA-256 sertifikat
                  akan dicatat ke
                  blockchain.
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
                  margin:
                    "16px 20px 0",

                  padding:
                    "14px",

                  border:
                    "1px solid #dbe5f2",

                  borderRadius:
                    "10px",

                  background:
                    "#f8fafc",
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

            {lastFileHash && (
              <div
                style={{
                  margin:
                    "10px 20px 0",

                  padding:
                    "14px",

                  border:
                    "1px solid #dbe5f2",

                  borderRadius:
                    "10px",

                  background:
                    "#f8fafc",
                }}
              >
                <strong>
                  SHA-256
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
                    lastFileHash
                  }
                </div>
              </div>
            )}

            {lastTransactionHash && (
              <div
                style={{
                  margin:
                    "10px 20px 0",

                  padding:
                    "14px",

                  border:
                    "1px solid #dbe5f2",

                  borderRadius:
                    "10px",

                  background:
                    "#f8fafc",
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
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",

                gap:
                  "18px 24px",

                padding:
                  "20px",
              }}
            >
              {/* SISWA */}

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

                    minHeight:
                      "44px",

                    marginTop:
                      "8px",

                    padding:
                      "0 12px",
                  }}
                >
                  <option value="">
                    -- Pilih Siswa --
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

              {/* JENIS */}

              <div>
                <label>
                  <strong>
                    Jenis Sertifikat
                  </strong>
                </label>

                <select
                  value={
                    documentType
                  }
                  onChange={(
                    event,
                  ) =>
                    setDocumentType(
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

                    minHeight:
                      "44px",

                    marginTop:
                      "8px",

                    padding:
                      "0 12px",
                  }}
                >
                  <option
                    value="PKL_CERTIFICATE"
                  >
                    Sertifikat PKL
                  </option>

                  <option
                    value="INTERNSHIP_CERTIFICATE"
                  >
                    Sertifikat Magang
                  </option>
                </select>
              </div>

              {/* INSTANSI */}

              <div>
                <label>
                  <strong>
                    Instansi / Perusahaan
                  </strong>
                </label>

                <div
                  style={{
                    position:
                      "relative",
                  }}
                >
                  <Building2
                    size={17}
                    style={{
                      position:
                        "absolute",

                      left:
                        "12px",

                      top:
                        "21px",

                      color:
                        "#94a3b8",
                    }}
                  />

                  <input
                    type="text"
                    value={
                      institutionName
                    }
                    onChange={(
                      event,
                    ) =>
                      setInstitutionName(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Contoh: PT Telkom Indonesia"
                    disabled={
                      uploading
                    }
                    style={{
                      width:
                        "100%",

                      minHeight:
                        "44px",

                      marginTop:
                        "8px",

                      padding:
                        "0 12px 0 38px",
                    }}
                  />
                </div>
              </div>

              {/* FILE */}

              <div>
                <label>
                  <strong>
                    File Sertifikat PDF
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

                    width:
                      "100%",

                    marginTop:
                      "8px",
                  }}
                />

                {selectedFile && (
                  <div
                    style={{
                      marginTop:
                        "8px",

                      fontSize:
                        "12px",

                      color:
                        "#64748b",
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

              {/* START DATE */}

              <div>
                <label>
                  <strong>
                    Tanggal Mulai PKL
                  </strong>
                </label>

                <div
                  style={{
                    position:
                      "relative",
                  }}
                >
                  <CalendarDays
                    size={17}
                    style={{
                      position:
                        "absolute",

                      left:
                        "12px",

                      top:
                        "21px",

                      color:
                        "#94a3b8",

                      pointerEvents:
                        "none",
                    }}
                  />

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setStartDate(
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

                      minHeight:
                        "44px",

                      marginTop:
                        "8px",

                      padding:
                        "0 12px 0 38px",
                    }}
                  />
                </div>
              </div>

              {/* END DATE */}

              <div>
                <label>
                  <strong>
                    Tanggal Selesai PKL
                  </strong>
                </label>

                <div
                  style={{
                    position:
                      "relative",
                  }}
                >
                  <CalendarDays
                    size={17}
                    style={{
                      position:
                        "absolute",

                      left:
                        "12px",

                      top:
                        "21px",

                      color:
                        "#94a3b8",

                      pointerEvents:
                        "none",
                    }}
                  />

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    onChange={(
                      event,
                    ) =>
                      setEndDate(
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

                      minHeight:
                        "44px",

                      marginTop:
                        "8px",

                      padding:
                        "0 12px 0 38px",
                    }}
                  />
                </div>
              </div>

              {/* SUBMIT */}

              <div
                style={{
                  gridColumn:
                    "1 / -1",

                  display:
                    "flex",

                  justifyContent:
                    "center",

                  paddingTop:
                    "4px",
                }}
              >
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    uploading
                  }
                  style={{
                    minWidth:
                      "230px",
                  }}
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

                      Upload ke Blockchain
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      {/* ERROR LOAD */}

      {error && (
        <div className="student-alert">
          <AlertCircle
            size={19}
          />

          <div>
            <strong>
              Data sertifikat belum
              dapat dimuat.
            </strong>

            <span>
              {error}
            </span>
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

      {/* LOADING */}

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
              Mengambil data dari
              database sekolah.
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
                  <h3>
                    Total Sertifikat
                  </h3>

                  <p>
                    Seluruh dokumen
                  </p>
                </div>

                <div className="document-card-icon">
                  <Award
                    size={20}
                  />
                </div>
              </div>

              <div className="document-number">
                {
                  statistics.totalCertificates
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
                    Sertifikat valid
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
                  statistics.approvedCertificates
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
                  statistics.pendingCertificates
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
                  statistics.rejectedCertificates
                }
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
                <h3>
                  Daftar Sertifikat PKL
                </h3>

                <span>
                  {
                    certificates.length
                  }{" "}
                  data
                </span>
              </div>
            </div>

            <div className="academic-table-wrapper">
              {certificates.length ===
              0 ? (
                <div className="empty-academic">
                  <div className="empty-academic-icon">
                    <Award
                      size={28}
                    />
                  </div>

                  <h3>
                    Belum ada sertifikat
                  </h3>

                  <p>
                    Belum terdapat
                    sertifikat PKL atau
                    magang siswa.
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
                        Nomor Sertifikat
                      </th>

                      <th>
                        Kode Verifikasi
                      </th>

                      <th>
                        Instansi
                      </th>

                      <th>
                        Periode
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Tanggal Terbit
                      </th>

                      {canApprove && (
                        <th>
                          Aksi
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {certificates.map(
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
                                .certificate
                                .documentNumber
                            }
                          </td>

                          <td>
                            <strong className="academic-code">
                              {
                                item
                                  .certificate
                                  .verificationCode
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              item
                                .certificate
                                .institutionName ||
                              "-"
                            }
                          </td>

                          <td>
                            {formatDate(
                              item
                                .certificate
                                .startDate,
                            )}

                            {" - "}

                            {formatDate(
                              item
                                .certificate
                                .endDate,
                            )}
                          </td>

                          <td>
                            <span
                              className={`academic-badge ${getStatusClass(
                                item
                                  .certificate
                                  .status,
                              )}`}
                            >
                              {getStatusLabel(
                                item
                                  .certificate
                                  .status,
                              )}
                            </span>
                          </td>

                          <td>
                            {item
                              .certificate
                              .issuedAt
                              ? formatDate(
                                  item
                                    .certificate
                                    .issuedAt,
                                )
                              : "Belum diterbitkan"}
                          </td>

                          {canApprove && (
                            <td>
                              {item
                                .certificate
                                .status ===
                              "PENDING" ? (
                                <div
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap:
                                      "8px",

                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="primary-button"
                                    disabled={
                                      actionLoadingId ===
                                      item
                                        .certificate
                                        .id
                                    }
                                    onClick={() =>
                                      void handleApproveCertificate(
                                        item
                                          .certificate
                                          .id,
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
                                    {actionLoadingId ===
                                    item
                                      .certificate
                                      .id ? (
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
                                      actionLoadingId ===
                                      item
                                        .certificate
                                        .id
                                    }
                                    onClick={() =>
                                      void handleRejectCertificate(
                                        item
                                          .certificate
                                          .id,
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

                                      gap:
                                        "6px",

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

                                      fontWeight:
                                        700,

                                      cursor:
                                        actionLoadingId ===
                                        item
                                          .certificate
                                          .id
                                          ? "not-allowed"
                                          : "pointer",

                                      opacity:
                                        actionLoadingId ===
                                        item
                                          .certificate
                                          .id
                                          ? 0.6
                                          : 1,
                                    }}
                                  >
                                    <XCircle
                                      size={
                                        15
                                      }
                                    />

                                    Tolak
                                  </button>
                                </div>
                              ) : item
                                  .certificate
                                  .status ===
                                "APPROVED" ? (
                                <span
                                  style={{
                                    color:
                                      "#168247",

                                    fontSize:
                                      "11px",

                                    fontWeight:
                                      700,
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

                                    fontWeight:
                                      700,
                                  }}
                                >
                                  Ditolak
                                </span>
                              )}
                            </td>
                          )}
                        </tr>
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