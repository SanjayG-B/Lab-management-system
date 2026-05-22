import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true, index: true },
  status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  labSession: { type: String, required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const AttendanceModel = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export { AttendanceModel as Attendance };
