const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Choose a database file path that's safe for both local and serverless environments.
// Priority:
// 1. process.env.DB_PATH (explicit)
// 2. Use /tmp/data.sqlite for serverless platforms (Vercel, AWS Lambda, Azure Functions)
// 3. Fallback to a local file at project root (../data.sqlite)
// Prepare candidate DB paths in order of preference.
const candidates = [];
if (process.env.DB_PATH) candidates.push(process.env.DB_PATH);
// /tmp is commonly writable on serverless platforms
candidates.push('/tmp/data.sqlite');
// project-local fallback
candidates.push(path.join(__dirname, '..', 'data.sqlite'));

let db;
let lastError = null;
for (const candidate of candidates) {
  if (!candidate) continue;
  try {
    const dbDir = path.dirname(candidate);
    if (dbDir && dbDir !== '.') fs.mkdirSync(dbDir, { recursive: true });
  } catch (mkdirErr) {
    console.warn('Could not ensure directory for candidate DB path', candidate, mkdirErr && mkdirErr.message);
    // continue — attempt to open may still work (e.g., file in existing dir)
  }

  try {
    console.info('Attempting to open SQLite DB at', candidate);
    db = new Database(candidate);
    db.pragma('journal_mode = WAL');
    console.info('Opened SQLite DB at', candidate);
    break; // success
  } catch (err) {
    lastError = err;
    console.warn('Failed to open SQLite DB at', candidate, '-', err && err.message);
    // try next candidate
  }
}

if (!db) {
  console.error('All candidate SQLite DB paths failed. Last error:', lastError && lastError.message);
  // As a final fallback, open an in-memory DB so the app continues to run.
  try {
    db = new Database(':memory:');
    console.warn('Opened in-memory SQLite fallback database; data will not persist across restarts.');
  } catch (memErr) {
    console.error('Failed to open an in-memory SQLite database as fallback:', memErr && memErr.stack ? memErr.stack : memErr);
    // Re-throw the last filesystem error to avoid starting in an unusable state.
    throw lastError || memErr;
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


