/**
 * Infinite Craft - Client-Side Only (localStorage)
 * All game logic runs in the browser. No backend required.
 */

// ==================== ELEMENT GENERATION ====================

const ADJECTIVES = [
  'Burning', 'Frozen', 'Bright', 'Dark', 'Soft', 'Sharp', 'Hot', 'Cold',
  'Wet', 'Dry', 'Light', 'Heavy', 'Smooth', 'Rough', 'Sweet', 'Bitter',
  'Shimmering', 'Ancient', 'New', 'Wild', 'Calm', 'Fierce', 'Gentle', 'Mighty',
  'Tiny', 'Giant', 'Sparkling', 'Dim', 'Clear', 'Murky', 'Pure', 'Mixed',
];

const NOUNS = [
  'Storm', 'Mist', 'Crystal', 'Dust', 'Powder', 'Essence', 'Force', 'Wave',
  'Particle', 'Cloud', 'Spark', 'Breeze', 'Glow', 'Surge', 'Swirl', 'Current',
  'Burst', 'Bloom', 'Garden', 'Peak', 'Canyon', 'Meadow', 'Forest', 'Ocean',
  'River', 'Mountain', 'Valley', 'Flame', 'Frost', 'Thunder', 'Lightning',
  'Rainbow', 'Prism', 'Echo', 'Pulse', 'Tide', 'Whirlwind', 'Ember', 'Ash',
];

const EMOJIS = [
  '✨', '⚡', '🌈', '💫', '🔮', '🎆', '🌟', '💎', '🔥', '💧',
  '🌪️', '❄️', '🍃', '⛈️', '🌊', '💨', '🌑', '☀️', '🌙', '⭐',
  '🎨', '🌺', '🌸', '🌼', '🌻', '🌷', '🌹', '🥀', '🌳', '🌲',
  '🏔️', '⛰️', '🌋', '🗻', '🏕️', '⛺', '🌅', '🌄', '🌠', '💐',
];

const MAGIC_COMBINATIONS = {
  'water_fire': { name: 'Steam', emoji: '💨' },
  'fire_water': { name: 'Steam', emoji: '💨' },
  'fire_earth': { name: 'Lava', emoji: '🌋' },
  'earth_fire': { name: 'Lava', emoji: '🌋' },
  'water_earth': { name: 'Mud', emoji: '🟫' },
  'earth_water': { name: 'Mud', emoji: '🟫' },
  'wind_fire': { name: 'Smoke', emoji: '💨' },
  'fire_wind': { name: 'Smoke', emoji: '💨' },
  'earth_wind': { name: 'Dust', emoji: '🌪️' },
  'wind_earth': { name: 'Dust', emoji: '🌪️' },
  'water_wind': { name: 'Wave', emoji: '🌊' },
  'wind_water': { name: 'Wave', emoji: '🌊' },
};

function generateElement(element1, element2) {
  const key = [element1.toLowerCase(), element2.toLowerCase()].sort().join('_');

  if (MAGIC_COMBINATIONS[key]) {
    return MAGIC_COMBINATIONS[key];
  }

  const hashCode = Array.from(key).reduce((hash, char) => {
    const code = char.charCodeAt(0);
    return ((hash << 5) - hash) + code | 0;
  }, 0);

  const absHash = Math.abs(hashCode);
  const adjIndex = absHash % ADJECTIVES.length;
  const nounIndex = (absHash >>> 8) % NOUNS.length;
  const emojiIndex = (absHash >>> 16) % EMOJIS.length;

  return {
    name: `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`,
    emoji: EMOJIS[emojiIndex]
  };
}

// ==================== STATE & INITIALIZATION ====================

const STARTING_ELEMENTS = [
  { name: 'Water', emoji: '💧' },
  { name: 'Fire', emoji: '🔥' },
  { name: 'Earth', emoji: '🌍' },
  { name: 'Wind', emoji: '💨' },
];

let allElements = [];
let draggedElement = null;
let combinedItems = [];
let recipes = [];
const userId = `user-${Math.random().toString(36).substring(7)}`;

document.addEventListener('DOMContentLoaded', () => {
  initializeGame();
  setupDragAndDrop();
  setInterval(loadRecipes, 3000);
});

function initializeGame() {
  const saved = localStorage.getItem('infinitecraft_elements');
  if (saved) {
    allElements = JSON.parse(saved);
  } else {
    allElements = [...STARTING_ELEMENTS];
    saveElements();
  }

  loadRecipes();
  renderElementsList();
  updateStats();
}

function saveElements() {
  localStorage.setItem('infinitecraft_elements', JSON.stringify(allElements));
}

function loadRecipes() {
  const saved = localStorage.getItem('infinitecraft_recipes');
  recipes = saved ? JSON.parse(saved) : [];
  renderRecipesList();
}

// ==================== RENDERING ====================

