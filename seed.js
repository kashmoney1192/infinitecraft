const fs = require('fs');
const path = require('path');
const { initDatabase, stmts } = require('./db');
const { v4: uuidv4 } = require('uuid');

const STARTING_ELEMENTS = [
  { name: 'Water', emoji: '💧' },
  { name: 'Fire', emoji: '🔥' },
  { name: 'Earth', emoji: '🌍' },
  { name: 'Wind', emoji: '💨' },
];

const resetDb = process.argv.includes('--reset');

async function resetDatabase() {
  const dbPath = path.join(__dirname, 'craft.db');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✓ Deleted existing database');
  }
}

async function seedDatabase() {
  try {
    await initDatabase();
    console.log('');

    for (const element of STARTING_ELEMENTS) {
      const id = uuidv4();
      await stmts.insertElement(id, element.name, element.emoji);
      console.log(`✓ Added element: ${element.emoji} ${element.name}`);
    }

    console.log('');
    const all = await stmts.getAllElements();
    console.log('🌱 Database seeded successfully!');
    console.log(`📊 Total elements: ${all.length}`);
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('✗ Error seeding database:', err);
    process.exit(1);
  }
}

(async () => {
  if (resetDb) {
    await resetDatabase();
  }
  await seedDatabase();
})();
