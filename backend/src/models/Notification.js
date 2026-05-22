import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['maintenance', 'stock', 'attendance', 'general'], required: true },
  recipientRole: { type: String, enum: ['all', 'hod', 'staff', 'student'], default: 'all' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export { NotificationModel as Notification };
