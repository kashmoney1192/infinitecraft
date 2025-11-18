# ✨ Infinite Craft - Minimal Local-First Clone

A lightweight, local-first infinite crafting game built with Node.js, Express, and SQLite. Start with 4 base elements and combine them to discover infinite possibilities.

## Features

- 🎮 **Drag-and-drop gameplay** - Intuitive element combination
- 💾 **Persistent storage** - SQLite database with recipe caching
- 🔄 **Deterministic results** - Same combinations always produce the same output
- ⭐ **First discoverer tracking** - See who discovered each element
- 📱 **Responsive UI** - Works on desktop and mobile
- 🚀 **Zero external APIs** - Mock LLM generator included
- 🧪 **Fully tested** - Includes comprehensive test suite

## Quick Start

### Prerequisites

- Node.js 14+ (https://nodejs.org/)
- npm or yarn

### Installation

```bash
# Clone or download the project
cd infinite-craft

# Install dependencies
npm install
```

### Running the Game

**Terminal 1 - Initialize Database:**
```bash
node seed.js
```

Output:
```
✓ Database initialized
✓ Added element: 💧 Water
✓ Added element: 🔥 Fire
✓ Added element: 🌍 Earth
✓ Added element: 💨 Wind

🌱 Database seeded successfully!
📊 Total elements: 4
```

**Terminal 2 - Start Server:**
```bash
npm start
```

Output:
```
🎮 Infinite Craft Server
📍 Running on http://localhost:3000
💾 Database: /path/to/infinite-craft/craft.db
```

**Open in Browser:**
```
http://localhost:3000
```

### Reset Database

To reset and re-seed the database:

```bash
node seed.js --reset
```

## How to Play

1. **See Elements** - Left sidebar shows all discovered elements
2. **Drag Elements** - Drag an element from the sidebar onto the workspace
3. **Combine** - Drag two workspace items close together (within 100px)
4. **Discover** - New elements are created and added to your collection
5. **Explore** - Combine elements with each other to find new recipes

## API Documentation

All endpoints return JSON. Base URL: `http://localhost:3000/api`

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### `GET /api/elements`

Returns all discovered elements.

**Response:**
```json
{
  "success": true,
  "count": 7,
  "elements": [
    { "id": "uuid", "name": "Water", "emoji": "💧", "created_at": "..." },
    { "id": "uuid", "name": "Fire", "emoji": "🔥", "created_at": "..." },
    { "id": "uuid", "name": "Steam", "emoji": "💨", "created_at": "..." }
  ]
}
```

### `POST /api/combine`

Combine two elements.

**Request Body:**
```json
{
  "a": "Fire",
  "b": "Water",
  "userId": "optional-user-id"
}
```

**Response (New):**
```json
{
  "success": true,
  "isNew": true,
  "result": {
    "name": "Steam",
    "emoji": "💨",
    "firstDiscoverer": "user-123"
  }
}
```

**Response (Cached):**
```json
{
  "success": true,
  "isNew": false,
  "result": {
    "name": "Steam",
    "emoji": "💨",
    "firstDiscoverer": "user-123"
  }
}
```

**Error Response:**
```json
{
  "error": "Missing elements a or b"
}
```

### `GET /api/recipes`

Returns all element combinations.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "recipes": [
    {
      "element_a_name": "Fire",
      "element_b_name": "Water",
      "result_name": "Steam",
      "result_emoji": "💨",
      "first_discoverer": "user-123",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Testing

Run the test suite to verify all functionality:

```bash
# In one terminal, start the server
npm start

# In another terminal, run tests
npm test
```

### Manual Test with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get all elements
curl http://localhost:3000/api/elements

# Combine Fire + Water
curl -X POST http://localhost:3000/api/combine \
  -H "Content-Type: application/json" \
  -d '{
    "a": "Fire",
    "b": "Water",
    "userId": "test-user-1"
  }'

# Combine the same pair again (should be cached)
curl -X POST http://localhost:3000/api/combine \
  -H "Content-Type: application/json" \
  -d '{
    "a": "Fire",
    "b": "Water",
    "userId": "test-user-2"
  }'

# Get all recipes
curl http://localhost:3000/api/recipes
```

## Project Structure

```
infinite-craft/
├── server.js           # Express server & API routes
├── db.js              # SQLite database layer & prepared statements
├── llm.js             # Mock LLM element generator
├── seed.js            # Database initialization script
├── test.js            # API test suite
├── package.json       # Dependencies
├── craft.db           # SQLite database (auto-created)
└── public/
    ├── index.html     # UI template
    ├── style.css      # Styling
    └── app.js         # Frontend logic
```

## Database Schema

### `elements` Table
```sql
CREATE TABLE elements (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### `recipes` Table
```sql
CREATE TABLE recipes (
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
);
```

## Element Generation

The mock LLM generator creates deterministic element names based on combination:

**Magic Combinations (Hardcoded):**
- Fire + Water = **Steam** 💨
- Fire + Earth = **Lava** 🌋
- Water + Earth = **Mud** 🟫
- Wind + Fire = **Smoke** 💨
- Earth + Wind = **Dust** 🌪️
- Water + Wind = **Wave** 🌊

**Other Combinations:**
- Uses hash-based selection from predefined adjectives & nouns
- Always produces the same result for the same input pair
- Deterministic (no randomness in output)

## Replacing the Mock LLM

To use a real LLM API (OpenAI, Together AI, etc.), modify `llm.js`:

```javascript
// Example: Using OpenAI API
async function generateElement(element1, element2) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Create a creative element name (max 20 chars) and emoji for: ${element1} + ${element2}`,
      }],
    }),
  });

  // Parse response and extract name + emoji
  const data = await response.json();
  return {
    name: parseNameFromResponse(data),
    emoji: parseEmojiFromResponse(data),
  };
}
```

## Configuration

### Environment Variables

Create a `.env` file to customize settings:

```env
PORT=3000
NODE_ENV=development
```

### Content Filtering

The mock LLM includes a content filter in `llm.js`:

```javascript
const CONTENT_FILTER = {
  badWords: [],
  sanitize: (str) => {
    return str.toLowerCase().replace(/[^a-z0-9\s]/gi, '').trim();
  },
};
```

## Performance

- **Database**: SQLite with prepared statements for safety & speed
- **Caching**: Recipes are cached in the database (O(1) lookup)
- **Frontend**: Vanilla JS, no heavy frameworks
- **Memory**: Uses lazy loading for recipes (pagination available)

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Troubleshooting

### "Port 3000 is already in use"
```bash
# Use a different port
PORT=3001 npm start
```

### "Database locked" error
```bash
# Remove the old database and reseed
rm craft.db
node seed.js
```

### "Module not found" error
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Tests fail with "Cannot connect"
```bash
# Make sure the server is running first
npm start  # Terminal 1
npm test   # Terminal 2
```

## Future Enhancements

- [ ] User authentication & accounts
- [ ] Recipe sharing & exporting
- [ ] Leaderboards (most discovered)
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multiplayer (WebSockets)
- [ ] Custom element creation
- [ ] Undo/Redo functionality
- [ ] Recipe categories & filtering

## License

MIT

## Credits

Built as a minimal clone of [Neal.fun's Infinite Craft](https://neal.fun/infinite-craft/)

## Questions?

- Check the test suite for API usage examples
- Review `llm.js` for element generation logic
- See `db.js` for database operations
- Explore `public/app.js` for frontend logic
