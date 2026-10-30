import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadProof, uploadAvatar } from '../middleware/upload.js';

const router = Router();

// Upload proof document (medical cert, OD letter)
router.post('/proof', authenticate, uploadProof.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded or file rejected by validator.' });
  }

  const fileUrl = `/uploads/proofs/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Proof document uploaded successfully',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    fileUrl,
  });
});

// Upload profile avatar
router.post('/avatar', authenticate, uploadAvatar.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image uploaded or image rejected by validator.' });
  }

  const fileUrl = `/uploads/avatars/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Avatar image uploaded successfully',
    filename: req.file.filename,
    fileUrl,
  });
});

export default router;
