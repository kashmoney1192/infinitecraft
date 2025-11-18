const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'craft.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database connection error:', err);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Elements table
      db.run(`
        CREATE TABLE IF NOT EXISTS elements (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          emoji TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err && !err.message.includes('already exists')) console.error('Elements table error:', err);
      });

      // Recipes table
      db.run(`
        CREATE TABLE IF NOT EXISTS recipes (
          id TEXT PRIMARY KEY,
          element_a_id TEXT NOT NULL,
          element_b_id TEXT NOT NULL,
          result_id TEXT NOT NULL,
          first_discoverer TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(element_a_id, element_b_id),
          FOREIGN KEY(element_a_id) REFERENCES elements(id),
          FOREIGN KEY(element_b_id) REFERENCES elements(id),
          FOREIGN KEY(result_id) REFERENCES elements(id)
        )
      `, (err) => {
        if (err && !err.message.includes('already exists')) console.error('Recipes table error:', err);
        console.log('✓ Database initialized');
        resolve();
      });
    });
  });
}

// Promise wrappers for database operations
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

// Prepared statement wrappers
const stmts = {
  getElementByName: (name) => dbGet('SELECT * FROM elements WHERE LOWER(name) = LOWER(?)', [name]),
  getElementById: (id) => dbGet('SELECT * FROM elements WHERE id = ?', [id]),
  getAllElements: () => dbAll('SELECT * FROM elements ORDER BY created_at ASC'),

  insertElement: (id, name, emoji) => dbRun(
    'INSERT INTO elements (id, name, emoji) VALUES (?, ?, ?)',
    [id, name, emoji]
  ),

  getRecipe: (id1, id2) => dbGet(`
    SELECT r.*, e_result.name as result_name, e_result.emoji as result_emoji
    FROM recipes r
    JOIN elements e_result ON r.result_id = e_result.id
    WHERE (r.element_a_id = ? AND r.element_b_id = ?)
       OR (r.element_a_id = ? AND r.element_b_id = ?)
    LIMIT 1
  `, [id1, id2, id2, id1]),

  insertRecipe: (id, a_id, b_id, result_id, discoverer) => dbRun(
    'INSERT INTO recipes (id, element_a_id, element_b_id, result_id, first_discoverer) VALUES (?, ?, ?, ?, ?)',
    [id, a_id, b_id, result_id, discoverer]
  ),

  getAllRecipes: () => dbAll(`
    SELECT
      ea.name as element_a_name,
      eb.name as element_b_name,
      er.name as result_name,
      er.emoji as result_emoji,
      r.first_discoverer,
      r.created_at
    FROM recipes r
    JOIN elements ea ON r.element_a_id = ea.id
    JOIN elements eb ON r.element_b_id = eb.id
    JOIN elements er ON r.result_id = er.id
    ORDER BY r.created_at DESC
  `),
};

module.exports = {
  db,
  initDatabase,
  stmts,
  dbRun,
  dbGet,
  dbAll,
};
