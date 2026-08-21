import { useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ShieldCheck,
  Clock3,
  User,
  Database,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { getAuditLogs } from "../services/api";
import "./AuditLogPage.css";

type AuditLog = {
  id: string;
  role: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  ipAddress: string | null;
  status: string;
  metadata: unknown;
  createdAt: string;
};

type AuditResponse = {
  logs: AuditLog[];
};

function getRoleLabel(role: string | null) {
  switch (role) {
    case "STAF_TU":
      return "Staf Tata Usaha";

    case "KEPALA_SEKOLAH":
      return "Kepala Sekolah";

    case "ADMIN":
      return "Administrator";

    case "GURU":
      return "Guru";

    case "SISWA":
      return "Siswa";

    default:
      return role || "-";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "SUCCESS":
      return "Berhasil";

    case "FAILED":
      return "Gagal";

    case "DENIED":
      return "Ditolak";

    default:
      return status;
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "SUCCESS":
      return "success";

    case "FAILED":
      return "danger";

    case "DENIED":
      return "warning";

    default:
      return "";
  }
}

function formatAction(action: string) {
  return action
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatResource(resource: string) {
  return resource
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getMetadataText(metadata: unknown) {
  if (!metadata) {
    return "-";
  }

  if (
    typeof metadata === "string"
  ) {
    return metadata;
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return "-";
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [actionFilter, setActionFilter] =
    useState("ALL");

  const [resourceFilter, setResourceFilter] =
    useState("ALL");

  async function loadAuditLogs(
    showRefresh = false,
  ) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getAuditLogs();

      if (
        !response.success ||
        !response.data
      ) {
        throw new Error(
          response.message ||
            "Gagal mengambil audit log.",
        );
      }

      const data =
        response.data as AuditResponse;

      setLogs(data.logs ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal mengambil audit log.";

      setError(message);
      setLogs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAuditLogs();
  }, []);

  const actions = useMemo(() => {
    return Array.from(
      new Set(logs.map((log) => log.action)),
    ).sort();
  }, [logs]);

  const resources = useMemo(() => {
    return Array.from(
      new Set(
        logs.map((log) => log.resource),
      ),
    ).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const statusMatch =
        statusFilter === "ALL" ||
        log.status === statusFilter;

      const actionMatch =
        actionFilter === "ALL" ||
        log.action === actionFilter;

      const resourceMatch =
        resourceFilter === "ALL" ||
        log.resource === resourceFilter;

      return (
        statusMatch &&
        actionMatch &&
        resourceMatch
      );
    });
  }, [
    logs,
    statusFilter,
    actionFilter,
    resourceFilter,
  ]);

  const successCount = logs.filter(
    (log) => log.status === "SUCCESS",
  ).length;

  const failedCount = logs.filter(
    (log) =>
      log.status === "FAILED" ||
      log.status === "DENIED",
  ).length;

  return (
    <div className="audit-page">
      <div className="academic-header">
        <div className="academic-title">
          <div className="academic-icon">
            <ShieldCheck size={26} />
          </div>

          <div>
            <div className="module-eyebrow">
              KEAMANAN SISTEM
            </div>

            <h2>Audit Log</h2>

            <p>
              Pantau aktivitas dan perubahan
              pada sistem administrasi sekolah.
            </p>
          </div>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            void loadAuditLogs(true)
          }
          disabled={
            loading || refreshing
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

      {error && (
        <div className="student-alert">
          <AlertCircle size={19} />

          <div>
            <strong>
              Audit log belum dapat dimuat.
            </strong>

            <span>{error}</span>
          </div>

          <button
            onClick={() =>
              void loadAuditLogs()
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
              Memuat audit log...
            </strong>

            <span>
              Mengambil aktivitas dari
              database.
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="audit-stat-grid">
            <div className="audit-stat-card">
              <div className="audit-stat-icon">
                <FileText size={20} />
              </div>

              <div>
                <span>Total Aktivitas</span>
                <strong>
                  {logs.length}
                </strong>
              </div>
            </div>

            <div className="audit-stat-card">
              <div className="audit-stat-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <span>Berhasil</span>
                <strong>
                  {successCount}
                </strong>
              </div>
            </div>

            <div className="audit-stat-card">
              <div className="audit-stat-icon">
                <XCircle size={20} />
              </div>

              <div>
                <span>Gagal / Ditolak</span>
                <strong>
                  {failedCount}
                </strong>
              </div>
            </div>

            <div className="audit-stat-card">
              <div className="audit-stat-icon">
                <Clock3 size={20} />
              </div>

              <div>
                <span>Data Ditampilkan</span>
                <strong>
                  {filteredLogs.length}
                </strong>
              </div>
            </div>
          </div>

          <div className="academic-panel audit-panel">
            <div className="audit-toolbar">
              <div>
                <h3>Aktivitas Sistem</h3>

                <p>
                  Menampilkan maksimal 100
                  aktivitas terbaru.
                </p>
              </div>

              <div className="audit-filters">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                >
                  <option value="ALL">
                    Semua Status
                  </option>

                  <option value="SUCCESS">
                    Berhasil
                  </option>

                  <option value="FAILED">
                    Gagal
                  </option>

                  <option value="DENIED">
                    Ditolak
                  </option>
                </select>

                <select
                  value={actionFilter}
                  onChange={(event) =>
                    setActionFilter(
                      event.target.value,
                    )
                  }
                >
                  <option value="ALL">
                    Semua Aktivitas
                  </option>

                  {actions.map((action) => (
                    <option
                      key={action}
                      value={action}
                    >
                      {formatAction(action)}
                    </option>
                  ))}
                </select>

                <select
                  value={resourceFilter}
                  onChange={(event) =>
                    setResourceFilter(
                      event.target.value,
                    )
                  }
                >
                  <option value="ALL">
                    Semua Resource
                  </option>

                  {resources.map(
                    (resource) => (
                      <option
                        key={resource}
                        value={resource}
                      >
                        {formatResource(
                          resource,
                        )}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <div className="academic-table-wrapper">
              {filteredLogs.length === 0 ? (
                <div className="empty-academic">
                  <div className="empty-academic-icon">
                    <ShieldCheck
                      size={28}
                    />
                  </div>

                  <h3>
                    Belum ada audit log
                  </h3>

                  <p>
                    Tidak ada aktivitas
                    yang sesuai dengan
                    filter.
                  </p>
                </div>
              ) : (
                <table className="academic-table audit-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Waktu</th>
                      <th>Role</th>
                      <th>Aktivitas</th>
                      <th>Resource</th>
                      <th>Resource ID</th>
                      <th>IP Address</th>
                      <th>Status</th>
                      <th>Metadata</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredLogs.map(
                      (log, index) => (
                        <tr key={log.id}>
                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <div className="audit-date">
                              <Clock3
                                size={14}
                              />

                              <span>
                                {formatDate(
                                  log.createdAt,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="audit-role">
                              <User
                                size={14}
                              />

                              <span>
                                {getRoleLabel(
                                  log.role,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <strong>
                              {formatAction(
                                log.action,
                              )}
                            </strong>
                          </td>

                          <td>
                            <div className="audit-resource">
                              <Database
                                size={14}
                              />

                              <span>
                                {formatResource(
                                  log.resource,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <code>
                              {log.resourceId ||
                                "-"}
                            </code>
                          </td>

                          <td>
                            <div className="audit-ip">
                              <Globe
                                size={14}
                              />

                              <span>
                                {log.ipAddress ||
                                  "-"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`academic-badge ${getStatusClass(
                                log.status,
                              )}`}
                            >
                              {getStatusLabel(
                                log.status,
                              )}
                            </span>
                          </td>

                          <td>
                            <span className="audit-metadata">
                              {getMetadataText(
                                log.metadata,
                              )}
                            </span>
                          </td>
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