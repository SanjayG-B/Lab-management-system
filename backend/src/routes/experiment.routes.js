import express from 'express';
import { dbService } from '../services/db.service.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';
import { aiService } from '../services/ai.service.js';

const router = express.Router();

// Get all experiments
router.get('/', protect, async (req, res) => {
  try {
    const experiments = await dbService.find('Experiment');
    res.status(200).json({ success: true, data: experiments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new experiment syllabus (Admin & Staff)
// Handles lab manual PDF upload
router.post('/', protect, authorize('hod', 'staff'), upload.single('manual'), async (req, res) => {
  try {
    const { title, code, description, department } = req.body;
    const manualUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const exists = await dbService.findOne('Experiment', { code });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Experiment code already registered.' });
    }

    const newExperiment = await dbService.create('Experiment', {
      title,
      code,
      description,
      department,
      manualUrl,
      status: 'active',
      createdBy: req.user._id,
      submissions: []
    });

    res.status(201).json({ success: true, data: newExperiment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload/Update manual for an existing experiment (Admin & Staff)
router.post('/:id/manual', protect, authorize('hod', 'staff'), upload.single('manual'), async (req, res) => {
  try {
    const experiment = await dbService.findById('Experiment', req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment syllabus item not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select a PDF file to upload.' });
    }

    const manualUrl = `/uploads/${req.file.filename}`;

    const updated = await dbService.findByIdAndUpdate('Experiment', req.params.id, {
      manualUrl
    });

    res.status(200).json({ success: true, message: 'Lab manual uploaded successfully.', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student uploads lab report & runs OCR scans (Student only)
// Handles record handwritten image scan
router.post('/:id/submit', protect, upload.single('recordImage'), async (req, res) => {
  try {
    const experiment = await dbService.findById('Experiment', req.params.id);
    if (!experiment) {
      return res.status(404).json({ success: false, message: 'Experiment syllabus item not found.' });
    }

    const student = await dbService.findOne('Student', { user: req.user._id });
    if (!student) {
      return res.status(403).json({ success: false, message: 'Access denied. Active student profile required to submit reports.' });
    }

    const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';
    let ocrText = '';

    if (req.file) {
      ocrText = await aiService.ocrScan(req.file.path);
    }

    // Auto grading simulation: look for quantitative elements in digitized text
    let grade = 'B';
    if (ocrText.toLowerCase().includes('verified') || ocrText.toLowerCase().includes('constant')) {
      grade = 'A';
    } else if (ocrText.toLowerCase().includes('error') || ocrText.length < 50) {
      grade = 'C';
    }

    const newSubmission = {
      student: student._id,
      fileUrl,
      ocrText,
      grade,
      submittedAt: new Date()
    };

    const currentSubmissions = experiment.submissions ? [...experiment.submissions] : [];
    const filteredSubmissions = currentSubmissions.filter(s => s.student?.toString() !== student._id?.toString());
    filteredSubmissions.push(newSubmission);

    await dbService.findByIdAndUpdate('Experiment', req.params.id, {
      submissions: filteredSubmissions
    });

    res.status(200).json({
      success: true,
      message: 'Lab log submitted and processed by AI scanner.',
      submission: newSubmission
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
