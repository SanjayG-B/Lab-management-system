import mongoose from 'mongoose';

const SubmissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  fileUrl: String,
  ocrText: String,
  grade: String,
  submittedAt: { type: Date, default: Date.now }
});

const ExperimentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  department: { type: String, required: true },
  manualUrl: String,
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submissions: [SubmissionSchema]
});

const ExperimentModel = mongoose.models.Experiment || mongoose.model('Experiment', ExperimentSchema);
export { ExperimentModel as Experiment };
