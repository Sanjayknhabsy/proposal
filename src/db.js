const path = require('path');
const Database = require('better-sqlite3');

const dbFile = path.join(__dirname, '..', 'data.sqlite');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');

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


