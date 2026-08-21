import { useEffect, useState } from "react";
import StudentPage from "./pages/StudentPage";
import TeacherPage from "./pages/TeacherPage";
import SubjectPage from "./pages/SubjectPage";
import GradePage from "./pages/GradePage";
import TranscriptPage from "./pages/TranscriptPage";
import DiplomaPage from "./pages/DiplomaPage";
import CertificatePage from "./pages/CertificatePage";
import VerificationPage from "./pages/VerificationPage";
import AuditLogPage from "./pages/AuditLogPage";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Award,
  ShieldCheck,
  ClipboardList,
  LogOut,
  Menu,
  X,
  User,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./App.css";

const API_URL = "/api";

type UserRole =
  | "SISWA"
  | "GURU"
  | "STAF_TU"
  | "KEPALA_SEKOLAH"
  | "MITRA_INDUSTRI";

type UserData = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: string;
};

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user?: UserData;
  };
};

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

function getStoredUser(): UserData | null {
  try {
    const user = localStorage.getItem("school_user");

    if (!user) {
      return null;
    }

    return JSON.parse(user);
  } catch {
    return null;
  }
}

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success) {
        setError(result.message || "Login gagal.");
        return;
      }

      if (!result.data?.user) {
        setError("Data pengguna tidak ditemukan.");
        return;
      }

      localStorage.setItem(
        "school_user",
        JSON.stringify(result.data.user),
      );

      navigate("/dashboard");
    } catch {
      setError(
        "Tidak dapat terhubung ke backend. Pastikan backend berjalan di port 4000.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-brand">
          <div className="brand-icon">
            <ShieldCheck size={32} />
          </div>

          <h1>SMK Bina Bangsa</h1>

          <p>Sistem Informasi Administrasi Sekolah</p>

          <div className="security-label">
            <ShieldCheck size={16} />
            Sistem Terintegrasi dan Aman
          </div>
        </div>

        <form className="login-card" onSubmit={handleLogin}>
          <div className="login-header">
            <h2>Masuk ke Sistem</h2>

            <p>
              Gunakan akun sekolah milikmu untuk melanjutkan.
            </p>
          </div>

          {error && (
            <div className="alert error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>

            <div className="input-wrapper">
              <User size={18} />

              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Masukkan username"
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <Lock size={18} />

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Masukkan password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <div className="login-info">
            <ShieldCheck size={16} />

            <span>
              Akses dilindungi dengan autentikasi dan
              kontrol hak akses berbasis role.
            </span>
          </div>
        </form>

        <div className="login-footer">
          © 2026 SMK Bina Bangsa
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenu, setMobileMenu] = useState(false);

  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function logout() {
    localStorage.removeItem("school_user");
    navigate("/login");
  }

  const roleNames: Record<UserRole, string> = {
    SISWA: "Siswa",
    GURU: "Guru",
    STAF_TU: "Staf Tata Usaha",
    KEPALA_SEKOLAH: "Kepala Sekolah",
    MITRA_INDUSTRI: "Mitra Industri",
  };

  const menu = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: [
        "SISWA",
        "GURU",
        "STAF_TU",
        "KEPALA_SEKOLAH",
        "MITRA_INDUSTRI",
      ],
    },
    {
      label: "Data Siswa",
      path: "/students",
      icon: Users,
      roles: ["STAF_TU", "KEPALA_SEKOLAH", "GURU"],
    },
    {
      label: "Data Guru",
      path: "/teachers",
      icon: GraduationCap,
      roles: ["STAF_TU", "KEPALA_SEKOLAH"],
    },
    {
      label: "Mata Pelajaran",
      path: "/subjects",
      icon: BookOpen,
      roles: ["STAF_TU", "KEPALA_SEKOLAH", "GURU"],
    },
    {
      label: "Nilai",
      path: "/grades",
      icon: ClipboardList,
      roles: [
        "GURU",
        "SISWA",
        "STAF_TU",
        "KEPALA_SEKOLAH",
      ],
    },
    {
      label: "Transkrip",
      path: "/transcripts",
      icon: FileText,
      roles: [
        "SISWA",
        "STAF_TU",
        "KEPALA_SEKOLAH",
      ],
    },
    {
      label: "Ijazah",
      path: "/diplomas",
      icon: GraduationCap,
      roles: [
        "SISWA",
        "STAF_TU",
        "KEPALA_SEKOLAH",
      ],
    },
    {
      label: "Sertifikat PKL",
      path: "/certificates",
      icon: Award,
      roles: [
        "SISWA",
        "STAF_TU",
        "KEPALA_SEKOLAH",
        "MITRA_INDUSTRI",
      ],
    },
    {
      label: "Verifikasi Dokumen",
      path: "/verification",
      icon: ShieldCheck,
      roles: [
        "SISWA",
        "GURU",
        "STAF_TU",
        "KEPALA_SEKOLAH",
        "MITRA_INDUSTRI",
      ],
    },
    {
      label: "Audit Log",
      path: "/audit",
      icon: ShieldCheck,
      roles: ["STAF_TU", "KEPALA_SEKOLAH"],
    },
  ];

  const visibleMenu = menu.filter((item) =>
    item.roles.includes(user.role),
  );

  return (
    <div className="app-layout">
      <aside
        className={`sidebar ${
          mobileMenu ? "sidebar-open" : ""
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <ShieldCheck size={24} />
          </div>

          <div>
            <strong>SMK Bina Bangsa</strong>
            <span>Administrasi</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileMenu(false)}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-title">
            MENU UTAMA
          </div>

          {visibleMenu.map((item) => {
            const Icon = item.icon;

            const active =
              location.pathname === item.path;

            return (
              <button
                key={item.path}
                className={`nav-item ${
                  active ? "active" : ""
                }`}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenu(false);
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-status">
            <ShieldCheck size={17} />

            <div>
              <strong>Sistem Aman</strong>
              <span>Server aktif</span>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <LogOut size={18} />
            Keluar
          </button>
        </div>
      </aside>

      {mobileMenu && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={22} />
          </button>

          <div className="topbar-spacer" />

          <div className="user-profile">
            <div className="user-avatar">
              {user.username
                .substring(0, 1)
                .toUpperCase()}
            </div>

            <div className="user-info">
              <strong>{user.username}</strong>
              <span>{roleNames[user.role]}</span>
            </div>
          </div>
        </header>

        <section className="page-content">
          <Routes>
            <Route
              path="/dashboard"

              element={
                <DashboardHome
                  user={user}
                  roleName={roleNames[user.role]}
                />
              }
            />

            <Route
              path="/students"
              element={<StudentPage />}
            />

            <Route
              path="/teachers"
              element={<TeacherPage />}
            />

            <Route
  path="/subjects"
  element={<SubjectPage />}
/>
            <Route
              path="/grades"
              element={<GradePage />}
            />

            <Route
  path="/transcripts"
  element={<TranscriptPage />}
/>

        <Route
  path="/diplomas"
  element={<DiplomaPage />}
/>

           <Route
  path="/certificates"
  element={<CertificatePage />}
/>

          <Route
  path="/verification"
  element={
    <VerificationPage />
  }
/>

<Route
  path="/audit"
  element={<AuditLogPage />}
/>

            <Route
              path="*"
              element={
                <Navigate
                  to="/dashboard"
                  replace
                />
              }
            />
          </Routes>
        </section>
      </main>
    </div>
  );
}

function DashboardHome({
  user,
  roleName,
}: {
  user: UserData;
  roleName: string;
}) {
  const [teacherCount, setTeacherCount] = useState<number | null>(
    null,
  );

  const [teacherLoading, setTeacherLoading] =
    useState(true);

  useEffect(() => {
    async function loadTeacherCount() {
      try {
        setTeacherLoading(true);

        const response = await fetch(
          `${API_URL}/teachers`,
        );

        if (!response.ok) {
          throw new Error(
            "Gagal mengambil jumlah guru.",
          );
        }

        const result: TeacherResponse =
          await response.json();

        if (!result.success) {
          throw new Error(result.message);
        }

        setTeacherCount(result.data.length);
      } catch {
        setTeacherCount(null);
      } finally {
        setTeacherLoading(false);
      }
    }

    loadTeacherCount();
  }, []);

  const stats = [
    {
      title: "Total Siswa",
      value: "36",
      description: "Siswa terdaftar",
      icon: Users,
      type: "blue",
    },
    {
      title: "Total Guru",
      value: teacherLoading
        ? "..."
        : teacherCount !== null
          ? String(teacherCount)
          : "-",
      description: "Guru terdaftar",
      icon: GraduationCap,
      type: "green",
    },
    {
      title: "Mata Pelajaran",
      value: "10",
      description: "Mapel tersedia",
      icon: BookOpen,
      type: "purple",
    },
    {
      title: "Dokumen",
      value: "108",
      description: "Dokumen tersedia",
      icon: FileText,
      type: "orange",
    },
  ];

  return (
    <div>
      <div className="welcome-section">
        <div className="welcome-content">
          <p className="eyebrow">
            DASHBOARD {roleName.toUpperCase()}
          </p>

          <h2>
            Selamat datang, {user.username}.
          </h2>

          <p className="welcome-description">
            Senang melihatmu kembali. Pantau dan kelola
            administrasi sekolah dari sini.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              className="stat-card"
              key={stat.title}
            >
              <div
                className={`stat-icon ${stat.type}`}
              >
                <Icon size={22} />
              </div>

              <div className="stat-content">
                <span>{stat.title}</span>
                <strong>{stat.value}</strong>
                <small>{stat.description}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Status Sistem</h3>

              <span>
                Kondisi layanan administrasi
              </span>
            </div>

            <CheckCircle2
              className="success-icon"
              size={22}
            />
          </div>

          <div className="status-list">
            <div className="status-row">
              <span>Backend API</span>

              <span className="badge success">
                <CheckCircle2 size={14} />
                Aktif
              </span>
            </div>

            <div className="status-row">
              <span>Database PostgreSQL</span>

              <span className="badge success">
                <CheckCircle2 size={14} />
                Terhubung
              </span>
            </div>

            <div className="status-row">
              <span>Autentikasi</span>

              <span className="badge success">
                <CheckCircle2 size={14} />
                Aktif
              </span>
            </div>

            <div className="status-row">
              <span>Role Access Control</span>

              <span className="badge success">
                <CheckCircle2 size={14} />
                Aktif
              </span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Status Dokumen</h3>

              <span>
                Ringkasan dokumen sekolah
              </span>
            </div>

            <FileText size={22} />
          </div>

          <div className="document-summary">
            <div>
              <strong>36</strong>
              <span>Ijazah</span>

              <small className="valid-text">
                VALID
              </small>
            </div>

            <div>
              <strong>36</strong>
              <span>Sertifikat PKL</span>

              <small className="valid-text">
                VALID
              </small>
            </div>

            <div>
              <strong>36</strong>
              <span>Transkrip</span>

              <small className="valid-text">
                VALID
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="panel activity-panel">
        <div className="panel-header">
          <div>
            <h3>Informasi Sistem</h3>

            <span>
              Ringkasan aktivitas aplikasi
            </span>
          </div>

          <ShieldCheck size={22} />
        </div>

        <div className="info-grid">
          <div className="info-item">
            <CheckCircle2 size={19} />

            <div>
              <strong>Login berhasil</strong>

              <span>
                Akun {user.username} berhasil
                terautentikasi.
              </span>
            </div>
          </div>

          <div className="info-item">
            <ShieldCheck size={19} />

            <div>
              <strong>Hak akses aktif</strong>

              <span>
                Role {roleName} telah diterapkan.
              </span>
            </div>
          </div>

          <div className="info-item">
            <FileText size={19} />

            <div>
              <strong>Dokumen tersedia</strong>

              <span>
                Data dokumen sekolah tersedia.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;







