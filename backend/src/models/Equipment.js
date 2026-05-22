import mongoose from 'mongoose';

const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  serialNumber: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['available', 'issued', 'maintenance', 'damaged'], default: 'available' },
  lastMaintenanceDate: { type: Date, default: Date.now },
  nextMaintenanceDate: { type: Date },
  usageHours: { type: Number, default: 0 },
  qrCodeUrl: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const EquipmentModel = mongoose.models.Equipment || mongoose.model('Equipment', EquipmentSchema);
export { EquipmentModel as Equipment };
