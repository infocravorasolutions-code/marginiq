import express from 'express';
import multer from 'multer';
import { importSettlementCsv, getImports } from '../controllers/settlementController';
import { protect } from '../middlewares/auth';
import { requirePermission } from '../middlewares/authorize';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Ensure upload dir exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

router.use(protect); // All settlement routes are protected

router.route('/imports')
  .get(getImports);

router.post('/import', requirePermission('settlements.import'), upload.single('file'), importSettlementCsv);

export default router;
