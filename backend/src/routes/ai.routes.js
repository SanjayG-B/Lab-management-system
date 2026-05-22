import express from 'express';
import { aiService } from '../services/ai.service.js';
import { dbService } from '../services/db.service.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Chatbot interactions
router.post('/chatbot', protect, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message parameter is required.' });
  }
  try {
    const reply = await aiService.chatbotAnswer(message, req.user.role);
    res.status(200).json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Equipment wear & risk forecasting (Admin & Staff)
router.get('/predict-maintenance', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const data = await aiService.predictMaintenance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Inventory stock burnout forecasting (Admin & Staff)
router.get('/inventory-forecast', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const data = await aiService.forecastStock();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Student attendance risk trends (Admin & Staff)
router.get('/attendance-analysis', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const data = await aiService.analyzeAttendance();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Main dashboard stats & insights compiler
router.get('/dashboard-summary', protect, async (req, res) => {
  try {
    const equipment = await dbService.find('Equipment');
    const students = await dbService.find('Student');
    const inventory = await dbService.find('Inventory');
    const notifications = await dbService.find('Notification');
    const experiments = await dbService.find('Experiment');

    const equipStats = {
      total: equipment.length,
      available: equipment.filter(e => e.status === 'available').length,
      issued: equipment.filter(e => e.status === 'issued').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
      damaged: equipment.filter(e => e.status === 'damaged').length
    };

    const lowStockCount = inventory.filter(i => i.quantity <= i.threshold).length;
    const warningAttendance = students.filter(s => s.attendancePercentage < 75).length;

    // AI Insight panel triggers
    const insights = [];
    if (equipStats.damaged > 0) {
      insights.push(`🚨 AI Insight: ${equipStats.damaged} device(s) reported faulty. Schedule repairs immediately to protect lab routines.`);
    }
    if (lowStockCount > 0) {
      insights.push(`⚠️ AI Insight: ${lowStockCount} inventory line(s) below warning threshold. Stock depletion imminent.`);
    }
    if (warningAttendance > 0) {
      insights.push(`📈 AI Insight: ${warningAttendance} student(s) below 75% attendance. Warning alerts generated.`);
    }
    if (insights.length === 0) {
      insights.push(`✅ AI Insight: All systems fully stable. Standard equipment schedules detected.`);
    }

    res.status(200).json({
      success: true,
      stats: {
        equipment: equipStats,
        studentsCount: students.length,
        experimentsCount: experiments.length,
        lowStockItems: lowStockCount,
        attendanceWarnings: warningAttendance,
        unreadNotifications: notifications.filter(n => !n.isRead).length
      },
      insights,
      recentNotifications: notifications.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
