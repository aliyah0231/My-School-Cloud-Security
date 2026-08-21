export const PERMISSIONS = {
  PROFILE_READ_OWN: "profile:read:own",

  STUDENTS_READ: "students:read",
  STUDENTS_CREATE: "students:create",
  STUDENTS_UPDATE: "students:update",
  STUDENTS_DELETE: "students:delete",

  TEACHERS_READ: "teachers:read",
  TEACHERS_CREATE: "teachers:create",
  TEACHERS_UPDATE: "teachers:update",

  SUBJECTS_READ: "subjects:read",
  SUBJECTS_CREATE: "subjects:create",
  SUBJECTS_UPDATE: "subjects:update",

  CLASSES_READ: "classes:read",
  CLASSES_CREATE: "classes:create",
  CLASSES_UPDATE: "classes:update",

  GRADES_READ: "grades:read",
  GRADES_READ_OWN: "grades:read:own",
  GRADES_CREATE: "grades:create",
  GRADES_UPDATE: "grades:update",

  TRANSCRIPT_READ: "transcript:read",
  TRANSCRIPT_READ_OWN: "transcript:read:own",
  TRANSCRIPT_MANAGE: "transcript:manage",

  DIPLOMA_READ: "diploma:read",
  DIPLOMA_READ_OWN: "diploma:read:own",
  DIPLOMA_MANAGE: "diploma:manage",
  DIPLOMA_APPROVE: "diploma:approve",

  CERTIFICATE_READ: "certificate:read",
  CERTIFICATE_READ_OWN: "certificate:read:own",
  CERTIFICATE_MANAGE: "certificate:manage",
  CERTIFICATE_APPROVE: "certificate:approve",

  VERIFICATION_CREATE: "verification:create",
  VERIFICATION_READ: "verification:read",
  VERIFICATION_APPROVE: "verification:approve",

  AUDIT_READ: "audit:read",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];