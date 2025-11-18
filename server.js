const express = require('express');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { initDatabase, stmts } = require('./db');
const { generateElement } = require('./llm');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

initDatabase();

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/elements', async (req, res) => {
  try {
    const elements = await stmts.getAllElements();
    res.json({ success: true, count: elements.length, elements });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/combine', async (req, res) => {
  try {
    const { a, b, userId } = req.body;
    if (!a || !b) return res.status(400).json({ error: 'Missing elements' });

    const discoverer = userId || `anon-${Date.now()}`;
    const elemA = await stmts.getElementByName(a);
    const elemB = await stmts.getElementByName(b);

    if (!elemA || !elemB) return res.status(404).json({ error: 'Element not found' });

    const [id1, id2] = [elemA.id, elemB.id].sort();
    const existing = await stmts.getRecipe(id1, id2);

    if (existing) {
      return res.json({
        success: true,
        isNew: false,
        result: { name: existing.result_name, emoji: existing.result_emoji, firstDiscoverer: existing.first_discoverer }
      });
    }

    const gen = generateElement(a, b);
    let result = await stmts.getElementByName(gen.name);

    if (!result) {
      const newId = uuidv4();
      await stmts.insertElement(newId, gen.name, gen.emoji);
      result = { id: newId, name: gen.name, emoji: gen.emoji };
    }

    const recipeId = uuidv4();
    await stmts.insertRecipe(recipeId, id1, id2, result.id, discoverer);

    res.json({ success: true, isNew: true, result: { name: gen.name, emoji: gen.emoji, firstDiscoverer: discoverer } });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const recipes = await stmts.getAllRecipes();
    res.json({ success: true, count: recipes.length, recipes });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎮 Infinite Craft Server`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`💾 ${path.join(__dirname, 'craft.db')}\n`);
});

module.exports = app;
