const API_URL = "/api";

export type ApiResponse<T = unknown> = {
  success: boolean;
  message?: string;
  data?: T;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    },
  );

  let result: ApiResponse<T>;

  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error(
      "Server mengirim response yang tidak valid.",
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Terjadi kesalahan pada server.",
    );
  }

  return result;
}

/* =========================================================
   AUTH
   ========================================================= */

export type LoginUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
};

export type LoginResponse = {
  user: LoginUser;
};

export async function login(
  username: string,
  password: string,
): Promise<ApiResponse<LoginResponse>> {
  return request<LoginResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({
        username,
        password,
      }),
    },
  );
}

export async function logout(): Promise<ApiResponse> {
  return request(
    "/auth/logout",
    {
      method: "POST",
    },
  );
}

export async function getMe(): Promise<
  ApiResponse<LoginResponse>
> {
  return request<LoginResponse>(
    "/auth/me",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   STUDENTS
   ========================================================= */

export async function getStudents(): Promise<ApiResponse> {
  return request(
    "/students",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   GRADES
   ========================================================= */

export async function getGrades(): Promise<ApiResponse> {
  return request(
    "/grades/me",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   TRANSCRIPTS
   ========================================================= */

export async function getTranscripts(): Promise<ApiResponse> {
  return request(
    "/transcripts",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   DIPLOMAS
   ========================================================= */

export async function getGraduations(): Promise<ApiResponse> {
  return request(
    "/graduations",
    {
      method: "GET",
    },
  );
}

export async function getDiplomas(): Promise<ApiResponse> {
  return request(
    "/diplomas",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   CERTIFICATES
   ========================================================= */

export async function getCertificates(): Promise<ApiResponse> {
  return request(
    "/certificates",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   DOCUMENT VERIFICATION
   ========================================================= */

export type VerificationResult = {
  valid: boolean;
  status: string;
  documentType?: string;
  documentNumber?: string;
  documentName?: string;
  institutionName?: string | null;
  student?: {
    studentNumber: string;
    fullName: string;
  };
  issuedAt?: string | null;
};

export async function verifyDocument(
  verificationCode: string,
  submittedHash: string,
): Promise<ApiResponse<VerificationResult>> {
  return request<VerificationResult>(
    "/verification/document",
    {
      method: "POST",
      body: JSON.stringify({
        verificationCode,
        submittedHash,
      }),
    },
  );
}

/* =========================================================
   AUDIT LOG
   ========================================================= */

export type AuditLog = {
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

export type AuditLogResponse = {
  logs: AuditLog[];
};

export async function getAuditLogs(): Promise<
  ApiResponse<AuditLogResponse>
> {
  return request<AuditLogResponse>(
    "/audit",
    {
      method: "GET",
    },
  );
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

export async function healthCheck(): Promise<ApiResponse> {
  return request(
    "/health",
    {
      method: "GET",
    },
  );
}