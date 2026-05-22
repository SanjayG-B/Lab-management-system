import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['inventory', 'attendance', 'maintenance', 'usage'], required: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: String,
  format: { type: String, enum: ['pdf', 'excel'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const ReportModel = mongoose.models.Report || mongoose.model('Report', ReportSchema);
export { ReportModel as Report };
