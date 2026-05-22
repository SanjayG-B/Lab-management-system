import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { Equipment } from '../models/Equipment.js';
import { Inventory } from '../models/Inventory.js';
import { Experiment } from '../models/Experiment.js';
import { Attendance } from '../models/Attendance.js';
import { Report } from '../models/Report.js';
import { Notification } from '../models/Notification.js';
import { AILog } from '../models/AILog.js';
import bcrypt from 'bcryptjs';

const models = {
  User,
  Student,
  Equipment,
  Inventory,
  Experiment,
  Attendance,
  Report,
  Notification,
  AILog
};

const mockDb = {
  User: [],
  Student: [],
  Equipment: [],
  Inventory: [],
  Experiment: [],
  Attendance: [],
  Report: [],
  Notification: [],
  AILog: []
};

let seeded = false;

export const seedMockData = async () => {
  if (seeded) return;
  seeded = true;

  // Hash password for mocks
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const staffHash = await bcrypt.hash('staff123', salt);
  const studentHash = await bcrypt.hash('student123', salt);

  mockDb.User = [
    { _id: 'u1', name: 'Dr. Sarah Smith', email: 'admin@lab.edu', password: adminHash, role: 'hod', status: 'active', createdAt: new Date() },
    { _id: 'u2', name: 'John Doe (Staff)', email: 'staff@lab.edu', password: staffHash, role: 'staff', status: 'active', createdAt: new Date() },
    { _id: 'u3', name: 'Alex Johnson', email: 'student@lab.edu', password: studentHash, role: 'student', status: 'active', createdAt: new Date() }
  ];

  mockDb.Student = [
    { _id: 's1', user: 'u3', rollNumber: 'CS2026001', department: 'CSE', semester: 4, phone: '555-0199', attendancePercentage: 88, assignedEquipment: [] }
  ];

  mockDb.Equipment = [
    { _id: 'e1', name: 'Digital Oscilloscope', serialNumber: 'OSC-48920', category: 'EC', location: 'Lab Room 204, Shelf A', status: 'available', lastMaintenanceDate: new Date('2026-02-15'), nextMaintenanceDate: new Date('2026-08-15'), usageHours: 124, qrCodeUrl: '' },
    { _id: 'e2', name: 'Spectrophotometer', serialNumber: 'SPEC-77301', category: 'CE', location: 'Lab Room 102, Table 3', status: 'maintenance', lastMaintenanceDate: new Date('2025-11-10'), nextMaintenanceDate: new Date('2026-05-10'), usageHours: 320, qrCodeUrl: '' },
    { _id: 'e3', name: 'Function Generator', serialNumber: 'FG-99281', category: 'EC', location: 'Lab Room 204, Shelf B', status: 'available', lastMaintenanceDate: new Date('2026-03-01'), nextMaintenanceDate: new Date('2026-09-01'), usageHours: 45, qrCodeUrl: '' },
    { _id: 'e4', name: 'Centrifuge Model X', serialNumber: 'CEN-33291', category: 'AIML', location: 'Lab Room 301, Bench 1', status: 'damaged', lastMaintenanceDate: new Date('2026-01-20'), nextMaintenanceDate: new Date('2026-07-20'), usageHours: 512, qrCodeUrl: '' }
  ];

  mockDb.Inventory = [
    { _id: 'i1', itemName: 'Resistor Pack (10k Ohm)', category: 'EC', quantity: 150, threshold: 30, unit: 'pcs', costPerUnit: 0.10, supplier: 'DigiKey', lastRestocked: new Date() },
    { _id: 'i2', itemName: 'Hydrochloric Acid 1M', category: 'CE', quantity: 2, threshold: 5, unit: 'Liters', costPerUnit: 15.00, supplier: 'Sigma-Aldrich', lastRestocked: new Date() },
    { _id: 'i3', itemName: 'Petri Dishes', category: 'AIML', quantity: 4, threshold: 20, unit: 'boxes', costPerUnit: 12.50, supplier: 'Fisher Scientific', lastRestocked: new Date() },
    { _id: 'i4', itemName: 'Connecting Wires (M-M)', category: 'EC', quantity: 250, threshold: 50, unit: 'pcs', costPerUnit: 0.25, supplier: 'Adafruit', lastRestocked: new Date() }
  ];

  mockDb.Experiment = [
    {
      _id: 'ex1',
      title: 'Verification of Ohm\'s Law',
      code: 'PHY-101',
      description: 'Study the relationship between voltage, current, and resistance in a simple DC circuit.',
      department: 'CSE',
      manualUrl: '/manuals/ohms_law.pdf',
      status: 'active',
      submissions: [
        { student: 's1', fileUrl: '/uploads/ohms_law_submission.pdf', ocrText: 'Lab record: V = IR. R = V/I. Readings: V=2V, I=0.2A, R=10 Ohm. V=4V, I=0.4A, R=10 Ohm. Conclusion verified.', grade: 'A', submittedAt: new Date() }
      ]
    },
    {
      _id: 'ex2',
      title: 'Acid-Base Titration',
      code: 'CHM-102',
      description: 'Determine the concentration of an unknown hydrochloric acid solution using standard sodium hydroxide.',
      department: 'CE',
      manualUrl: '/manuals/titration.pdf',
      status: 'active',
      submissions: []
    }
  ];

  mockDb.Attendance = [
    { _id: 'a1', student: 's1', date: new Date('2026-05-18'), status: 'present', labSession: 'Physics Lab A' },
    { _id: 'a2', student: 's1', date: new Date('2026-05-20'), status: 'present', labSession: 'Chemistry Lab B' }
  ];

  mockDb.Notification = [
    { _id: 'n1', title: 'Low Stock Warning', message: 'Hydrochloric Acid 1M is below the warning threshold (2 Liters remaining).', type: 'stock', recipientRole: 'all', isRead: false, createdAt: new Date() },
    { _id: 'n2', title: 'Low Stock Warning', message: 'Petri Dishes is below the warning threshold (4 boxes remaining).', type: 'stock', recipientRole: 'all', isRead: false, createdAt: new Date() },
    { _id: 'n3', title: 'Maintenance Overdue', message: 'Spectrophotometer (SPEC-77301) requires calibration.', type: 'maintenance', recipientRole: 'hod', isRead: false, createdAt: new Date() }
  ];
};

