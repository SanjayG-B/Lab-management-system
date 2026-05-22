import mongoose from 'mongoose';

const AILogSchema = new mongoose.Schema({
  type: { type: String, enum: ['ocr', 'predictive_maintenance', 'inventory_forecast', 'attendance_trend'], required: true },
  inputData: mongoose.Schema.Types.Mixed,
  outputResult: mongoose.Schema.Types.Mixed,
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now }
});

const AILogModel = mongoose.models.AILog || mongoose.model('AILog', AILogSchema);
export { AILogModel as AILog };
