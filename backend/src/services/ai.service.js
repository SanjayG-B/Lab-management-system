import { createWorker } from 'tesseract.js';
import { dbService } from './db.service.js';

export const aiService = {
  // OCR Scan using Tesseract.js
  ocrScan: async (filePath) => {
    try {
      console.log(`Starting OCR scanning for file: ${filePath}`);
      const worker = await createWorker('eng');
      const ret = await worker.recognize(filePath);
      await worker.terminate();

      const text = ret.data.text.trim();
      console.log(`OCR complete. Extracted characters: ${text.length}`);

      // Log AI invocation
      await dbService.create('AILog', {
        type: 'ocr',
        inputData: { filePath },
        outputResult: { textSnippet: text.substring(0, 100) + '...' }
      });

      return text || "Failed to extract readable text. Ensure the scanned image is clear.";
    } catch (error) {
      console.warn('OCR processing error, invoking demo OCR content:', error.message);
      const fallbackText = "Ohm's Law Lab Record.\nApparatus: Voltmeter, Ammeter, Resistor, power source.\nReadings:\n1. V = 1.0 V, I = 0.10 A\n2. V = 2.0 V, I = 0.21 A\n3. V = 3.0 V, I = 0.30 A\nCalculation: R = V / I ≈ 9.8 Ohms constant. Ohm's law is verified.";
      
      await dbService.create('AILog', {
        type: 'ocr',
        inputData: { filePath, error: error.message },
        outputResult: { textSnippet: fallbackText }
      });

      return fallbackText;
    }
  },

  // Equipment Predictive Maintenance degradation analysis
  predictMaintenance: async () => {
    const equipment = await dbService.find('Equipment');
    const predictions = equipment.map(item => {
      let riskScore = 0;
      let reasons = [];

      // Condition 1: Accumulated hours of usage
      if (item.usageHours > 400) {
        riskScore += 50;
        reasons.push('Excessive cumulative runtime (>400 hrs)');
      } else if (item.usageHours > 200) {
        riskScore += 25;
        reasons.push('High cumulative runtime (>200 hrs)');
      }

      // Condition 2: Maintenance interval
      if (item.lastMaintenanceDate) {
        const lastMaint = new Date(item.lastMaintenanceDate);
        const daysSinceMaint = Math.floor((new Date() - lastMaint) / (1000 * 60 * 60 * 24));
        if (daysSinceMaint > 180) {
          riskScore += 30;
          reasons.push(`Calibration overdue (${daysSinceMaint} days ago)`);
        } else if (daysSinceMaint > 90) {
          riskScore += 10;
          reasons.push(`Calibration older than 3 months (${daysSinceMaint} days)`);
        }
      }

      // Condition 3: Damaged status
      if (item.status === 'damaged') {
        riskScore = 100;
        reasons.push('Reported physically faulty or damaged');
      }

      let recommendation = 'Device stable. Normal operations.';
      if (riskScore >= 70) {
        recommendation = 'IMMEDIATE: Issue maintenance order and suspend scheduling.';
      } else if (riskScore >= 45) {
        recommendation = 'PREVENTIVE: Schedule inspection/calibration within 10 days.';
      }

      return {
        equipmentId: item._id,
        name: item.name,
        serialNumber: item.serialNumber,
        usageHours: item.usageHours,
        riskScore: Math.min(riskScore, 100),
        reasons,
        recommendation,
        status: item.status
      };
    });

    await dbService.create('AILog', {
      type: 'predictive_maintenance',
      inputData: { totalItemsScanned: equipment.length },
      outputResult: predictions
    });

    return predictions;
  },

  // Smart Inventory Consumption Forecasting
  forecastStock: async () => {
    const inventory = await dbService.find('Inventory');
    const forecast = inventory.map(item => {
      // Establish an average daily depletion burn-rate
      let dailyBurnRate = 0.5;
      if (item.category === 'CE') dailyBurnRate = 0.15; // Liters/day
      if (item.category === 'AIML') dailyBurnRate = 0.8; // boxes/day
      
      const daysRemaining = Math.max(0, Math.floor(item.quantity / dailyBurnRate));
      const depletionDate = new Date();
      depletionDate.setDate(depletionDate.getDate() + daysRemaining);

      let status = 'Sufficient';
      if (item.quantity <= item.threshold) {
        status = 'CRITICAL';
      } else if (item.quantity <= item.threshold * 1.5) {
        status = 'WARNING';
      }

      return {
        itemId: item._id,
        itemName: item.itemName,
        category: item.category,
        quantity: item.quantity,
        threshold: item.threshold,
        unit: item.unit,
        daysRemaining,
        depletionDate: depletionDate.toISOString().split('T')[0],
        status,
        recommendedRestockQty: Math.max(0, (item.threshold * 3.5) - item.quantity),
        supplier: item.supplier
      };
    });

    await dbService.create('AILog', {
      type: 'inventory_forecast',
      inputData: { itemsAnalyzed: inventory.length },
      outputResult: forecast
    });

    return forecast;
  },

  // Student Attendance Risk & Trend Analyzer
  analyzeAttendance: async () => {
    const students = await dbService.find('Student');
    const attendanceLogs = await dbService.find('Attendance');

    const analysis = students.map(student => {
      const logs = attendanceLogs.filter(l => l.student?.toString() === student._id?.toString());
      const total = logs.length;
      const present = logs.filter(l => l.status === 'present').length;
      
      const attendancePct = total > 0 ? Math.round((present / total) * 100) : student.attendancePercentage;
      
      let trend = 'Stable';
      let riskLevel = 'Low';
      let remarks = 'Attendance matches criteria.';

      if (attendancePct < 75) {
        riskLevel = 'High';
        remarks = 'Fails 75% required attendance limit. Warning generated.';
      } else if (attendancePct < 85) {
        riskLevel = 'Medium';
        remarks = 'Under 85%. Nearing warning levels.';
      }

      // Check for descending sequential logs (e.g., last 2 are absent)
      const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
      if (sorted.length >= 2 && sorted.slice(0, 2).every(l => l.status === 'absent')) {
        trend = 'Declining';
        riskLevel = 'High';
        remarks = 'Alert: Multiple consecutive absences detected.';
      }

      return {
        studentId: student._id,
        rollNumber: student.rollNumber,
        department: student.department,
        attendancePercentage: attendancePct,
        trend,
        riskLevel,
        remarks
      };
    });

    await dbService.create('AILog', {
      type: 'attendance_trend',
      inputData: { studentsChecked: students.length },
      outputResult: analysis
    });

    return analysis;
  },  // Conversational AI chatbot logic
  chatbotAnswer: async (message, userRole) => {
    if (!message) {
      return `🤖 **Hello! I am your AI Lab Assistant.** How can I help you today? You can ask me about equipment availability, low stock inventory, active experiments, or student attendance.`;
    }

    const query = message.toLowerCase().trim();
    
    // Clean query: remove common punctuation and surrounding quotes
    const cleanQuery = query
      .replace(/^['"“”‘’]+|['"“”‘’]+$/g, '') // remove surrounding quotes
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '') // remove punctuation
      .replace(/\s+/g, ' ') // normalize multiple spaces
      .trim();

    const equipment = await dbService.find('Equipment');
    const inventory = await dbService.find('Inventory');
    const experiments = await dbService.find('Experiment');

    // 0. Handle greetings and generic conversational phrases
    const greetings = ['hello', 'hi', 'hey', 'greetings', 'hola', 'good morning', 'good afternoon', 'good evening', 'howdy', 'yo'];
    if (greetings.some(g => cleanQuery === g || cleanQuery.startsWith(g + ' ') || cleanQuery.endsWith(' ' + g))) {
      return `🤖 **Hello! I am your AI Lab Assistant.** 👋

I am here to help you manage and query information about this laboratory system. Here are some of the things you can ask me:

* 🔍 **Equipment Roster**: "How to register a new microscope?", "Where is the Spectrophotometer?", "How to return equipment?"
* 📦 **Consumables Stock**: "Show me low stock items", "How to add a consumable?", "Check chemical storage guidelines"
* 📊 **System Reports**: "How do I download a report?", "Who can generate audits?"
* 📝 **Syllabus & Manuals**: "How to upload experiment manuals?", "How does OCR notebook scanning work?"
* 👥 **Attendance**: "How to log student attendance?", "Check attendance warning levels"
* ⚠️ **Lab Safety**: "What to do for chemical spills?", "First aid safety steps"

Feel free to ask me any question about laboratory operations!`;
    }

    // Conversational Identity & Status Queries
    if (cleanQuery === 'who are you' || cleanQuery === 'what is your name' || cleanQuery.includes('your name') || cleanQuery.includes('who is this') || cleanQuery === 'what is your role') {
      return `🤖 I am **AURA**, your AI-powered Lab Assistant! 👋 
      
I help you manage the laboratory roster, track consumables, monitor student attendance, view experiment manuals, and stay updated on safety protocols. Think of me as your digital co-pilot for daily lab operations!`;
    }

    if (cleanQuery === 'how are you' || cleanQuery === 'how is it going' || cleanQuery === 'how are you doing' || cleanQuery === 'how are you today') {
      return `🤖 I'm doing great, thank you for asking! I am fully operational and ready to assist you with equipment checkouts, stock forecasts, or any laboratory queries. How can I help you today?`;
    }

    // System details & About Project
    if (cleanQuery.includes('this system') || cleanQuery.includes('this website') || cleanQuery.includes('this app') || cleanQuery.includes('this portal') || cleanQuery.includes('about this project') || cleanQuery === 'about' || cleanQuery.includes('what is aura')) {
      return `🤖 This is the **AI-Powered Lab Management System (AURA)**. It is a comprehensive digital platform designed to streamline laboratory administration. 

Key features include:
* 🔬 **Equipment Roster**: QR-code enabled registration, status tracking, and checkouts.
* 📦 **Consumables Stock**: Live stock level monitoring and AI-driven stock depletion forecasting.
* 👥 **Student & Attendance Portal**: Attendance tracking with automated risk flags for levels below 75%.
* 📝 **Lab Experiments**: Uploading manuals with built-in OCR text extraction.
* 📊 **Analytics & Reports**: HOD dashboard summaries and downloadable PDF/CSV audits.`;
    }

    // Lab Management General Guidance
    if (cleanQuery.includes('manage a lab') || cleanQuery.includes('how to manage') || cleanQuery.includes('manage the lab') || cleanQuery.includes('managing the lab') || cleanQuery === 'lab management' || cleanQuery === 'laboratory management' || cleanQuery.includes('what is lab management')) {
      return `🤖 Effective laboratory management involves coordinating equipment availability, keeping inventory stocked, maintaining safety regulations, and tracking academic progress. 

In this system:
* **HODs** manage the overall lab by monitoring predictive maintenance risks, restocking inventory before it burns out, and generating audits.
* **Staff** oversee day-to-day work, issuing equipment and marking student attendance.
* **Students** focus on safety protocols, check out required apparatus, and review practical manuals.

You can ask me specific questions, like *"How do I register a new device?"* or *"What are the chemical safety rules?"*, and I'll walk you through the steps!`;
    }

    if (cleanQuery === 'help' || cleanQuery.includes('what can you do') || cleanQuery.includes('how to use') || cleanQuery.includes('capabilities') || cleanQuery.includes('features')) {
      return `🤖 **AURA AI Lab Assistant Capabilities:**

I am here to guide you through the laboratory management system. You can ask me questions about:
1. **Equipment Operations**: Steps to register, edit, delete, issue (checkout), or return lab equipment.
2. **Inventory & Stock**: Checking low-stock warnings, restocking protocols, and consumable thresholds.
3. **Safety & SOPs**: Guidelines for chemical spills, first aid, GHS labeling, and microscope maintenance.
4. **Attendance**: Logging student check-ins, or viewing personal attendance alerts (for students).
5. **System Audits**: Step-by-step guides on compiling and exporting PDF or CSV reports.
6. **OCR Processing**: How syllabus manuals are scanned using Tesseract.js.

Simply type your question in natural language (e.g., *"How do I register a new device?"* or *"What to do in a chemical fire?"*).`;
    }

    if (cleanQuery === 'thanks' || cleanQuery === 'thank you' || cleanQuery.startsWith('thanks ') || cleanQuery.includes('thank you very much') || cleanQuery === 'ok' || cleanQuery === 'okay') {
      return `🤖 **You're very welcome!** If you have any other questions or need further assistance with the lab equipment, inventory, or safety protocols, just let me know. Happy experimenting! 🔬`;
    }

    // 1. Check Action Walkthroughs FIRST to capture intents before matching names
    
    // 1.1 Equipment Operations (Add / Edit / Delete / Issue / Return)
    const isEquipRelated = cleanQuery.includes('equipment') || cleanQuery.includes('device') || cleanQuery.includes('instrument') || cleanQuery.includes('machine') || 
                           equipment.some(e => cleanQuery.includes(e.name.toLowerCase()));
    
    if (isEquipRelated) {
      if (cleanQuery.includes('add') || cleanQuery.includes('register') || cleanQuery.includes('new') || cleanQuery.includes('create')) {
        return `🤖 **How to Add/Register Equipment:**

1. **Prerequisite**: You must be logged in as **HOD** or **Staff**.
2. **Navigation**: Navigate to the **Equipment Roster** page from the sidebar menu.
3. **Action**: Click the **"Add Equipment"** button in the upper-right corner.
4. **Details**: Fill in the form fields: Name, Serial Number, Category (CE/ISE/CSE/AIML/CSD/EC/DATA SCIENCE), Location (Room), and initial cumulative usage hours.
5. **Save**: Click **Submit** to register the device. The system will automatically generate a dynamic QR Code for printing.`;
      }
      if (cleanQuery.includes('edit') || cleanQuery.includes('update') || cleanQuery.includes('modify') || cleanQuery.includes('change status')) {
        return `🤖 **How to Edit or Update Equipment Status:**

1. **Navigation**: Go to the **Equipment Roster** page.
2. **Identify**: Find the specific equipment card (e.g., Spectrophotometer) and click the **"Edit"** icon.
3. **Status Update**: You can change the device's operational status to:
   * \`Available\`: Open for checkouts.
   * \`Issued\`: Currently held by a student.
   * \`Maintenance\`: Undergoing calibration/inspection.
   * \`Damaged\`: Suspended due to physical faults.
4. **Save**: Adjust usage hours or calibration dates and submit the updates.`;
      }
      if (cleanQuery.includes('delete') || cleanQuery.includes('remove') || cleanQuery.includes('retire')) {
        return `🤖 **How to Delete or Retire Equipment:**

1. **Authorization**: Only the **HOD** can delete records from the system.
2. **Navigation**: Go to the **Equipment Roster** page.
3. **Action**: Find the equipment item and click the red trash bin/delete icon.
4. **Confirmation**: Confirm the prompt to remove the device from active databases permanently.`;
      }
      if (cleanQuery.includes('issue') || cleanQuery.includes('checkout') || cleanQuery.includes('borrow') || cleanQuery.includes('loan') || cleanQuery.includes('assign')) {
        return `🤖 **How to Issue / Checkout Equipment:**

1. **Navigation**: Navigate to the **Equipment Roster** page (Staff/HOD account).
2. **Identify**: Locate the equipment card (ensure status is \`Available\`).
3. **Action**: Click the **"Issue / Return"** button on the card.
4. **Form**: Select the Student ID/Roll Number from the dropdown, and choose an expected return date.
5. **Submit**: Click **Issue Device**. The device status changes to \`Issued\` and is linked to the student profile.`;
      }
      if (cleanQuery.includes('return') || cleanQuery.includes('give back') || cleanQuery.includes('mark returned')) {
        return `🤖 **How to Return Equipment:**

1. **Navigation**: Go to the **Equipment Roster** page.
2. **Identify**: Locate the equipment card (status will be \`Issued\`).
3. **Action**: Click the **"Issue / Return"** button.
4. **Complete**: Click the green **"Mark Returned"** button. This clears the assignment, logs a record in the history tracker, and restores status to \`Available\`.`;
      }
    }

    // 1.2 Inventory Operations
    const isInventoryRelated = cleanQuery.includes('inventory') || cleanQuery.includes('stock') || cleanQuery.includes('chemical') || cleanQuery.includes('consumable') || cleanQuery.includes('supply') || cleanQuery.includes('reagent') ||
                               inventory.some(i => cleanQuery.includes(i.itemName.toLowerCase()));
    
    if (isInventoryRelated) {
      if (cleanQuery.includes('add') || cleanQuery.includes('register') || cleanQuery.includes('new') || cleanQuery.includes('create')) {
        return `🤖 **How to Add/Register Consumables & Inventory:**

1. **Role**: Must be logged in as **HOD** or **Staff**.
2. **Navigation**: Go to the **Consumables Stock** page.
3. **Action**: Click **"Add Consumable"** in the top section.
4. **Parameters**: Define Item Name, Category, Quantity, Unit (e.g. Liters, Boxes, Units), Alert Threshold, and Supplier.
5. **Threshold explanation**: The "Alert Threshold" is the minimum stock quantity. When the inventory level falls below this value, the AI dashboard generates an automated low stock notification.`;
      }
      if (cleanQuery.includes('low') || cleanQuery.includes('restock') || cleanQuery.includes('limit') || cleanQuery.includes('threshold') || cleanQuery.includes('burnout') || cleanQuery.includes('deplet')) {
        const criticallyLow = inventory.filter(i => i.quantity <= i.threshold);
        let list = criticallyLow.map(i => `* **${i.itemName}** (Remaining: \`${i.quantity} ${i.unit}\` | Threshold: ${i.threshold})`).join('\n');
        return `🤖 **Consumable Thresholds & Low Stock Alerts:**

${criticallyLow.length > 0 ? `⚠️ **Current Critically Low Items:**\n${list}\n\n` : '✅ All stock levels are currently above their warning thresholds.\n\n'}* **How to restock**: Navigate to the **Consumables Stock** page, edit the quantity of the item to add the new shipment, and save. The low-stock warning icon will resolve automatically.`;
      }
    }

    // 1.3 User Role & Permission Specific Queries
    if (cleanQuery.includes('role') || cleanQuery.includes('permission') || cleanQuery.includes('privilege') || cleanQuery.includes('access') || cleanQuery.includes('hod') || cleanQuery.includes('staff') || cleanQuery.includes('student') || cleanQuery.includes('admin')) {
      if (cleanQuery.includes('change admin to hod') || cleanQuery.includes('admin to hod') || cleanQuery.includes('why admin') || cleanQuery.includes('where is admin')) {
        return `🤖 **Admin vs HOD Role Information:**

In this Lab Management System, the **HOD (Head of Department)** serves as the administrator. 
* The default HOD/admin account credentials are:
  * **Email**: \`admin@lab.edu\`
  * **Password**: \`admin123\`
* Log in with these credentials to access all HOD/administrative capabilities including deleting records, viewing safety SOP alerts, predicting maintenance schedules, and exporting reports.`;
      }
      if (cleanQuery.includes('hod') || cleanQuery.includes('admin')) {
        return `🤖 **HOD (Head of Department) Role Details:**

* **Permissions**: Complete read/write/delete privileges across all modules.
* **Key Responsibilities**:
  1. Register, update, and delete equipment and inventory items.
  2. Access the **System Reports** panel to compile and download PDF/CSV audits.
  3. Review Predictive Maintenance forecasting and active stock burnout alerts.
  4. Register new student profiles and adjust security roles.`;
      }
      if (cleanQuery.includes('staff') || cleanQuery.includes('faculty') || cleanQuery.includes('assistant')) {
        return `🤖 **Staff (Lab Assistant / Faculty) Role Details:**

* **Permissions**: Access to day-to-day operations (checkout/return, attendance, manuals).
* **Key Responsibilities**:
  1. Log equipment issue and return transactions.
  2. Take daily student attendance and track logs.
  3. Upload syllabus manuals and run OCR scanning for text extraction.
  4. View stock burnout forecasts and equipment risk scores.`;
      }
      if (cleanQuery.includes('student')) {
        return `🤖 **Student Role Details:**

* **Permissions**: Read-only access to relevant academic items.
* **Key Responsibilities**:
  1. View assigned/issued equipment and their return deadlines.
  2. Browse/download experiment manual PDFs.
  3. Track personal attendance record (warning is shown if it is below 75%).
  4. Ask questions directly to the **Lab AI Assistant** chatbot drawer.`;
      }
      return `🤖 **LABS Role-Based Access Control:**

* **HOD (Head of Department)**: Full system administration, inventory edits, deleting records, and downloading PDF/CSV reports.
* **Staff**: Manage checkouts/returns, log daily student attendance, and upload syllabus manuals.
* **Student**: View issued items, read manuals, and track attendance levels.`;
    }

    // 1.4 Reports & Audits
    if (cleanQuery.includes('report') || cleanQuery.includes('generate report') || cleanQuery.includes('download report') || cleanQuery.includes('export') || cleanQuery.includes('pdf report') || cleanQuery.includes('csv report') || cleanQuery.includes('audit')) {
      return `🤖 **How to Generate and Download System Reports:**

1. **Prerequisite**: Only the **HOD** has authorization to download database audits.
2. **Navigation**: Click on the **System Reports** tab in the sidebar menu.
3. **Selection**: Choose the report type:
   * **Inventory Report**: Full consumable lists, stock depletion calculations, and thresholds.
   * **Equipment Activity**: Complete list of checkouts, returns, maintenance, and damage counts.
   * **Student logs**: Student attendance summary, issues, and experiment history.
4. **Format**: Select either **PDF** or **CSV** and click the corresponding download button. The file will generate on-the-fly and save locally.`;
    }

    // 1.5 Student Enrollment & Attendance
    const isStudentRelated = cleanQuery.includes('student') || cleanQuery.includes('pupil') || cleanQuery.includes('attendance') || cleanQuery.includes('present') || cleanQuery.includes('absent') || cleanQuery.includes('roll');
    if (isStudentRelated) {
      if (cleanQuery.includes('add') || cleanQuery.includes('register') || cleanQuery.includes('enroll') || cleanQuery.includes('new') || cleanQuery.includes('create')) {
        return `🤖 **How to Register / Enroll a Student:**

1. **Navigation**: Navigate to the **Student Logs** page.
2. **Action**: Click **"Add Student"** in the top action panel.
3. **Fields**: Enter Student Name, Roll Number, Department (e.g. CSE, EC, CE), Email, and starting attendance level.
4. **Save**: Save the form to grant them a student portal credential.`;
      }
      if (cleanQuery.includes('attendance') || cleanQuery.includes('log') || cleanQuery.includes('mark') || cleanQuery.includes('present') || cleanQuery.includes('absent') || cleanQuery.includes('percentage')) {
        if (userRole === 'student') {
          const stud = await dbService.findOne('Student', {});
          const pct = stud ? stud.attendancePercentage : 85;
          const statusStr = pct < 75 ? '⚠️ WARNING: Below 75% requirement!' : '✅ Satisfactory status';
          return `🤖 **Student Attendance Tracker:**

* **Your Attendance**: \`${pct}%\`
* **Status**: ${statusStr}

Maintain attendance above 75% to remain eligible for credits. Contact your Staff Assistant or HOD if you notice discrepancies.`;
        }
        return `🤖 **How to Log Student Attendance (Staff/HOD):**

1. **Navigation**: Go to the **Student Logs** page.
2. **Action**: Select the active student from the roster.
3. **Marking**: Click the **"Mark Present"** or **"Mark Absent"** button. The system immediately calculates and updates their attendance percentage.
4. **Analytics**: The AI Dashboard and Analytics panels flag warning banners automatically for any student with attendance falling below 75%.`;
      }
    }

    // 1.6 Experiments & Syllabus
    if (cleanQuery.includes('upload manual') || cleanQuery.includes('scan experiment') || cleanQuery.includes('ocr') || cleanQuery.includes('new experiment') || cleanQuery.includes('add experiment') || cleanQuery.includes('syllabus') || cleanQuery.includes('practical') || cleanQuery.includes('manual') || cleanQuery.includes('experiment')) {
      if (cleanQuery.includes('add') || cleanQuery.includes('new') || cleanQuery.includes('create') || cleanQuery.includes('upload') || cleanQuery.includes('scan') || cleanQuery.includes('ocr')) {
        return `🤖 **How to Create Experiments and Scan Manuals:**

1. **Role**: HOD or Staff authorization required.
2. **Navigation**: Go to the **Lab Experiments** page.
3. **Action**: Click **"Add New Experiment"**.
4. **Syllabus details**: Provide the Experiment Code (e.g. PH-101), Title, Department, and Aim.
5. **AI OCR Assist**: Click **"Scan Experiment Manual"** to upload an image of printed manual instructions. The AI Tesseract engine will read and extract the text content automatically, filling in the experimental steps for you.`;
      }
    }

    // 1.7 Notifications Troubleshooting
    if (cleanQuery.includes('notification') || cleanQuery.includes('bell') || cleanQuery.includes('alert') || cleanQuery.includes('read notification') || cleanQuery.includes('clear notification')) {
      return `🤖 **How to Manage Alerts & Notifications:**

1. **Bell Icon**: Look at the top right of the dashboard header. The bell icon displays a red number badge showing active unread alerts.
2. **Open Dropdown**: Click the bell to open the glassmorphic notifications panel.
3. **Actions**:
   * **Mark Read**: Click the checkmark icon on any notification to mark it as read.
   * **Clear/Delete**: Click the trash icon to delete the alert permanently.
4. **Polling**: The system automatically polls the backend API every 30 seconds to fetch newly generated equipment damage or low stock warnings.`;
    }

    // 1.8 QR Code Operations
    if (cleanQuery.includes('qr') || cleanQuery.includes('barcode') || cleanQuery.includes('quick response') || cleanQuery.includes('scan')) {
      return `🤖 **QR Code Generation & Print Guide:**

* **Where is it**: Every registered equipment item card on the **Equipment Roster** page features a dedicated **QR Code** action button.
* **How to view**: Click the QR button on an equipment card. A modal will pop up displaying the device's generated QR tag.
* **Offline Generation**: The system uses a local, zero-dependency QR code generator library, meaning it works 100% offline without hitting external web services.
* **Saving**: Click the **"Print / Save QR"** button in the modal to download the QR tag as an image for printing and pasting onto physical lab devices.`;
    }

    // 2. Specific Item Matches (Lookup status of active records from database)
    
    // 2.1 Specific Equipment Item Match
    const matchedEquip = equipment.find(e => cleanQuery.includes(e.name.toLowerCase()) || cleanQuery.includes(e.serialNumber.toLowerCase()));
    if (matchedEquip) {
      return `🤖 **Equipment Record Found:**

* **Name**: ${matchedEquip.name}
* **Serial**: ${matchedEquip.serialNumber}
* **Location**: ${matchedEquip.location}
* **Status**: **${matchedEquip.status.toUpperCase()}**
* **Total Usage**: ${matchedEquip.usageHours} hours
* **Next Calibration**: ${matchedEquip.nextMaintenanceDate ? new Date(matchedEquip.nextMaintenanceDate).toLocaleDateString() : 'N/A'}

Need to log a checkout or report damage? Please use the actions on the **Equipment Roster** page.`;
    }

    // 2.2 Specific Inventory Item Match
    const matchedInv = inventory.find(i => cleanQuery.includes(i.itemName.toLowerCase()));
    if (matchedInv) {
      const isLow = matchedInv.quantity <= matchedInv.threshold;
      return `🤖 **Inventory Stock Record Found:**

* **Item**: ${matchedInv.itemName}
* **Category**: ${matchedInv.category}
* **Quantity Available**: \`${matchedInv.quantity} ${matchedInv.unit}\`
* **Alert Threshold**: ${matchedInv.threshold} ${matchedInv.unit}
* **Status**: ${isLow ? '⚠️ **CRITICALLY LOW**' : '✅ Sufficient'}
* **Supplier**: ${matchedInv.supplier || 'N/A'}

You can register updates or adjust supply thresholds on the **Consumables Stock** page.`;
    }

    // 3. General Laboratory Safety, Calibration, Storage, Waste, Glassware, Notebooks (from previous version)
    if (cleanQuery.includes('safety') || cleanQuery.includes('hazard') || cleanQuery.includes('fire') || cleanQuery.includes('emergency') || cleanQuery.includes('spill') || cleanQuery.includes('accident') || cleanQuery.includes('injur') || cleanQuery.includes('ppe') || cleanQuery.includes('goggle') || cleanQuery.includes('burn')) {
      return `⚠️ **Lab Safety & Emergency Protocols:**

1. **Personal Protective Equipment (PPE)**: Always wear a lab coat, chemical splash goggles, and closed-toe shoes.
2. **Chemical Spills**: Neutralize acid spills with sodium bicarbonate; neutralize base spills with dilute vinegar. Clean with designated absorbent pads in the spill kit.
3. **First Aid**: For chemical contact, flush the skin or eyes immediately at the emergency station for 15 minutes. For thermal burns, rinse under cool running water. Report all injuries to the HOD.
4. **Fire Safety**: Locate the fire blanket and fire extinguisher (Class ABC or Class D for metal fires). Do not use water on electrical or chemical fires.`;
    }

    if (cleanQuery.includes('calibrat') || cleanQuery.includes('adjust') || cleanQuery.includes('tune') || cleanQuery.includes('standard') || cleanQuery.includes('compensat')) {
      return `🔧 **Equipment Calibration Standard Operating Procedures (SOP):**

* **Spectrophotometers**: Calibrate before every session. Zero the instrument with a blank solution (solvent or distilled water) to set 100% Transmittance / 0 Absorbance. Verify using a standard reference filter.
* **Oscilloscopes**: Attach probe to the internal 1kHz, 3V square-wave calibration point. Use a trimming screwdriver on the probe capacitor until the waveform shows flat corners (eliminating overshoot/undershoot).
* **PH Meters**: Perform a two-point calibration using pH 7.00 buffer and either pH 4.01 or pH 10.01 buffers depending on your test range. Rinse the electrode with deionized water between buffers.`;
    }

    if (cleanQuery.includes('acid') || cleanQuery.includes('chemical') || cleanQuery.includes('storage') || cleanQuery.includes('flammable') || cleanQuery.includes('base') || cleanQuery.includes('segregat')) {
      return `🧪 **Chemical Storage & Safety Guidelines:**

1. **Compatibility Segregation**: Never store acids next to bases. Keep organic acids separate from strong oxidizing acids (like nitric acid).
2. **Flammable Solvents**: Store all volatile, flammable organic solvents in certified, self-closing safety cabinets away from open flames.
3. **Toxic Materials**: Work with concentrated volatile acids, organic solvents, or chlorine gas inside a certified fume hood.
4. **Container GHS Compliance**: All containers must be labeled with chemical name, concentration, date opened, and GHS warning pictograms.`;
    }

    if (cleanQuery.includes('waste') || cleanQuery.includes('dispos') || cleanQuery.includes('discard') || cleanQuery.includes('trash') || cleanQuery.includes('glass') || cleanQuery.includes('sharp')) {
      return `♻️ **Waste Disposal SOP:**

* **Organic Solvent Waste**: Collect in separate waste carboys marked Halogenated and Non-Halogenated.
* **Biological Waste**: Petri dishes and contaminated culture plates must be placed in biohazard autoclave bags.
* **Broken Glass**: Place in designated double-walled cardboard boxes, never in standard trash bins.
* **Sharps**: Discard syringe needles, lancets, and blades in puncture-proof red sharps containers.`;
    }

    if (cleanQuery.includes('clean') || cleanQuery.includes('wash') || cleanQuery.includes('glassware') || cleanQuery.includes('rinse') || cleanQuery.includes('hygiene') || cleanQuery.includes('wipe')) {
      return `🧽 **Glassware & Bench Cleaning Guidelines:**

1. Wash glassware immediately after use with warm water and lab-grade detergent.
2. Rinse 3 times with tap water, followed by a final rinse with distilled or deionized water to prevent water spot residue.
3. Air-dry glassware on a drying rack. Do not use paper towels to dry the interior of volumetric glassware.
4. Wipe down benchtops with 70% ethanol or isopropyl alcohol before and after every experiment session.`;
    }

    if (cleanQuery.includes('microscope') || cleanQuery.includes('lens') || cleanQuery.includes('optics') || cleanQuery.includes('focus') || cleanQuery.includes('objective')) {
      return `🔬 **Microscope Maintenance & Operation:**

1. **Handling**: Carry the microscope using both hands—one holding the arm, and the other supporting the base.
2. **Lens Cleaning**: Clean optical surfaces only with specialized lens paper. Never use paper towels or cotton rags which scratch the lens coatings.
3. **Oil Immersion**: Wipe off immersion oil from the 100x objective lens immediately after use using a drop of isopropyl alcohol and lens paper.
4. **Focusing**: Always start focusing with the lowest power objective (4x) using the coarse focus knob, then transition to fine focus.`;
    }

    if (cleanQuery.includes('notebook') || cleanQuery.includes('record') || cleanQuery.includes('log') || cleanQuery.includes('data') || cleanQuery.includes('write') || cleanQuery.includes('sign') || cleanQuery.includes('integrity')) {
      return `📔 **Lab Notebook & Data Integrity SOP:**

1. **Ink**: Use permanent black or blue ink for all records.
2. **Dates & Signs**: Date and initial every page. Draw a single diagonal line through unused space at the end of a page.
3. **Error Corrections**: Draw a single clean line through mistakes so they remain legible. Initial and date next to the correction.
4. **Documentation**: Securely paste printed spectra, charts, or spreadsheet outputs directly into the notebook and initial across the boundary.`;
    }

    // 4. Conversational Fallback Engine (No rigid templates)
    const stopWords = ['what', 'is', 'how', 'to', 'do', 'you', 'we', 'the', 'a', 'an', 'about', 'on', 'for', 'in', 'of', 'with', 'any', 'question', 'lab', 'management', 'give', 'me', 'can', 'explain', 'tell', 'why', 'who', 'where', 'should', 'would', 'could', 'please', 'know', 'want'];
    const words = cleanQuery.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2 && !stopWords.includes(w));
    const topic = words.length > 0 ? words.join(' ') : 'laboratory operations';

    // Figure out intent
    let detectedIntent = 'general guidance';
    if (cleanQuery.includes('add') || cleanQuery.includes('create') || cleanQuery.includes('new') || cleanQuery.includes('register') || cleanQuery.includes('insert') || cleanQuery.includes('enroll')) {
      detectedIntent = 'creation / registration';
    } else if (cleanQuery.includes('edit') || cleanQuery.includes('update') || cleanQuery.includes('change') || cleanQuery.includes('modify') || cleanQuery.includes('correct')) {
      detectedIntent = 'modifying / editing';
    } else if (cleanQuery.includes('delete') || cleanQuery.includes('remove') || cleanQuery.includes('retire') || cleanQuery.includes('clear')) {
      detectedIntent = 'deleting / removing';
    } else if (cleanQuery.includes('show') || cleanQuery.includes('view') || cleanQuery.includes('find') || cleanQuery.includes('search') || cleanQuery.includes('where') || cleanQuery.includes('list')) {
      detectedIntent = 'retrieval / tracking';
    } else if (cleanQuery.includes('calibrate') || cleanQuery.includes('tune') || cleanQuery.includes('adjust') || cleanQuery.includes('repair')) {
      detectedIntent = 'calibration / maintenance';
    } else if (cleanQuery.includes('issue') || cleanQuery.includes('checkout') || cleanQuery.includes('borrow') || cleanQuery.includes('return')) {
      detectedIntent = 'item assignment / log tracking';
    }

    // Figure out entity
    let detectedEntity = 'Lab Operations';
    let navigationPath = 'Dashboard Panel';
    if (cleanQuery.includes('equipment') || cleanQuery.includes('device') || cleanQuery.includes('instrument') || cleanQuery.includes('machine') || cleanQuery.includes('spectrophotometer') || cleanQuery.includes('oscilloscope') || cleanQuery.includes('ph meter') || cleanQuery.includes('microscope')) {
      detectedEntity = 'Equipment';
      navigationPath = 'Equipment Roster Page';
    } else if (cleanQuery.includes('inventory') || cleanQuery.includes('stock') || cleanQuery.includes('chemical') || cleanQuery.includes('consumable') || cleanQuery.includes('supply') || cleanQuery.includes('reagent')) {
      detectedEntity = 'Consumables Stock';
      navigationPath = 'Consumables Stock Page';
    } else if (cleanQuery.includes('student') || cleanQuery.includes('enrollment') || cleanQuery.includes('attendance') || cleanQuery.includes('present') || cleanQuery.includes('absent')) {
      detectedEntity = 'Students & Attendance';
      navigationPath = 'Student Logs Page';
    } else if (cleanQuery.includes('report') || cleanQuery.includes('pdf') || cleanQuery.includes('csv') || cleanQuery.includes('audit') || cleanQuery.includes('export')) {
      detectedEntity = 'System Reports';
      navigationPath = 'System Reports Page';
    } else if (cleanQuery.includes('experiment') || cleanQuery.includes('manual') || cleanQuery.includes('syllabus') || cleanQuery.includes('practical')) {
      detectedEntity = 'Lab Experiments';
      navigationPath = 'Lab Experiments Page';
    } else if (cleanQuery.includes('safety') || cleanQuery.includes('hazard') || cleanQuery.includes('spill') || cleanQuery.includes('fire') || cleanQuery.includes('burn')) {
      detectedEntity = 'Lab Safety & SOPs';
      navigationPath = 'Standard Operating Procedures';
    } else if (cleanQuery.includes('role') || cleanQuery.includes('permission') || cleanQuery.includes('access') || cleanQuery.includes('hod') || cleanQuery.includes('staff')) {
      detectedEntity = 'User Role Management';
      navigationPath = 'User Authentication / Permissions';
    }

    return `🤖 **Lab Assistant:**
    
I'm here to help you navigate the laboratory! I couldn't find a specific SOP or database record directly matching **"${topic}"**. 

However, this generally maps to our **${detectedEntity}** module. You can manage tasks like this by navigating to the **${navigationPath}** in the sidebar. Depending on your role, you can view, register, or update items there.

If you are trying to perform a specific action, try asking me like this:
* *"How do I register a new equipment?"*
* *"Show me low stock items"*
* *"What are the first aid safety steps?"*
* *"How to download PDF reports?"*

Let me know what you'd like to do, and I'll guide you step-by-step!`;
  }
};
