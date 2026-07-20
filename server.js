import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const dbPath = path.resolve('database.json');

// Helper to read database
function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({ forms: [], responses: [] }));
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data || '{"forms":[],"responses":[]}');
  } catch (e) {
    return { forms: [], responses: [] };
  }
}

// Helper to write database
function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing to database:", e);
  }
}

// Get all forms
app.get('/api/forms', (req, res) => {
  const db = readDb();
  res.json(db.forms || []);
});

// Update or create a form
app.put('/api/forms/:id', (req, res) => {
  const { id } = req.params;
  const form = req.body;
  const db = readDb();
  
  if (!db.forms) db.forms = [];
  const idx = db.forms.findIndex(f => f.id === id);
  if (idx > -1) {
    db.forms[idx] = form;
  } else {
    db.forms.unshift(form);
  }
  writeDb(db);
  res.json({ success: true, form });
});

// Create a new form (clones, etc.)
app.post('/api/forms', (req, res) => {
  const form = req.body;
  const db = readDb();
  if (!db.forms) db.forms = [];
  db.forms.unshift(form);
  writeDb(db);
  res.json({ success: true, form });
});

// Delete a form
app.delete('/api/forms/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (db.forms) {
    db.forms = db.forms.filter(f => f.id !== id);
  }
  writeDb(db);
  res.json({ success: true });
});

// Get all responses
app.get('/api/responses', (req, res) => {
  const db = readDb();
  res.json(db.responses || []);
});

// Add a response
app.post('/api/responses', (req, res) => {
  const response = req.body;
  const db = readDb();
  if (!db.responses) db.responses = [];
  db.responses.unshift(response);
  writeDb(db);
  res.json({ success: true, response });
});

// Delete a response
app.delete('/api/responses/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (db.responses) {
    db.responses = db.responses.filter(s => s.id !== id && s.response_id !== id);
  }
  writeDb(db);
  res.json({ success: true });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Database backend server is running on http://localhost:5000`);
});
