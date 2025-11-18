/**
 * Infinite Craft - Frontend Application
 * Handles drag-and-drop, element combination, and UI updates
 */

const API_BASE = '/api';
let allElements = [];
let draggedElement = null;
let combinedItems = [];
const userId = `user-${Math.random().toString(36).substring(7)}`;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
  loadElements();
  setupDragAndDrop();
  loadRecipes();

  // Auto-refresh recipes every 3 seconds
  setInterval(loadRecipes, 3000);
});

// ==================== DATA LOADING ====================

async function loadElements() {
  try {
    const res = await fetch(`${API_BASE}/elements`);
    const data = await res.json();
    allElements = data.elements || [];
    renderElementsList();
    updateStats();
  } catch (err) {
    console.error('Failed to load elements:', err);
    toast('Failed to load elements');
  }
}

async function loadRecipes() {
  try {
    const res = await fetch(`${API_BASE}/recipes`);
    const data = await res.json();
    renderRecipesList(data.recipes || []);
  } catch (err) {
    console.error('Failed to load recipes:', err);
  }
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

  // Attach drag event listeners
  list.querySelectorAll('.element-item').forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
  });
}

function renderRecipesList(recipes) {
  const list = document.getElementById('recipes-list');

  if (recipes.length === 0) {
    list.innerHTML = '<p class="empty">No recipes yet</p>';
    return;
  }

  // Show only the latest 10
  const latest = recipes.slice(0, 10);
  list.innerHTML = latest.map(recipe => `
    <div class="recipe-item">
      <div class="recipe-formula">
        <span class="recipe-formula-item">${recipe.element_a_name}</span>
        <span>+</span>
        <span class="recipe-formula-item">${recipe.element_b_name}</span>
        <span>=</span>
        <span class="recipe-formula-result">${recipe.result_emoji} ${recipe.result_name}</span>
      </div>
      <div class="recipe-discoverer">
        ⭐ First: ${recipe.first_discoverer ? recipe.first_discoverer.substring(0, 20) : 'Unknown'}
      </div>
    </div>
  `).join('');
}

function updateStats() {
  document.getElementById('discovered').textContent = allElements.length;
  document.getElementById('total').textContent = '200'; // Arbitrary max
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
    element: null,
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

  // Attach drag listeners to combined items
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
  // Check each pair of combined items for overlap
  for (let i = 0; i < combinedItems.length; i++) {
    for (let j = i + 1; j < combinedItems.length; j++) {
      const item1 = combinedItems[i];
      const item2 = combinedItems[j];

      const distance = Math.sqrt(
        Math.pow(item1.x - item2.x, 2) + Math.pow(item1.y - item2.y, 2)
      );

      // If items are close enough, combine them
      if (distance < 100) {
        combineTwoElements(item1.name, item2.name, i, j);
        return;
      }
    }
  }
}

async function combineTwoElements(name1, name2, idx1, idx2) {
  try {
    const res = await fetch(`${API_BASE}/combine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        a: name1,
        b: name2,
        userId,
      }),
    });

    if (!res.ok) throw new Error('Combination failed');

    const data = await res.json();
    const result = data.result;

    // Add result to combined items
    const avgX = (combinedItems[idx1].x + combinedItems[idx2].x) / 2;
    const avgY = (combinedItems[idx1].y + combinedItems[idx2].y) / 2;

    // Remove the two combined items
    combinedItems = combinedItems.filter((_, i) => i !== idx1 && i !== idx2);

    // Add the result
    addCombinedItem(result.name, result.emoji, avgX, avgY);

    // Show notification
    const badge = data.isNew ? '✨ NEW' : '⭐ CACHED';
    toast(`${badge} ${name1} + ${name2} = ${result.emoji} ${result.name}`);

    // Reload elements
    loadElements();
  } catch (err) {
    console.error('Combination error:', err);
    toast('Failed to combine elements');
  }
}

// ==================== UTILITIES ====================

function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// Health check
fetch(`${API_BASE}/health`)
  .then(res => res.json())
  .catch(err => console.error('Server is not responding:', err));