export const dbService = {
  find: async (modelName, query = {}) => {
    if (!global.isMockDB) {
      return await models[modelName].find(query);
    }
    await seedMockData();
    let records = [...mockDb[modelName]];
    return records.filter(item => {
      for (let key in query) {
        if (query[key] !== undefined) {
          const itemVal = item[key]?.toString();
          const queryVal = query[key]?.toString();
          if (itemVal !== queryVal) return false;
        }
      }
      return true;
    });
  },

  findOne: async (modelName, query = {}) => {
    if (!global.isMockDB) {
      return await models[modelName].findOne(query);
    }
    await seedMockData();
    const records = mockDb[modelName];
    return records.find(item => {
      for (let key in query) {
        if (query[key] !== undefined) {
          const itemVal = item[key]?.toString();
          const queryVal = query[key]?.toString();
          if (itemVal !== queryVal) return false;
        }
      }
      return true;
    }) || null;
  },

  findById: async (modelName, id) => {
    if (!global.isMockDB) {
      return await models[modelName].findById(id);
    }
    await seedMockData();
    return mockDb[modelName].find(item => item._id?.toString() === id?.toString()) || null;
  },

  create: async (modelName, data) => {
    if (!global.isMockDB) {
      return await models[modelName].create(data);
    }
    await seedMockData();
    const newRecord = {
      _id: Math.random().toString(36).substring(2, 9),
      ...data,
      createdAt: new Date()
    };
    mockDb[modelName].push(newRecord);
    return newRecord;
  },

  findByIdAndUpdate: async (modelName, id, updateData) => {
    if (!global.isMockDB) {
      return await models[modelName].findByIdAndUpdate(id, updateData, { new: true });
    }
    await seedMockData();
    const idx = mockDb[modelName].findIndex(item => item._id?.toString() === id?.toString());
    if (idx === -1) return null;
    mockDb[modelName][idx] = {
      ...mockDb[modelName][idx],
      ...updateData
    };
    return mockDb[modelName][idx];
  },

  findByIdAndDelete: async (modelName, id) => {
    if (!global.isMockDB) {
      return await models[modelName].findByIdAndDelete(id);
    }
    await seedMockData();
    const idx = mockDb[modelName].findIndex(item => item._id?.toString() === id?.toString());
    if (idx === -1) return null;
    const deleted = mockDb[modelName].splice(idx, 1);
    return deleted[0];
  }
};
