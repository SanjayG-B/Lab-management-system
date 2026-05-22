import express from 'express';
import { dbService } from '../services/db.service.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all inventory items
router.get('/', protect, async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    let inventory = await dbService.find('Inventory');

    if (category) {
      inventory = inventory.filter(i => i.category === category);
    }
    if (lowStock === 'true') {
      inventory = inventory.filter(i => i.quantity <= i.threshold);
    }

    res.status(200).json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inventory item by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await dbService.findById('Inventory', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add stock item (Admin & Staff)
router.post('/', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const { itemName, category, quantity, threshold, unit, costPerUnit, supplier } = req.body;

    const exists = await dbService.findOne('Inventory', { itemName });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Item already exists in inventory registry.' });
    }

    const newItem = await dbService.create('Inventory', {
      itemName,
      category,
      quantity: quantity || 0,
      threshold: threshold || 5,
      unit: unit || 'pcs',
      costPerUnit: costPerUnit || 0,
      supplier: supplier || '',
      lastRestocked: new Date()
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update stock quantities / details (Admin & Staff)
router.put('/:id', protect, authorize('hod', 'staff'), async (req, res) => {
  try {
    const item = await dbService.findById('Inventory', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    const updateFields = { ...req.body };
    if (req.body.quantity !== undefined && req.body.quantity > item.quantity) {
      updateFields.lastRestocked = new Date();
    }

    const updated = await dbService.findByIdAndUpdate('Inventory', req.params.id, updateFields);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete stock item (Admin only)
router.delete('/:id', protect, authorize('hod'), async (req, res) => {
  try {
    const item = await dbService.findById('Inventory', req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found.' });
    }

    await dbService.findByIdAndDelete('Inventory', req.params.id);
    res.status(200).json({ success: true, message: 'Inventory item successfully deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
