import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Users,
  Eye,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

const API_URL = "/api";

type Student = {
  id: string;
  studentNumber: string;
  fullName: string;
  gender: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  address?: string | null;
  status?: string;
  class?: {
    id: string;
    name: string;
    major?: string | null;
  } | null;
};

type StudentResponse = {
  success: boolean;
  message?: string;
  data?: unknown;
};

function extractStudents(data: unknown): Student[] {
  if (Array.isArray(data)) {
    return data as Student[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const object = data as Record<string, unknown>;

  if (Array.isArray(object.students)) {
    return object.students as Student[];
  }

  if (Array.isArray(object.items)) {
    return object.items as Student[];
  }

  if (Array.isArray(object.data)) {
    return object.data as Student[];
  }

  return [];
}

function formatDate(date?: string | null) {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function genderLabel(gender: string) {
  if (gender === "LAKI_LAKI") {
    return "Laki-laki";
  }

  if (gender === "PEREMPUAN") {
    return "Perempuan";
  }

  return gender || "-";
}

export default function StudentPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  async function loadStudents(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`${API_URL}/students`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const result: StudentResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal mengambil data siswa.",
        );
      }

      setStudents(extractStudents(result.data));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil data siswa.";

      setError(message);
      setStudents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.fullName.toLowerCase().includes(keyword) ||
        student.studentNumber.toLowerCase().includes(keyword) ||
        student.class?.name?.toLowerCase().includes(keyword) ||
        student.class?.major?.toLowerCase().includes(keyword)
      );
    });
  }, [students, search]);

  return (
    <div className="student-page">
      <div className="module-header">
        <div className="module-title">
          <div className="module-icon">
            <Users size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              ADMINISTRASI SEKOLAH
            </div>

            <h2>Data Siswa</h2>

            <p>
              Kelola dan pantau data siswa yang terdaftar
              di sekolah.
            </p>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={() => void loadStudents(true)}
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

      <div className="student-summary">
        <div className="student-summary-card">
          <div className="summary-icon blue">
            <Users size={21} />
          </div>

          <div>
            <span>Total Siswa</span>
            <strong>{students.length}</strong>
          </div>
        </div>

        <div className="student-summary-card">
          <div className="summary-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Data Aktif</span>
            <strong>
              {
                students.filter(
                  (student) =>
                    !student.status ||
                    student.status === "AKTIF",
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="student-alert">
          <AlertCircle size={19} />

          <div>
            <strong>Data siswa belum dapat dimuat.</strong>
            <span>{error}</span>
          </div>

          <button
            onClick={() => void loadStudents()}
            title="Coba lagi"
          >
            Coba Lagi
          </button>
        </div>
      )}

      <div className="student-panel">
        <div className="student-toolbar">
          <div>
            <h3>Daftar Siswa</h3>
            <span>
              {filteredStudents.length} data ditampilkan
            </span>
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nama, NIS, kelas..."
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

        <div className="student-table-wrapper">
          {loading ? (
            <div className="table-state">
              <RefreshCw
                size={26}
                className="rotate-icon"
              />

              <strong>Memuat data siswa...</strong>

              <span>
                Mengambil data dari database sekolah.
              </span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="table-state">
              <Users size={32} />

              <strong>
                {search
                  ? "Siswa tidak ditemukan"
                  : "Belum ada data siswa"}
              </strong>

              <span>
                {search
                  ? "Coba gunakan kata kunci lain."
                  : "Database belum memiliki data siswa."}
              </span>
            </div>
          ) : (
            <table className="student-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIS</th>
                  <th>Nama Siswa</th>
                  <th>Jenis Kelamin</th>
                  <th>Kelas</th>
                  <th>Jurusan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map(
                  (student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>

                      <td>
                        <strong className="student-number">
                          {student.studentNumber}
                        </strong>
                      </td>

                      <td>
                        <div className="student-name">
                          <div className="student-avatar">
                            {student.fullName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {student.fullName}
                            </strong>

                            <span>
                              {student.birthPlace || "Makassar"}
                              {student.birthDate
                                ? `, ${formatDate(
                                    student.birthDate,
                                  )}`
                                : ""}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {genderLabel(student.gender)}
                      </td>

                      <td>
                        {student.class?.name || "-"}
                      </td>

                      <td>
                        {student.class?.major || "-"}
                      </td>

                      <td>
                        <span className="status-badge active">
                          <span />
                          {student.status || "AKTIF"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="view-button"
                          onClick={() =>
                            setSelectedStudent(student)
                          }
                          title="Lihat detail siswa"
                        >
                          <Eye size={17} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedStudent && (
        <div
          className="student-modal-overlay"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="student-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="student-modal-header">
              <div>
                <div className="module-eyebrow">
                  DETAIL SISWA
                </div>

                <h3>
                  {selectedStudent.fullName}
                </h3>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedStudent(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className="student-detail-grid">
              <div>
                <span>NIS</span>
                <strong>
                  {selectedStudent.studentNumber}
                </strong>
              </div>

              <div>
                <span>Jenis Kelamin</span>
                <strong>
                  {genderLabel(
                    selectedStudent.gender,
                  )}
                </strong>
              </div>

              <div>
                <span>Tempat Lahir</span>
                <strong>
                  {selectedStudent.birthPlace || "-"}
                </strong>
              </div>

              <div>
                <span>Tanggal Lahir</span>
                <strong>
                  {formatDate(
                    selectedStudent.birthDate,
                  )}
                </strong>
              </div>

              <div>
                <span>Kelas</span>
                <strong>
                  {selectedStudent.class?.name ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Jurusan</span>
                <strong>
                  {selectedStudent.class?.major ||
                    "-"}
                </strong>
              </div>

              <div className="detail-full">
                <span>Alamat</span>
                <strong>
                  {selectedStudent.address || "-"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}