function renderElementsList() {
  const list = document.getElementById('elements-list');

  if (allElements.length === 0) {
    list.innerHTML = '<p class="empty">Loading...</p>';
    return;
  }

  list.innerHTML = allElements.map(elem => `
    <div class="element-item" draggable="true" data-name="${elem.name}">
      <span class="element-emoji">${elem.emoji}</span>
      <span class="element-name">${elem.name}</span>
    </div>
  `).join('');

  list.querySelectorAll('.element-item').forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function renderRecipesList() {
  const list = document.getElementById('recipes-list');

  if (recipes.length === 0) {
    list.innerHTML = '<p class="empty">No recipes yet</p>';
    return;
  }

  const latest = recipes.slice(0, 10);
  list.innerHTML = latest.map(recipe => `
    <div class="recipe-item">
      <div class="recipe-formula">
        <span class="recipe-formula-item">${recipe.a_name}</span>
        <span>+</span>
        <span class="recipe-formula-item">${recipe.b_name}</span>
        <span>=</span>
        <span class="recipe-formula-result">${recipe.result_emoji} ${recipe.result_name}</span>
      </div>
      <div class="recipe-discoverer">
        ⭐ First: ${recipe.discoverer.substring(0, 20)}
      </div>
    </div>
  `).join('');
}

function updateStats() {
  document.getElementById('discovered').textContent = allElements.length;
  document.getElementById('total').textContent = '∞';
}

// ==================== DRAG & DROP ====================

function handleDragStart(e) {
  draggedElement = {
    name: e.target.dataset.name,
    emoji: e.target.querySelector('.element-emoji').textContent,
  };
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'copy';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

function setupDragAndDrop() {
  const workspace = document.getElementById('workspace');

  workspace.addEventListener('dragover', (e) => {
    e.preventDefault();
    workspace.style.background = 'rgba(14, 165, 233, 0.1)';
  });

  workspace.addEventListener('dragleave', () => {
    workspace.style.background = '';
  });

  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    workspace.style.background = '';

    if (!draggedElement) return;

    const rect = workspace.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left - 40, rect.width - 80));
    const y = Math.max(0, Math.min(e.clientY - rect.top - 40, rect.height - 80));

    addCombinedItem(draggedElement.name, draggedElement.emoji, x, y);
  });
}

// ==================== COMBINATION LOGIC ====================

function addCombinedItem(name, emoji, x, y) {
  const item = {
    id: `${name}-${Date.now()}`,
    name,
    emoji,
    x,
    y,
  };

  combinedItems.push(item);
  renderCombinedItems();
  checkForCombinations();
}

function renderCombinedItems() {
  const container = document.getElementById('combined-items');

  container.innerHTML = combinedItems.map((item, idx) => `
    <div class="combined-item" style="left: ${item.x}px; top: ${item.y}px;"
         draggable="true" data-index="${idx}">
      <div class="combined-item-emoji">${item.emoji}</div>
      <div class="combined-item-name">${item.name}</div>
    </div>
  `).join('');

  container.querySelectorAll('.combined-item').forEach((el, idx) => {
    let offset = { x: 0, y: 0 };

    el.addEventListener('dragstart', (e) => {
      const rect = el.getBoundingClientRect();
      offset.x = e.clientX - rect.left;
      offset.y = e.clientY - rect.top;
      el.classList.add('dragging');
    });

    el.addEventListener('dragend', (e) => {
      const workspace = document.getElementById('workspace');
      const rect = workspace.getBoundingClientRect();
      const newX = Math.max(0, Math.min(e.clientX - rect.left - offset.x, rect.width - 80));
      const newY = Math.max(0, Math.min(e.clientY - rect.top - offset.y, rect.height - 80));

      combinedItems[idx].x = newX;
      combinedItems[idx].y = newY;
      el.classList.remove('dragging');
      renderCombinedItems();
      checkForCombinations();
    });
  });
}

function checkForCombinations() {
  for (let i = 0; i < combinedItems.length; i++) {
    for (let j = i + 1; j < combinedItems.length; j++) {
      const item1 = combinedItems[i];
      const item2 = combinedItems[j];

      const distance = Math.sqrt(
        Math.pow(item1.x - item2.x, 2) + Math.pow(item1.y - item2.y, 2)
      );

      if (distance < 100) {
        combineTwoElements(item1.name, item2.name, i, j);
        return;
      }
    }
  }
}

function combineTwoElements(name1, name2, idx1, idx2) {
  // Check if elements exist
  const elem1 = allElements.find(e => e.name === name1);
  const elem2 = allElements.find(e => e.name === name2);

  if (!elem1 || !elem2) {
    toast('Element not found');
    return;
  }

  // Generate result
  const result = generateElement(name1, name2);

  // Check if result already exists
  const existing = allElements.find(e => e.name === result.name);
  const isNew = !existing;

  // Add result to elements if new
  if (isNew) {
    allElements.push(result);
    saveElements();
  }

  // Add to recipes
  const recipe = {
    a_name: name1,
    b_name: name2,
    result_name: result.name,
    result_emoji: result.emoji,
    discoverer: userId,
    timestamp: Date.now(),
  };

  // Check if recipe already exists
  const recipeExists = recipes.some(r =>
    (r.a_name === name1 && r.b_name === name2) ||
    (r.a_name === name2 && r.b_name === name1)
  );

  if (!recipeExists) {
    recipes.unshift(recipe);
    localStorage.setItem('infinitecraft_recipes', JSON.stringify(recipes));
  }

  // Remove combined items and add result
  const avgX = (combinedItems[idx1].x + combinedItems[idx2].x) / 2;
  const avgY = (combinedItems[idx1].y + combinedItems[idx2].y) / 2;

  combinedItems = combinedItems.filter((_, i) => i !== idx1 && i !== idx2);
  addCombinedItem(result.name, result.emoji, avgX, avgY);

  // Show notification
  const badge = isNew ? '✨ NEW' : '⭐ CACHED';
  toast(`${badge} ${name1} + ${name2} = ${result.emoji} ${result.name}`);

  // Refresh UI
  renderElementsList();
  loadRecipes();
}

// ==================== UTILITIES ====================

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}
