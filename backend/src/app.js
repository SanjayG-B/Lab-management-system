import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

// Router Registries
import authRoutes from './routes/auth.routes.js';
import equipmentRoutes from './routes/equipment.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import studentRoutes from './routes/student.routes.js';
import experimentRoutes from './routes/experiment.routes.js';
import aiRoutes from './routes/ai.routes.js';
import reportRoutes from './routes/report.routes.js';
import notificationRoutes from './routes/notification.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database connection (gracefully supports in-memory mocks if MongoDB isn't running)
connectDB();

// Resolve paths for static assets in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve files uploaded by users
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../reports')));

// Bind routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/experiments', experimentRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'AI Lab Management API is running.',
    mode: global.isMockDB ? 'Demo Mode (In-Memory Database Fallback)' : 'Production Mode (MongoDB Connection Active)'
  });
});

// Fallback error catcher
app.use((err, req, res, next) => {
  console.error('\x1b[31m%s\x1b[0m', `🔥 Server Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on port: ${PORT}`);
  console.log(`💡 Demo Credentials:\n   - HOD: admin@lab.edu (pass: admin123)\n   - Staff: staff@lab.edu (pass: staff123)\n   - Student: student@lab.edu (pass: student123)`);
});
