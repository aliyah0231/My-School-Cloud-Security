import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const diplomaDir = path.resolve("uploads/diplomas");
const certificateDir = path.resolve("uploads/certificates");

fs.mkdirSync(diplomaDir, { recursive: true });
fs.mkdirSync(certificateDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const isCertificate =
      file.fieldname === "certificate";

    cb(
      null,
      isCertificate
        ? certificateDir
        : diplomaDir,
    );
  },

  filename: (_req, file, cb) => {
    const extension =
      path.extname(file.originalname).toLowerCase();

    const filename =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}${extension}`;

    cb(null, filename);
  },
});

const fileFilter: multer.Options["fileFilter"] = (
  _req,
  file,
  cb,
) => {
  const allowedMimeTypes = [
    "application/pdf",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(
      new Error(
        "File harus berformat PDF.",
      ),
    );

    return;
  }

  cb(null, true);
};

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});