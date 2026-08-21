import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import "./TeacherPage.css";

type Teacher = {
  id: string;
  employeeNumber: string;
  fullName: string;
  phone: string | null;
  address: string | null;
};

type TeacherResponse = {
  success: boolean;
  message: string;
  data: Teacher[];
};

type TeacherForm = {
  employeeNumber: string;
  fullName: string;
  phone: string;
  address: string;
};

const API_URL = "/api";

const emptyForm: TeacherForm = {
  employeeNumber: "",
  fullName: "",
  phone: "",
  address: "",
};

export default function TeacherPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TeacherForm>(emptyForm);

  async function loadTeachers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/teachers`);

      if (!response.ok) {
        throw new Error("Gagal mengambil data guru.");
      }

      const result: TeacherResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setTeachers(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data guru.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeachers();
  }, []);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(teacher: Teacher) {
    setEditingId(teacher.id);

    setForm({
      employeeNumber: teacher.employeeNumber,
      fullName: teacher.fullName,
      phone: teacher.phone || "",
      address: teacher.address || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(
    field: keyof TeacherForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.employeeNumber.trim()) {
      setError("Nomor pegawai wajib diisi.");
      return;
    }

    if (!form.fullName.trim()) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_URL}/teachers/${editingId}`
        : `${API_URL}/teachers`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeNumber: form.employeeNumber.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menyimpan data guru.",
        );
      }

      setSuccess(
        editingId
          ? "Data guru berhasil diperbarui."
          : "Data guru berhasil ditambahkan.",
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadTeachers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan data guru.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(teacher: Teacher) {
    const confirmed = window.confirm(
      `Hapus data guru "${teacher.fullName}"?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/teachers/${teacher.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Gagal menghapus data guru.",
        );
      }

      setSuccess("Data guru berhasil dihapus.");

      await loadTeachers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menghapus data guru.",
      );
    }
  }

  const filteredTeachers = teachers.filter((teacher) => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return true;

    return (
      teacher.employeeNumber
        .toLowerCase()
        .includes(keyword) ||
      teacher.fullName.toLowerCase().includes(keyword) ||
      (teacher.phone || "").toLowerCase().includes(keyword) ||
      (teacher.address || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="teacher-page">
      <div className="teacher-header">

        <div className="teacher-admin-label">
          ADMINISTRASI SEKOLAH
        </div>

        <div className="teacher-title">
          <h1>Data Guru</h1>
          <p>Kelola data guru dan tenaga pengajar.</p>
        </div>

        <div className="teacher-actions">
          <button
            className="teacher-btn teacher-btn-secondary"
            onClick={loadTeachers}
            disabled={loading}
          >
            {loading ? "Memuat..." : "Refresh"}
          </button>

          <button
            className="teacher-btn teacher-btn-primary"
            onClick={openAddForm}
          >
            + Tambah Guru
          </button>
        </div>

      </div>

      {error && (
        <div className="teacher-alert teacher-alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="teacher-alert teacher-alert-success">
          {success}
        </div>
      )}

      {showForm && (
        <div className="teacher-form-card">
          <div className="teacher-form-header">
            <h2>
              {editingId ? "Edit Data Guru" : "Tambah Guru"}
            </h2>

            <p>
              {editingId
                ? "Perbarui informasi guru."
                : "Masukkan informasi guru baru."}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="teacher-form-grid">
              <div className="teacher-field">
                <label>Nomor Pegawai</label>

                <input
                  type="text"
                  value={form.employeeNumber}
                  onChange={(event) =>
                    handleChange(
                      "employeeNumber",
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: G001"
                  required
                />
              </div>

              <div className="teacher-field">
                <label>Nama Lengkap</label>

                <input
                  type="text"
                  value={form.fullName}
                  onChange={(event) =>
                    handleChange(
                      "fullName",
                      event.target.value,
                    )
                  }
                  placeholder="Nama lengkap guru"
                  required
                />
              </div>

              <div className="teacher-field">
                <label>Nomor Telepon</label>

                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) =>
                    handleChange(
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div className="teacher-field">
                <label>Alamat</label>

                <input
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    handleChange(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="Alamat guru"
                />
              </div>
            </div>

            <div className="teacher-form-actions">
              <button
                className="teacher-btn teacher-btn-primary"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Simpan Guru"}
              </button>

              <button
                className="teacher-btn teacher-btn-secondary"
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="teacher-table-card">
        <div className="teacher-table-toolbar">
          <div className="teacher-table-info">
            <strong>Daftar Guru</strong>

            <span className="teacher-count">
              {filteredTeachers.length}
            </span>
          </div>

          <input
            className="teacher-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Cari guru..."
          />
        </div>

        {loading ? (
          <div className="teacher-loading">
            Memuat data guru...
          </div>
        ) : (
          <div className="teacher-table-wrapper">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>NIP</th>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Alamat</th>
                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td
                      className="teacher-empty"
                      colSpan={6}
                    >
                      {search
                        ? "Data guru tidak ditemukan."
                        : "Belum ada data guru."}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map(
                    (teacher, index) => (
                      <tr key={teacher.id}>
                        <td className="teacher-number">
                          {index + 1}
                        </td>

                        <td>
                          <span className="teacher-nip">
                            {teacher.employeeNumber}
                          </span>
                        </td>

                        <td>
                          <span className="teacher-name">
                            {teacher.fullName}
                          </span>
                        </td>

                        <td>
                          {teacher.phone || "-"}
                        </td>

                        <td>
                          {teacher.address || "-"}
                        </td>

                        <td>
                          <div className="teacher-actions-cell">
                            <button
                              className="teacher-btn teacher-btn-edit"
                              onClick={() =>
                                openEditForm(teacher)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="teacher-btn teacher-btn-delete"
                              onClick={() =>
                                handleDelete(teacher)
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
