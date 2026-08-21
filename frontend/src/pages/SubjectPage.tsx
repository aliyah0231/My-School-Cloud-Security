import { useEffect, useState } from "react";
import "./SubjectPage.css";

type Subject = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type SubjectResponse = {
  success: boolean;
  message: string;
  data: Subject[];
};

const API_URL = "/api";

export default function SubjectPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function loadSubjects() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/subjects`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data mata pelajaran.");
      }

      const result: SubjectResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setSubjects(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSubjects();
  }, []);

  function resetForm() {
    setCode("");
    setName("");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
  }

  function startAdd() {
    setCode("");
    setName("");
    setDescription("");
    setEditingId(null);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function startEdit(subject: Subject) {
    setEditingId(subject.id);
    setCode(subject.code);
    setName(subject.name);
    setDescription(subject.description || "");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!code.trim()) {
      setError("Kode mata pelajaran wajib diisi.");
      return;
    }

    if (!name.trim()) {
      setError("Nama mata pelajaran wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/subjects/${editingId}`
        : `${API_URL}/subjects`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.trim(),
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menyimpan data mata pelajaran.",
        );
      }

      setSuccess(
        editingId
          ? "Data mata pelajaran berhasil diperbarui."
          : "Data mata pelajaran berhasil ditambahkan.",
      );

      resetForm();

      await loadSubjects();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(subject: Subject) {
    const confirmed = window.confirm(
      `Hapus mata pelajaran "${subject.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/subjects/${subject.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menghapus data.",
        );
      }

      setSuccess("Data mata pelajaran berhasil dihapus.");

      await loadSubjects();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Gagal menghapus data.",
      );
    }
  }

  const filteredSubjects = subjects.filter((subject) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      subject.code.toLowerCase().includes(keyword) ||
      subject.name.toLowerCase().includes(keyword) ||
      (subject.description || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  return (
    <div className="subject-page">
      <div className="subject-header">

        <div className="subject-header-left">
          <div className="subject-icon">
            📚
          </div>

          <span className="subject-eyebrow">
            ADMINISTRASI SEKOLAH
          </span>
        </div>

        <div className="subject-title">
          <h1>Mata Pelajaran</h1>

          <p>
            Kelola data mata pelajaran untuk proses pembelajaran.
          </p>
        </div>

        <div className="subject-actions">
          <button
            className="subject-btn subject-btn-secondary"
            onClick={() => void loadSubjects()}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>

          <button
            className="subject-btn subject-btn-primary"
            onClick={startAdd}
          >
            + Tambah Mata Pelajaran
          </button>
        </div>

      </div>

      {error && (
        <div className="subject-alert subject-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="subject-alert subject-alert-success">
          {success}
        </div>
      )}

      {showForm && (
        <div className="subject-form-card">
          <div className="subject-form-header">
            <div>
              <h2>
                {editingId
                  ? "Edit Mata Pelajaran"
                  : "Tambah Mata Pelajaran"}
              </h2>

              <p>
                {editingId
                  ? "Perbarui informasi mata pelajaran."
                  : "Masukkan informasi mata pelajaran baru."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="subject-form-grid">
              <div className="subject-field">
                <label>Kode Mata Pelajaran</label>

                <input
                  type="text"
                  value={code}
                  onChange={(event) =>
                    setCode(event.target.value)
                  }
                  placeholder="Contoh: MAT001"
                  required
                />
              </div>

              <div className="subject-field">
                <label>Nama Mata Pelajaran</label>

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Contoh: Matematika"
                  required
                />
              </div>

              <div className="subject-field subject-field-full">
                <label>Deskripsi</label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Deskripsi mata pelajaran"
                  rows={3}
                />
              </div>
            </div>

            <div className="subject-form-actions">
              <button
                type="button"
                className="subject-btn subject-btn-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Batal
              </button>

              <button
                type="submit"
                className="subject-btn subject-btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Simpan Mata Pelajaran"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="subject-table-card">
        <div className="subject-table-toolbar">
          <div className="subject-table-info">
            <div>
              <strong>Daftar Mata Pelajaran</strong>

              <span>
                Kelola kode, nama, dan deskripsi mata pelajaran.
              </span>
            </div>
          </div>

          <input
            className="subject-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Cari kode atau nama..."
          />
        </div>

        {loading ? (
          <div className="subject-loading">
            Memuat data mata pelajaran...
          </div>
        ) : (
          <div className="subject-table-wrapper">
            <table className="subject-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Kode</th>
                  <th>Nama Mata Pelajaran</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="subject-empty"
                    >
                      {search
                        ? "Data mata pelajaran tidak ditemukan."
                        : "Belum ada data mata pelajaran."}
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map(
                    (subject, index) => (
                      <tr key={subject.id}>
                        <td className="subject-number">
                          {index + 1}
                        </td>

                        <td>
                          <span className="subject-code">
                            {subject.code}
                          </span>
                        </td>

                        <td>
                          <span className="subject-name">
                            {subject.name}
                          </span>
                        </td>

                        <td>
                          <span className="subject-description">
                            {subject.description || "-"}
                          </span>
                        </td>

                        <td>
                          <div className="subject-actions-cell">
                            <button
                              className="subject-btn subject-btn-edit"
                              onClick={() =>
                                startEdit(subject)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="subject-btn subject-btn-delete"
                              onClick={() =>
                                void handleDelete(subject)
                              }
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}