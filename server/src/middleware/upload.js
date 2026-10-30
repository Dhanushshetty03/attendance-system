import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory in server root
const uploadsRoot = path.join(__dirname, '../../uploads');
const proofsDir = path.join(uploadsRoot, 'proofs');
const avatarsDir = path.join(uploadsRoot, 'avatars');

// Ensure directories exist
[uploadsRoot, proofsDir, avatarsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage for proof documents (medical certs, OD letters)
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, proofsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

// Configure disk storage for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    cb(null, safeName);
  },
});

// File filter: accept images and PDFs
const documentFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, PNG, JPG, and WEBP documents are permitted.'), false);
  }
};

const imageFilter = (req, file, cb) => {
  const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only PNG, JPG, and WEBP images are permitted.'), false);
  }
};

export const uploadProof = multer({
  storage: proofStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: documentFilter,
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: imageFilter,
});
