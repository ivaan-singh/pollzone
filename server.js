require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Database ────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DB Setup ────────────────────────────────────────────────────────────────
async function setupDB() {
  const client = await pool.connect();
  try {
    // Polls table
    await client.query(`
      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        question TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        votes_a INTEGER DEFAULT 0,
        votes_b INTEGER DEFAULT 0,
        section TEXT NOT NULL
      );
    `);

    // Poll of the Week table
    await client.query(`
      CREATE TABLE IF NOT EXISTS poll_of_the_week (
        id SERIAL PRIMARY KEY,
        question TEXT,
        option_a TEXT,
        option_b TEXT,
        votes_a INTEGER DEFAULT 0,
        votes_b INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true
      );
    `);

    // Seed polls if empty
    const { rowCount } = await client.query('SELECT 1 FROM polls LIMIT 1');
    if (rowCount === 0) {
      await seedPolls(client);
      console.log('✅ Database seeded!');
    }

    console.log('✅ Database ready!');
  } finally {
    client.release();
  }
}

async function seedPolls(client) {
  const polls = [
    // Sports
    { id: 'sports-1', question: 'Football GOAT?', option_a: '🐐 Ronaldo', option_b: '🐐 Messi', section: 'sports' },
    { id: 'sports-2', question: 'Best Football Club?', option_a: '⚪ Real Madrid', option_b: '🔵 Manchester City', section: 'sports' },
    { id: 'sports-3', question: 'Better Sport?', option_a: '⚽ Football', option_b: '🏀 Basketball', section: 'sports' },
    { id: 'sports-4', question: 'Cricket GOAT?', option_a: '🏏 Sachin Tendulkar', option_b: '🏏 Virat Kohli', section: 'sports' },
    // General
    { id: 'general-1', question: 'Pineapple on Pizza?', option_a: '🍍 Yes please!', option_b: '🚫 Absolutely not', section: 'general' },
    { id: 'general-2', question: 'Better Pet?', option_a: '🐱 Cats', option_b: '🐶 Dogs', section: 'general' },
    { id: 'general-3', question: 'Best Fast Food?', option_a: "🍔 McDonald's", option_b: '🍗 KFC', section: 'general' },
    { id: 'general-4', question: 'Is a Hot Dog a Sandwich?', option_a: '🌭 Yes it is', option_b: '❌ No way', section: 'general' },
    // Movies & TV
    { id: 'movies-1', question: 'Better Universe?', option_a: '⚡ Marvel', option_b: '🦇 DC', section: 'movies' },
    { id: 'movies-2', question: 'Best Animated Movie?', option_a: '🦁 Lion King', option_b: '🤠 Toy Story', section: 'movies' },
    { id: 'movies-3', question: 'Better Show?', option_a: '👾 Stranger Things', option_b: '🦑 Squid Game', section: 'movies' },
    { id: 'movies-4', question: 'Best Movie Franchise?', option_a: '🧙 Harry Potter', option_b: '🚀 Star Wars', section: 'movies' },
    // Music
    { id: 'music-1', question: 'Better Way to Listen?', option_a: '🎧 Headphones', option_b: '🔊 Speakers', section: 'music' },
    { id: 'music-2', question: 'How Do You Play Music?', option_a: '🔀 Shuffle', option_b: '📋 Playlist', section: 'music' },
    { id: 'music-3', question: 'Better Music Experience?', option_a: '🎤 Live Concert', option_b: '💿 Studio Recording', section: 'music' },
    { id: 'music-4', question: 'Best Music?', option_a: '🎮 Game/Movie Soundtracks', option_b: '🎶 Regular Songs', section: 'music' },
    // Gaming
    { id: 'gaming-1', question: 'Better Console?', option_a: '🎮 PlayStation', option_b: '🟢 Xbox', section: 'gaming' },
    { id: 'gaming-2', question: 'Best Game Ever?', option_a: '⛏️ Minecraft', option_b: '🪂 Fortnite', section: 'gaming' },
    { id: 'gaming-3', question: 'Better Genre?', option_a: '🔫 FPS', option_b: '⚔️ RPG', section: 'gaming' },
    { id: 'gaming-4', question: 'Best Gaming Franchise?', option_a: '⚽ FIFA', option_b: '💥 Call of Duty', section: 'gaming' },
    // Tech
    { id: 'tech-1', question: 'Better Phone?', option_a: '🍎 iPhone', option_b: '🤖 Android', section: 'tech' },
    { id: 'tech-2', question: 'Better Device?', option_a: '💻 Laptop', option_b: '📱 Tablet', section: 'tech' },
    { id: 'tech-3', question: 'Better Assistant?', option_a: '🍎 Siri', option_b: '🔵 Alexa', section: 'tech' },
    { id: 'tech-4', question: 'Better for Gaming?', option_a: '🖥️ Gaming PC', option_b: '🎮 Console', section: 'tech' },
  ];

  for (const poll of polls) {
    await client.query(
      `INSERT INTO polls (id, question, option_a, option_b, section)
       VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
      [poll.id, poll.question, poll.option_a, poll.option_b, poll.section]
    );
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET all polls
app.get('/api/polls', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM polls ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// POST vote
app.post('/api/vote', async (req, res) => {
  const { pollId, option } = req.body;

  if (!pollId || !['a', 'b'].includes(option)) {
    return res.status(400).json({ error: 'Invalid vote data' });
  }

  const column = option === 'a' ? 'votes_a' : 'votes_b';

  try {
    const result = await pool.query(
      `UPDATE polls SET ${column} = ${column} + 1 WHERE id = $1 RETURNING *`,
      [pollId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Poll not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// GET poll of the week
app.get('/api/potw', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM poll_of_the_week WHERE active = true ORDER BY id DESC LIMIT 1'
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch poll of the week' });
  }
});

// POST vote on poll of the week
app.post('/api/potw/vote', async (req, res) => {
  const { option } = req.body;

  if (!['a', 'b'].includes(option)) {
    return res.status(400).json({ error: 'Invalid option' });
  }

  const column = option === 'a' ? 'votes_a' : 'votes_b';

  try {
    const result = await pool.query(
      `UPDATE poll_of_the_week SET ${column} = ${column} + 1
       WHERE active = true RETURNING *`
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// PUT update poll of the week (admin)
app.put('/api/potw', async (req, res) => {
  const { question, option_a, option_b, adminKey } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await pool.query('UPDATE poll_of_the_week SET active = false');
    const result = await pool.query(
      `INSERT INTO poll_of_the_week (question, option_a, option_b, active)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [question, option_a, option_b]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update poll of the week' });
  }
});

// Catch-all → serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
setupDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 PollZone running on port ${PORT}`));
}).catch(err => {
  console.error('❌ DB setup failed:', err);
  process.exit(1);
});
