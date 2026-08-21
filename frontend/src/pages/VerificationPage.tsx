import {
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  FileText,
  RotateCcw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import {
  verifyDocument,
  type VerificationResult,
} from "../services/api";

async function calculateSHA256(
  file: File,
): Promise<string> {
  const buffer = await file.arrayBuffer();

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      buffer,
    );

  const hashArray = Array.from(
    new Uint8Array(hashBuffer),
  );

  return hashArray
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

function formatDate(
  date: string | null | undefined,
): string {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

function getDocumentTypeLabel(
  type: string,
): string {
  if (type === "DIPLOMA") {
    return "Ijazah";
  }

  if (
    type === "PKL" ||
    type === "MAGANG"
  ) {
    return "Sertifikat PKL / Magang";
  }

  return type;
}

export default function VerificationPage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [verificationCode, setVerificationCode] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [hash, setHash] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<VerificationResult | null>(
      null,
    );

  function resetForm() {
    setVerificationCode("");
    setSelectedFile(null);
    setHash("");
    setError("");
    setResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      setSelectedFile(null);
      setHash("");
      return;
    }

    setError("");
    setResult(null);
    setSelectedFile(file);

    try {
      const calculatedHash =
        await calculateSHA256(file);

      setHash(calculatedHash);
    } catch {
      setHash("");

      setError(
        "Gagal menghitung hash file.",
      );
    }
  }

  async function handleVerify() {
    setError("");
    setResult(null);

    if (!verificationCode.trim()) {
      setError(
        "Kode verifikasi wajib diisi.",
      );
      return;
    }

    if (!selectedFile) {
      setError(
        "File dokumen wajib dipilih.",
      );
      return;
    }

    if (!hash) {
      setError(
        "Hash dokumen belum berhasil dihitung.",
      );
      return;
    }

    try {
      setLoading(true);

      const response =
        await verifyDocument(
          verificationCode.trim(),
          hash,
        );

      if (
        !response.success ||
        !response.data
      ) {
        throw new Error(
          response.message ||
            "Verifikasi gagal.",
        );
      }

      setResult(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal melakukan verifikasi.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="verification-page">
      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <ShieldCheck size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              KEAMANAN DOKUMEN
            </div>

            <h2>
              Verifikasi Dokumen
            </h2>

            <p>
              Verifikasi keaslian ijazah atau
              sertifikat PKL/magang.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={resetForm}
          disabled={loading}
        >
          <RotateCcw size={17} />

          Reset
        </button>
      </div>

      <div className="verification-grid">
        <section className="academic-panel">
          <div className="verification-panel-header">
            <div>
              <div className="module-eyebrow">
                VERIFIKASI
              </div>

              <h3>
                Verifikasi Keaslian
              </h3>

              <p>
                Masukkan kode verifikasi dan
                file dokumen.
              </p>
            </div>

            <div className="verification-icon">
              <FileCheck2 size={25} />
            </div>
          </div>

          {error && (
            <div className="verification-alert error">
              <AlertCircle size={20} />

              <div>
                <strong>
                  Verifikasi gagal
                </strong>

                <span>
                  {error}
                </span>
              </div>
            </div>
          )}

          <div className="verification-form">
            <div className="form-group">
              <label htmlFor="verificationCode">
                Kode Verifikasi
              </label>

              <input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(event) =>
                  setVerificationCode(
                    event.target.value,
                  )
                }
                placeholder="Masukkan kode verifikasi"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label>
                File Dokumen
              </label>

              <div
                className={`file-upload ${
                  selectedFile
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  fileInputRef.current?.click()
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  hidden
                />

                <div className="file-upload-icon">
                  {selectedFile ? (
                    <FileCheck2 size={28} />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>

                {selectedFile ? (
                  <>
                    <strong>
                      {selectedFile.name}
                    </strong>

                    <span>
                      {(
                        selectedFile.size /
                        1024
                      ).toFixed(2)}{" "}
                      KB
                    </span>
                  </>
                ) : (
                  <>
                    <strong>
                      Pilih file dokumen
                    </strong>

                    <span>
                      Pilih file dokumen yang
                      ingin diverifikasi.
                    </span>
                  </>
                )}
              </div>
            </div>

            {hash && (
              <div className="hash-preview">
                <span>
                  SHA-256
                </span>

                <code>
                  {hash}
                </code>
              </div>
            )}

            <button
              type="button"
              className="primary-button verification-button"
              onClick={() =>
                void handleVerify()
              }
              disabled={loading}
            >
              <ShieldCheck size={18} />

              {loading
                ? "Memverifikasi..."
                : "Verifikasi Dokumen"}
            </button>
          </div>
        </section>

        <section className="academic-panel">
          <div className="verification-panel-header">
            <div>
              <div className="module-eyebrow">
                HASIL
              </div>

              <h3>
                Hasil Verifikasi
              </h3>

              <p>
                Informasi hasil pemeriksaan
                dokumen.
              </p>
            </div>
          </div>

          {!result ? (
            <div className="verification-empty">
              <div className="verification-empty-icon">
                <FileText size={32} />
              </div>

              <h3>
                Belum ada hasil
              </h3>

              <p>
                Hasil verifikasi dokumen akan
                tampil di sini.
              </p>
            </div>
          ) : (
            <div className="verification-result">
              <div
                className={`verification-result-status ${
                  result.valid
                    ? "valid"
                    : "invalid"
                }`}
              >
                {result.valid ? (
                  <CheckCircle2
                    size={34}
                  />
                ) : (
                  <XCircle size={34} />
                )}

                <div>
                  <strong>
                    {result.valid
                      ? "DOKUMEN VALID"
                      : "DOKUMEN TIDAK VALID"}
                  </strong>

                  <span>
                    {result.valid
                      ? "Hash dokumen sesuai dengan data yang tersimpan."
                      : "Hash dokumen tidak sesuai dengan data yang tersimpan."}
                  </span>
                </div>
              </div>

              <div className="verification-details">
                <div className="verification-detail">
                  <span>
                    Jenis Dokumen
                  </span>

                  <strong>
                    {getDocumentTypeLabel(result.documentType ?? "")}
                  </strong>
                </div>

                <div className="verification-detail">
                  <span>
                    Nomor Dokumen
                  </span>

                  <strong>
                    {result.documentNumber}
                  </strong>
                </div>

                <div className="verification-detail">
                  <span>
                    Nama Dokumen
                  </span>

                  <strong>
                    {result.documentName}
                  </strong>
                </div>

                {result.institutionName && (
                  <div className="verification-detail">
                    <span>
                      Institusi
                    </span>

                    <strong>
                      {
                        result.institutionName
                      }
                    </strong>
                  </div>
                )}

                {result.student && (
                  <>
                    <div className="verification-detail">
                      <span>
                        NIS
                      </span>

                      <strong>
                        {
                          result.student
                            .studentNumber
                        }
                      </strong>
                    </div>

                    <div className="verification-detail">
                      <span>
                        Nama Siswa
                      </span>

                      <strong>
                        {
                          result.student
                            .fullName
                        }
                      </strong>
                    </div>
                  </>
                )}

                <div className="verification-detail">
                  <span>
                    Tanggal Terbit
                  </span>

                  <strong>
                    {formatDate(
                      result.issuedAt,
                    )}
                  </strong>
                </div>

                <div className="verification-detail">
                  <span>
                    Status
                  </span>

                  <strong>
                    {result.status}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}