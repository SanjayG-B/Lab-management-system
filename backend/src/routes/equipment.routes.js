import express from 'express';
import { dbService } from '../services/db.service.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all equipment
router.get('/', protect, async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let equipment = await dbService.find('Equipment');

    if (category) {
      equipment = equipment.filter(e => e.category === category);
    }
    if (status) {
      equipment = equipment.filter(e => e.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      equipment = equipment.filter(e => 
        e.name.toLowerCase().includes(q) || 
        e.serialNumber.toLowerCase().includes(q)
      );
    }

    res.status(200).json({ success: true, count: equipment.length, data: equipment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get equipment by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await dbService.findById('Equipment', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add equipment (Admin & Staff)
router.post('/', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const { name, serialNumber, category, location, status } = req.body;

    const exists = await dbService.findOne('Equipment', { serialNumber });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An item with this serial number is already registered.' });
    }

    const qrCodeUrl = `qr:lab:equip:${serialNumber}`;
    const newItem = await dbService.create('Equipment', {
      name,
      serialNumber,
      category,
      location,
      status: status || 'available',
      lastMaintenanceDate: new Date(),
      nextMaintenanceDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
      usageHours: 0,
      qrCodeUrl,
      addedBy: req.user._id
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update equipment details (Admin & Staff)
router.put('/:id', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const item = await dbService.findById('Equipment', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }

    const updated = await dbService.findByIdAndUpdate('Equipment', req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete equipment (Admin only)
router.delete('/:id', protect, authorize('hod'), async (req, res) => {
  try {
    const item = await dbService.findById('Equipment', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }

    await dbService.findByIdAndDelete('Equipment', req.params.id);
    res.status(200).json({ success: true, message: 'Equipment record removed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Issue equipment to student (Admin & Staff)
router.post('/:id/issue', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const { studentRollNumber } = req.body;
    const item = await dbService.findById('Equipment', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }

    if (item.status !== 'available') {
      return res.status(400).json({ success: false, message: `Equipment is currently ${item.status}. Cannot issue.` });
    }

    const student = await dbService.findOne('Student', { rollNumber: studentRollNumber });
    if (!student) {
      return res.status(404).json({ success: false, message: `No student record found for roll number '${studentRollNumber}'.` });
    }

    // Set status to issued
    const updatedItem = await dbService.findByIdAndUpdate('Equipment', req.params.id, { status: 'issued' });
    
    // Add item to student's list
    const assigned = student.assignedEquipment ? [...student.assignedEquipment] : [];
    assigned.push(item._id);
    await dbService.findByIdAndUpdate('Student', student._id, { assignedEquipment: assigned });

    res.status(200).json({ success: true, message: `Equipment assigned to student ${studentRollNumber}.`, data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Return issued equipment (Admin & Staff)
router.post('/:id/return', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const { condition, usageHours } = req.body; // condition: 'available' / 'damaged'
    const item = await dbService.findById('Equipment', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment item not found.' });
    }

    if (item.status !== 'issued') {
      return res.status(400).json({ success: false, message: 'This item is not currently flagged as issued.' });
    }

    // Locate student holding this item
    const students = await dbService.find('Student');
    const holder = students.find(s => s.assignedEquipment?.some(eqId => eqId.toString() === req.params.id));
    if (holder) {
      const assigned = holder.assignedEquipment.filter(eqId => eqId.toString() !== req.params.id);
      await dbService.findByIdAndUpdate('Student', holder._id, { assignedEquipment: assigned });
    }

    const runHours = item.usageHours + (usageHours || 0);
    const updatedItem = await dbService.findByIdAndUpdate('Equipment', req.params.id, {
      status: condition || 'available',
      usageHours: runHours
    });

    res.status(200).json({ success: true, message: 'Equipment returned and checked back in.', data: updatedItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
