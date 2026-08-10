import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mmip_form'
};

let pool;

// Initialize database, tables, and migrate data if needed
async function initDb() {
  try {
    // First, connect without database to ensure it exists
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await tempConnection.end();

    // Create the pool with the target database
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(`Connected to MySQL database: ${dbConfig.database}`);

    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(255) PRIMARY KEY,
        data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id VARCHAR(255) PRIMARY KEY,
        response_id VARCHAR(255),
        data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_response_id (response_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrate from database.json if exists and tables are empty
    const [formsCount] = await pool.query('SELECT COUNT(*) as count FROM forms');
    const [responsesCount] = await pool.query('SELECT COUNT(*) as count FROM responses');

    if (formsCount[0].count === 0 && responsesCount[0].count === 0) {
      const dbPath = path.resolve('database.json');
      if (fs.existsSync(dbPath)) {
        console.log('Found database.json with empty MySQL tables. Initiating migration...');
        try {
          const rawData = fs.readFileSync(dbPath, 'utf8');
          const dbData = JSON.parse(rawData || '{"forms":[],"responses":[]}');
          
          if (Array.isArray(dbData.forms) && dbData.forms.length > 0) {
            console.log(`Migrating ${dbData.forms.length} forms...`);
            for (const form of dbData.forms) {
              if (form && form.id) {
                await pool.query(
                  'INSERT INTO forms (id, data) VALUES (?, ?)',
                  [form.id, JSON.stringify(form)]
                );
              }
            }
          }

          if (Array.isArray(dbData.responses) && dbData.responses.length > 0) {
            console.log(`Migrating ${dbData.responses.length} responses...`);
            for (const resp of dbData.responses) {
              if (resp && resp.id) {
                await pool.query(
                  'INSERT INTO responses (id, response_id, data) VALUES (?, ?, ?)',
                  [resp.id, resp.response_id || null, JSON.stringify(resp)]
                );
              }
            }
          }
          console.log('Migration completed successfully!');
        } catch (migrationErr) {
          console.error('Error migrating data from database.json:', migrationErr);
        }
      }
    }
  } catch (err) {
    console.error('Database initialization error:', err);
    process.exit(1);
  }
}

// Get all forms
app.get('/api/forms', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM forms ORDER BY updated_at DESC');
    const forms = rows.map(row => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
    res.json(forms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update or create a form
app.put('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  const form = req.body;
  try {
    await pool.query(
      'INSERT INTO forms (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [id, JSON.stringify(form)]
    );
    res.json({ success: true, form });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new form
app.post('/api/forms', async (req, res) => {
  const form = req.body;
  const id = form.id;
  try {
    await pool.query(
      'INSERT INTO forms (id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)',
      [id, JSON.stringify(form)]
    );
    res.json({ success: true, form });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a form
app.delete('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM forms WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all responses
app.get('/api/responses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT data FROM responses ORDER BY updated_at DESC');
    const responses = rows.map(row => typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
    res.json(responses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a response
app.post('/api/responses', async (req, res) => {
  const response = req.body;
  const id = response.id;
  const response_id = response.response_id || null;
  try {
    await pool.query(
      'INSERT INTO responses (id, response_id, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE response_id = VALUES(response_id), data = VALUES(data)',
      [id, response_id, JSON.stringify(response)]
    );
    res.json({ success: true, response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete a response
app.delete('/api/responses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM responses WHERE id = ? OR response_id = ?', [id, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update or create a response (upsert)
app.put('/api/responses/:id', async (req, res) => {
  const { id } = req.params;
  const response = req.body;
  const response_id = response.response_id || null;
  try {
    await pool.query(
      'INSERT INTO responses (id, response_id, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE response_id = VALUES(response_id), data = VALUES(data)',
      [id, response_id, JSON.stringify(response)]
    );
    res.json({ success: true, response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.SERVER_PORT || 5000;
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Database backend server is running on http://localhost:${PORT}`);
  });
});
