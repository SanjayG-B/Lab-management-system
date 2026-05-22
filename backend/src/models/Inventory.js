import mongoose from 'mongoose';

const InventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true, unique: true },
  category: String,
  quantity: { type: Number, required: true, default: 0 },
  threshold: { type: Number, required: true, default: 5 },
  unit: { type: String, default: 'pcs' },
  costPerUnit: Number,
  supplier: String,
  lastRestocked: { type: Date, default: Date.now }
});

const InventoryModel = mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
export { InventoryModel as Inventory };
