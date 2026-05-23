import { dbInstance } from '../config/db.js';

// Promisified SQL query helpers
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    dbInstance.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    dbInstance.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    dbInstance.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Deserialize SQLite rows to match JS/MongoDB models structure
const deserialize = (modelName, row) => {
  if (!row) return null;
  const record = { ...row };

  // Parse JSON columns back to arrays/objects
  if (modelName === 'Student' && record.assignedEquipment) {
    try {
      record.assignedEquipment = JSON.parse(record.assignedEquipment);
    } catch (e) {
      record.assignedEquipment = [];
    }
  }
  if (modelName === 'Experiment' && record.submissions) {
    try {
      record.submissions = JSON.parse(record.submissions);
    } catch (e) {
      record.submissions = [];
    }
  }
  if (modelName === 'AILog') {
    if (record.inputData) {
      try { record.inputData = JSON.parse(record.inputData); } catch (e) { record.inputData = null; }
    }
    if (record.outputResult) {
      try { record.outputResult = JSON.parse(record.outputResult); } catch (e) { record.outputResult = null; }
    }
  }

  // Convert booleans
  if (modelName === 'Notification') {
    record.isRead = !!record.isRead;
  }

  // Convert ISO Date strings to JavaScript Date objects
  for (const key in record) {
    if (typeof record[key] === 'string' && (key.endsWith('Date') || key.endsWith('At') || key === 'timestamp')) {
      record[key] = new Date(record[key]);
    }
  }

  return record;
};

// Serialize JS/MongoDB models structure into SQLite database formats
const serialize = (modelName, data) => {
  const record = { ...data };

  // Ensure unique primary key _id
  if (!record._id) {
    record._id = 'id_' + Math.random().toString(36).substring(2, 11);
  }

  // Set defaults for missing fields to satisfy NOT NULL constraints
  if (modelName === 'User') {
    if (!record.createdAt) record.createdAt = new Date().toISOString();
    if (!record.status) record.status = 'active';
  }
  if (modelName === 'Student') {
    if (record.attendancePercentage === undefined) record.attendancePercentage = 100;
    if (!record.assignedEquipment) record.assignedEquipment = [];
  }
  if (modelName === 'Equipment') {
    if (!record.status) record.status = 'available';
    if (!record.lastMaintenanceDate) record.lastMaintenanceDate = new Date().toISOString();
    if (record.usageHours === undefined) record.usageHours = 0;
  }
  if (modelName === 'Inventory') {
    if (record.quantity === undefined) record.quantity = 0;
    if (record.threshold === undefined) record.threshold = 5;
    if (!record.unit) record.unit = 'pcs';
    if (!record.lastRestocked) record.lastRestocked = new Date().toISOString();
  }
  if (modelName === 'Experiment') {
    if (!record.status) record.status = 'active';
    if (!record.submissions) record.submissions = [];
  }
  if (modelName === 'Attendance') {
    if (!record.date) record.date = new Date().toISOString();
  }
  if (modelName === 'Notification') {
    if (!record.recipientRole) record.recipientRole = 'all';
    if (record.isRead === undefined) record.isRead = 0;
    if (!record.createdAt) record.createdAt = new Date().toISOString();
  }
  if (modelName === 'Report') {
    if (!record.createdAt) record.createdAt = new Date().toISOString();
  }
  if (modelName === 'AILog') {
    if (!record.timestamp) record.timestamp = new Date().toISOString();
  }

  // Stringify JSON columns
  if (modelName === 'Student' && record.assignedEquipment) {
    record.assignedEquipment = JSON.stringify(record.assignedEquipment);
  }
  if (modelName === 'Experiment' && record.submissions) {
    record.submissions = JSON.stringify(record.submissions);
  }
  if (modelName === 'AILog') {
    if (record.inputData) record.inputData = JSON.stringify(record.inputData);
    if (record.outputResult) record.outputResult = JSON.stringify(record.outputResult);
  }

  // Convert booleans to integers
  if (modelName === 'Notification' && record.isRead !== undefined) {
    record.isRead = record.isRead ? 1 : 0;
  }

  // Convert Date objects to ISO strings
  for (const key in record) {
    if (record[key] instanceof Date) {
      record[key] = record[key].toISOString();
    }
  }

  return record;
};

export const dbService = {
  find: async (modelName, query = {}) => {
    const keys = Object.keys(query);
    let sql = `SELECT * FROM ${modelName}`;
    const params = [];
    
    if (keys.length > 0) {
      const conditions = keys.map(k => `${k} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      params.push(...keys.map(k => query[k]));
    }
    
    const rows = await allQuery(sql, params);
    return rows.map(row => deserialize(modelName, row));
  },

  findOne: async (modelName, query = {}) => {
    const keys = Object.keys(query);
    let sql = `SELECT * FROM ${modelName}`;
    const params = [];
    
    if (keys.length > 0) {
      const conditions = keys.map(k => `${k} = ?`).join(' AND ');
      sql += ` WHERE ${conditions}`;
      params.push(...keys.map(k => query[k]));
    }
    sql += ` LIMIT 1`;
    
    const row = await getQuery(sql, params);
    return deserialize(modelName, row);
  },

  findById: async (modelName, id) => {
    const row = await getQuery(`SELECT * FROM ${modelName} WHERE _id = ?`, [id]);
    return deserialize(modelName, row);
  },

  create: async (modelName, data) => {
    const serialized = serialize(modelName, data);
    const columns = Object.keys(serialized);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${modelName} (${columns.join(', ')}) VALUES (${placeholders})`;
    const params = columns.map(col => serialized[col]);
    
    await runQuery(sql, params);
    return deserialize(modelName, serialized);
  },

  findByIdAndUpdate: async (modelName, id, updateData) => {
    // Check if record exists
    const exists = await dbService.findById(modelName, id);
    if (!exists) return null;

    const serialized = { ...updateData };

    // Stringify JSON columns
    if (modelName === 'Student' && serialized.assignedEquipment) {
      serialized.assignedEquipment = JSON.stringify(serialized.assignedEquipment);
    }
    if (modelName === 'Experiment' && serialized.submissions) {
      serialized.submissions = JSON.stringify(serialized.submissions);
    }
    if (modelName === 'AILog') {
      if (serialized.inputData) serialized.inputData = JSON.stringify(serialized.inputData);
      if (serialized.outputResult) serialized.outputResult = JSON.stringify(serialized.outputResult);
    }

    // Convert booleans to integers
    if (modelName === 'Notification' && serialized.isRead !== undefined) {
      serialized.isRead = serialized.isRead ? 1 : 0;
    }

    // Convert Date objects to ISO strings
    for (const key in serialized) {
      if (serialized[key] instanceof Date) {
        serialized[key] = serialized[key].toISOString();
      }
    }

    const columns = Object.keys(serialized);
    if (columns.length > 0) {
      const setClause = columns.map(col => `${col} = ?`).join(', ');
      const sql = `UPDATE ${modelName} SET ${setClause} WHERE _id = ?`;
      const params = [...columns.map(col => serialized[col]), id];
      await runQuery(sql, params);
    }

    return await dbService.findById(modelName, id);
  },

  findByIdAndDelete: async (modelName, id) => {
    const record = await dbService.findById(modelName, id);
    if (!record) return null;
    
    await runQuery(`DELETE FROM ${modelName} WHERE _id = ?`, [id]);
    return record;
  }
};
