import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = process.env.VERCEL || process.env.NOW_BUILDER;
const dbPath = isVercel 
  ? '/tmp/database.sqlite' 
  : path.resolve(__dirname, '../../database.sqlite');

export let dbInstance = null;

const runQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const connectDB = () => {
  return new Promise((resolve, reject) => {
    dbInstance = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error(`⚠️ SQLite Connection Failed: ${err.message}`);
        reject(err);
      } else {
        console.log(`🚀 SQLite Database Connected at: ${dbPath}`);
        global.isMockDB = false; // SQLite is real database, mock mode deactivated
        try {
          await createTables();
          await seedInitialData();
          resolve();
        } catch (error) {
          console.error(`⚠️ SQLite Initialization Failed: ${error.message}`);
          reject(error);
        }
      }
    });
  });
};

const createTables = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS User (
      _id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('hod', 'staff', 'student')) DEFAULT 'student',
      status TEXT CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
      resetPasswordToken TEXT,
      resetPasswordExpires TEXT,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS Student (
      _id TEXT PRIMARY KEY,
      user TEXT NOT NULL,
      rollNumber TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      semester INTEGER NOT NULL,
      phone TEXT,
      attendancePercentage REAL DEFAULT 100,
      assignedEquipment TEXT DEFAULT '[]'
    )`,
    `CREATE TABLE IF NOT EXISTS Equipment (
      _id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      serialNumber TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      status TEXT CHECK(status IN ('available', 'issued', 'maintenance', 'damaged')) DEFAULT 'available',
      lastMaintenanceDate TEXT NOT NULL,
      nextMaintenanceDate TEXT,
      usageHours INTEGER DEFAULT 0,
      qrCodeUrl TEXT,
      addedBy TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS Inventory (
      _id TEXT PRIMARY KEY,
      itemName TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      threshold INTEGER DEFAULT 5,
      unit TEXT DEFAULT 'pcs',
      costPerUnit REAL,
      supplier TEXT,
      lastRestocked TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS Experiment (
      _id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      department TEXT NOT NULL,
      manualUrl TEXT,
      status TEXT CHECK(status IN ('active', 'archived')) DEFAULT 'active',
      submissions TEXT DEFAULT '[]',
      createdBy TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS Attendance (
      _id TEXT PRIMARY KEY,
      student TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('present', 'absent', 'late')) NOT NULL,
      labSession TEXT NOT NULL,
      markedBy TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS Notification (
      _id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('maintenance', 'stock', 'attendance', 'general')) NOT NULL,
      recipientRole TEXT CHECK(recipientRole IN ('all', 'hod', 'staff', 'student')) DEFAULT 'all',
      isRead INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS Report (
      _id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT CHECK(type IN ('inventory', 'attendance', 'maintenance', 'usage')) NOT NULL,
      fileUrl TEXT,
      format TEXT CHECK(format IN ('pdf', 'excel')) NOT NULL,
      createdAt TEXT NOT NULL,
      generatedBy TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS AILog (
      _id TEXT PRIMARY KEY,
      type TEXT CHECK(type IN ('ocr', 'predictive_maintenance', 'inventory_forecast', 'attendance_trend')) NOT NULL,
      inputData TEXT,
      outputResult TEXT,
      timestamp TEXT NOT NULL,
      triggeredBy TEXT
    )`
  ];

  for (const sql of queries) {
    await runQuery(dbInstance, sql);
  }
};

const seedInitialData = async () => {
  // Check if users already seeded
  const userCheck = await getQuery(dbInstance, "SELECT COUNT(*) as count FROM User");
  if (userCheck.count > 0) {
    return; // Already seeded
  }

  console.log("ℹ️ Seeding default database records to SQLite...");

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const staffHash = await bcrypt.hash('staff123', salt);
  const studentHash = await bcrypt.hash('student123', salt);

  // Seed Users
  await runQuery(dbInstance, `INSERT INTO User (_id, name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    ['u1', 'Dr. Sarah Smith', 'admin@lab.edu', adminHash, 'hod', 'active', new Date().toISOString()]);
  await runQuery(dbInstance, `INSERT INTO User (_id, name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    ['u2', 'John Doe (Staff)', 'staff@lab.edu', staffHash, 'staff', 'active', new Date().toISOString()]);
  await runQuery(dbInstance, `INSERT INTO User (_id, name, email, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, 
    ['u3', 'Alex Johnson', 'student@lab.edu', studentHash, 'student', 'active', new Date().toISOString()]);

  // Seed Student details
  await runQuery(dbInstance, `INSERT INTO Student (_id, user, rollNumber, department, semester, phone, attendancePercentage, assignedEquipment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['s1', 'u3', 'CS2026001', 'CSE', 4, '555-0199', 88, '[]']);

  // Seed Equipment
  const equipment = [
    ['e1', 'Digital Oscilloscope', 'OSC-48920', 'EC', 'Lab Room 204, Shelf A', 'available', new Date('2026-02-15').toISOString(), new Date('2026-08-15').toISOString(), 124, ''],
    ['e2', 'Spectrophotometer', 'SPEC-77301', 'CE', 'Lab Room 102, Table 3', 'maintenance', new Date('2025-11-10').toISOString(), new Date('2026-05-10').toISOString(), 320, ''],
    ['e3', 'Function Generator', 'FG-99281', 'EC', 'Lab Room 204, Shelf B', 'available', new Date('2026-03-01').toISOString(), new Date('2026-09-01').toISOString(), 45, ''],
    ['e4', 'Centrifuge Model X', 'CEN-33291', 'AIML', 'Lab Room 301, Bench 1', 'damaged', new Date('2026-01-20').toISOString(), new Date('2026-07-20').toISOString(), 512, '']
  ];
  for (const e of equipment) {
    await runQuery(dbInstance, `INSERT INTO Equipment (_id, name, serialNumber, category, location, status, lastMaintenanceDate, nextMaintenanceDate, usageHours, qrCodeUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, e);
  }

  // Seed Inventory
  const inventory = [
    ['i1', 'Resistor Pack (10k Ohm)', 'EC', 150, 30, 'pcs', 0.10, 'DigiKey', new Date().toISOString()],
    ['i2', 'Hydrochloric Acid 1M', 'CE', 2, 5, 'Liters', 15.00, 'Sigma-Aldrich', new Date().toISOString()],
    ['i3', 'Petri Dishes', 'AIML', 4, 20, 'boxes', 12.50, 'Fisher Scientific', new Date().toISOString()],
    ['i4', 'Connecting Wires (M-M)', 'EC', 250, 50, 'pcs', 0.25, 'Adafruit', new Date().toISOString()]
  ];
  for (const item of inventory) {
    await runQuery(dbInstance, `INSERT INTO Inventory (_id, itemName, category, quantity, threshold, unit, costPerUnit, supplier, lastRestocked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, item);
  }

  // Seed Experiments
  const submissions = [
    { student: 's1', fileUrl: '/uploads/ohms_law_submission.pdf', ocrText: 'Lab record: V = IR. R = V/I. Readings: V=2V, I=0.2A, R=10 Ohm. V=4V, I=0.4A, R=10 Ohm. Conclusion verified.', grade: 'A', submittedAt: new Date().toISOString() }
  ];
  await runQuery(dbInstance, `INSERT INTO Experiment (_id, title, code, description, department, manualUrl, status, submissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['ex1', 'Verification of Ohm\'s Law', 'PHY-101', 'Study the relationship between voltage, current, and resistance in a simple DC circuit.', 'CSE', '/manuals/ohms_law.pdf', 'active', JSON.stringify(submissions)]);
  await runQuery(dbInstance, `INSERT INTO Experiment (_id, title, code, description, department, manualUrl, status, submissions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['ex2', 'Acid-Base Titration', 'CHM-102', 'Determine the concentration of an unknown hydrochloric acid solution using standard sodium hydroxide.', 'CE', '/manuals/titration.pdf', 'active', '[]']);

  // Seed Attendance
  await runQuery(dbInstance, `INSERT INTO Attendance (_id, student, date, status, labSession) VALUES (?, ?, ?, ?, ?)`, 
    ['a1', 's1', new Date('2026-05-18').toISOString(), 'present', 'Physics Lab A']);
  await runQuery(dbInstance, `INSERT INTO Attendance (_id, student, date, status, labSession) VALUES (?, ?, ?, ?, ?)`, 
    ['a2', 's1', new Date('2026-05-20').toISOString(), 'present', 'Chemistry Lab B']);

  // Seed Notifications
  const notifications = [
    ['n1', 'Low Stock Warning', 'Hydrochloric Acid 1M is below the warning threshold (2 Liters remaining).', 'stock', 'all', 0, new Date().toISOString()],
    ['n2', 'Low Stock Warning', 'Petri Dishes is below the warning threshold (4 boxes remaining).', 'stock', 'all', 0, new Date().toISOString()],
    ['n3', 'Maintenance Overdue', 'Spectrophotometer (SPEC-77301) requires calibration.', 'maintenance', 'hod', 0, new Date().toISOString()]
  ];
  for (const n of notifications) {
    await runQuery(dbInstance, `INSERT INTO Notification (_id, title, message, type, recipientRole, isRead, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`, n);
  }

  console.log("✅ Seed completed successfully.");
};
