import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true, index: true },
  semester: { type: Number, required: true },
  phone: String,
  attendancePercentage: { type: Number, default: 100 },
  assignedEquipment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipment' }]
});

const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema);
export { StudentModel as Student };
