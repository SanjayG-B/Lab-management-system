import express from 'express';
import { dbService } from '../services/db.service.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all students
router.get('/', protect, async (req, res) => {
  try {
    const { department, semester } = req.query;
    let students = await dbService.find('Student');

    if (department) {
      students = students.filter(s => s.department === department);
    }
    if (semester) {
      students = students.filter(s => s.semester.toString() === semester.toString());
    }

    // Populate user email & name
    const populated = await Promise.all(students.map(async (stud) => {
      const usr = await dbService.findById('User', stud.user);
      return {
        ...stud,
        name: usr ? usr.name : 'Unknown Student',
        email: usr ? usr.email : ''
      };
    }));

    res.status(200).json({ success: true, count: populated.length, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get student details by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await dbService.findById('Student', req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const usr = await dbService.findById('User', student.user);
    const allEquip = await dbService.find('Equipment');
    const assignedDetails = allEquip.filter(e => 
      student.assignedEquipment?.some(eqId => eqId.toString() === e._id.toString())
    );

    const data = {
      ...student,
      name: usr ? usr.name : 'Unknown Student',
      email: usr ? usr.email : '',
      assignedEquipmentDetails: assignedDetails
    };

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update student profile (Admin & Staff)
router.put('/:id', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const student = await dbService.findById('Student', req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const updated = await dbService.findByIdAndUpdate('Student', req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bulk Log Session Attendance (Admin & Staff)
router.post('/attendance/mark', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const { date, labSession, records } = req.body; // records: [{ studentId, status }]
    if (!date || !labSession || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid payload structure.' });
    }

    const logOutputs = [];
    for (let rec of records) {
      const newLog = await dbService.create('Attendance', {
        student: rec.studentId,
        date: new Date(date),
        status: rec.status,
        labSession,
        markedBy: req.user._id
      });
      logOutputs.push(newLog);

      // Re-calculate the student overall attendance
      const allStudentLogs = await dbService.find('Attendance', { student: rec.studentId });
      const total = allStudentLogs.length;
      const present = allStudentLogs.filter(l => l.status === 'present').length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;

      await dbService.findByIdAndUpdate('Student', rec.studentId, { attendancePercentage: pct });
    }

    res.status(201).json({ success: true, message: 'Attendance registered successfully.', data: logOutputs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Attendance records
router.get('/attendance/logs', protect, async (req, res) => {
  try {
    const { date, labSession } = req.query;
    let logs = await dbService.find('Attendance');

    if (date) {
      const searchStr = new Date(date).toDateString();
      logs = logs.filter(l => new Date(l.date).toDateString() === searchStr);
    }
    if (labSession) {
      logs = logs.filter(l => l.labSession === labSession);
    }

    const populated = await Promise.all(logs.map(async (log) => {
      const stud = await dbService.findById('Student', log.student);
      const usr = stud ? await dbService.findById('User', stud.user) : null;
      return {
        ...log,
        studentName: usr ? usr.name : 'Unknown Student',
        studentRollNumber: stud ? stud.rollNumber : ''
      };
    }));

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
