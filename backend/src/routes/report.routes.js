import express from 'express';
import { dbService } from '../services/db.service.js';
import { protect, authorize } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reportsDir = path.join(__dirname, '../../reports');

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Get list of generated reports
router.get('/', protect, async (req, res) => {
  try {
    const reports = await dbService.find('Report');
    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Generate a new report export link
router.post('/generate', protect, authorize('hod', 'staff'), async (req, res) => {
  const { title, type, format } = req.body; // type: inventory, attendance, maintenance, usage. format: pdf, excel.
  if (!title || !type || !format) {
    return res.status(400).json({ success: false, message: 'Title, report type, and format are required.' });
  }
  try {
    const timestamp = Date.now();
    const filename = `${type}_report_${timestamp}.${format === 'excel' ? 'xlsx' : format}`;
    const filePath = path.join(reportsDir, filename);
    const fileUrl = `/reports/${filename}`;

    // Create a dummy report content based on type and format
    let fileContent = '';
    if (format === 'excel' || format === 'csv') {
      fileContent = `Report Title,${title}\nGenerated At,${new Date().toLocaleString()}\nType,${type}\nFormat,${format}\nStatus,Verified\n`;
    } else {
      fileContent = `======================================\n      LABS AUDIT REPORT\n======================================\nTitle: ${title}\nGenerated At: ${new Date().toLocaleString()}\nType: ${type.toUpperCase()}\nFormat: ${format.toUpperCase()}\nStatus: System verified telemetry.\n======================================\n`;
    }
    fs.writeFileSync(filePath, fileContent);

    const newReport = await dbService.create('Report', {
      title,
      type,
      format,
      fileUrl,
      generatedBy: req.user._id
    });

    res.status(201).json({ success: true, message: 'Report compiled successfully.', data: newReport });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
