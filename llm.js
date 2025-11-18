/**
 * Mock LLM Generator - Deterministic, no external APIs required
 * Generates creative element names and emojis based on input combination
 */

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

// Predefined "magic" combinations that should always produce the same result
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

// Content filter - words to avoid/replace
const CONTENT_FILTER = {
  badWords: [],
  sanitize: (str) => {
    return str.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
  },
};

/**
 * Generate a deterministic element name + emoji for a combination
 * Uses hash-based selection from predefined lists for consistency
 */
function generateElement(element1, element2) {
  const key = [element1.toLowerCase(), element2.toLowerCase()].sort().join('_');
  
  // Check for magic combinations first
  if (MAGIC_COMBINATIONS[key]) {
    return MAGIC_COMBINATIONS[key];
  }
  
  // Generate deterministic hash from element names
  const hashCode = Array.from(key).reduce((hash, char) => {
    const code = char.charCodeAt(0);
    return ((hash << 5) - hash) + code | 0; // Keep it as 32-bit integer
  }, 0);
  
  const absHash = Math.abs(hashCode);
  const adjIndex = absHash % ADJECTIVES.length;
  const nounIndex = (absHash >>> 8) % NOUNS.length;
  const emojiIndex = (absHash >>> 16) % EMOJIS.length;
  
  const name = `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}`;
  const emoji = EMOJIS[emojiIndex];
  
  return { name, emoji };
}

module.exports = {
  generateElement,
  MAGIC_COMBINATIONS,
  CONTENT_FILTER,
};
