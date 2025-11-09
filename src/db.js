const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Choose a database file path that's safe for both local and serverless environments.
// Priority:
// 1. process.env.DB_PATH (explicit)
// 2. Use /tmp/data.sqlite for serverless platforms (Vercel, AWS Lambda, Azure Functions)
// 3. Fallback to a local file at project root (../data.sqlite)
let dbFile = process.env.DB_PATH;
if (!dbFile) {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME) {
    dbFile = '/tmp/data.sqlite';
  } else {
    dbFile = path.join(__dirname, '..', 'data.sqlite');
  }
}

// Ensure the parent directory exists when using a filesystem-backed DB file
try {
  const dbDir = path.dirname(dbFile);
  if (dbDir && dbDir !== '.') fs.mkdirSync(dbDir, { recursive: true });
} catch (err) {
  // If we can't create the directory, we'll log and proceed; Database open may still fail.
  console.error('Could not create directory for SQLite file:', err && err.message);
}

let db;
try {
  db = new Database(dbFile);
  db.pragma('journal_mode = WAL');
} catch (err) {
  // Provide a clear error message to aid debugging (path, permissions, read-only FS)
  console.error('Failed to open SQLite database at path:', dbFile);
  console.error(err && err.stack ? err.stack : err);
  // As a fallback, open an in-memory DB so the app doesn't crash; note data won't persist.
  try {
    db = new Database(':memory:');
    console.warn('Opened in-memory SQLite fallback database; data will not persist across restarts.');
  } catch (memErr) {
    console.error('Failed to open an in-memory SQLite database as fallback:', memErr && memErr.stack ? memErr.stack : memErr);
    throw err; // rethrow original error to avoid starting in a broken state
  }
}

db.exec(`
  CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    companyName TEXT NOT NULL,
    personName TEXT NOT NULL,
    planName TEXT NOT NULL,
    date TEXT NOT NULL,
    amount TEXT NOT NULL,
    usersCount INTEGER,
    annualPricePerUser TEXT,
    annualDiscountPercent TEXT,
    discountedAnnualPricing TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try { db.exec(`ALTER TABLE proposals ADD COLUMN usersCount INTEGER`); } catch (_) {}
try { db.exec(`ALTER TABLE proposals ADD COLUMN annualPricePerUser TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE proposals ADD COLUMN annualDiscountPercent TEXT`); } catch (_) {}
try { db.exec(`ALTER TABLE proposals ADD COLUMN discountedAnnualPricing TEXT`); } catch (_) {}

function getAllProposals() {
  const stmt = db.prepare('SELECT id, companyName, planName, amount, date, createdAt FROM proposals ORDER BY createdAt DESC');
  return stmt.all();
}

function getProposalById(id) {
  const stmt = db.prepare('SELECT * FROM proposals WHERE id = ?');
  return stmt.get(id);
}

function createProposal({ companyName, personName, planName, date, amount, usersCount, annualPricePerUser, annualDiscountPercent, discountedAnnualPricing }) {
  const stmt = db.prepare(`
    INSERT INTO proposals (companyName, personName, planName, date, amount, usersCount, annualPricePerUser, annualDiscountPercent, discountedAnnualPricing)
    VALUES (@companyName, @personName, @planName, @date, @amount, @usersCount, @annualPricePerUser, @annualDiscountPercent, @discountedAnnualPricing)
  `);
  const info = stmt.run({
    companyName,
    personName,
    planName,
    date,
    amount,
    usersCount: usersCount ?? 3,
    annualPricePerUser: annualPricePerUser ?? '₹3,000',
    annualDiscountPercent: annualDiscountPercent ?? '33.33%',
    discountedAnnualPricing: discountedAnnualPricing ?? '₹2,000 x 3',
  });
  return info.lastInsertRowid;
}

function updateProposal(id, { companyName, personName, planName, date, amount, usersCount, annualPricePerUser, annualDiscountPercent, discountedAnnualPricing }) {
  const stmt = db.prepare(`
    UPDATE proposals
    SET companyName = @companyName,
        personName = @personName,
        planName = @planName,
        date = @date,
        amount = @amount,
        usersCount = @usersCount,
        annualPricePerUser = @annualPricePerUser,
        annualDiscountPercent = @annualDiscountPercent,
        discountedAnnualPricing = @discountedAnnualPricing
    WHERE id = @id
  `);
  stmt.run({
    id,
    companyName,
    personName,
    planName,
    date,
    amount,
    usersCount,
    annualPricePerUser,
    annualDiscountPercent,
    discountedAnnualPricing,
  });
}

function deleteProposal(id) {
  const stmt = db.prepare('DELETE FROM proposals WHERE id = ?');
  stmt.run(id);
}

module.exports = {
  getAllProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
};


