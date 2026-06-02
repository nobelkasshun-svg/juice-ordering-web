/* eslint-disable */
const db = require('./database');

const SYSTEM_PROMPT = `You are Habesha AI, Ethiopia's most powerful AI assistant built for Ethiopian students, creators, engineers, doctors, tourists and professionals.

You can help with:
- 📚 All academic subjects (medicine, engineering, architecture, law, business, science, math, history)
- 🎥 Video editing ideas, YouTube/TikTok content strategies, thumbnail concepts
- 📰 Ethiopian news, politics, football, entertainment
- 🗺️ Tourist guide for Ethiopia (hotels, food, landmarks, historical places, swimming spots)
- 💡 Content creation ideas from Ethiopia and around the world
- 🌍 Travel guidance for people visiting Ethiopia
- 💻 Software engineering, coding help, debugging
- 🏥 Medical questions and health advice
- 🏗️ Architecture and engineering projects

You speak English, Amharic, Afaan Oromo, and Tigrinya.
Always be helpful, accurate, and culturally aware of Ethiopian context.
When asked about Ethiopian places, food, or culture, give detailed local knowledge.`;

async function chat(req, res) {
  const { user_id, message, language } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: '❌ Message is required' });
  }

  // Check user plan
  db.get(`SELECT * FROM users WHERE id = ?`, [user_id], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: '❌ User not found' });

    if (user.plan_status !== 'active') {
      return res.status(403).json({
        error: '❌ Please subscribe to a plan to use Habesha AI',
        needsPlan: true
      });
    }

    // Get conversation history
    db.all(
      `SELECT role, message FROM conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [user_id],
      async (err, history) => {
        if (err) return res.status(500).json({ error: err.message });

        const messages = history.reverse().map(h => ({
          role: h.role,
          content: h.message
        }));

        messages.push({ role: 'user', content: message });

        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-opus-4-5',
              max_tokens: 1024,
              system: SYSTEM_PROMPT,
              messages
            })
          });

          const data = await response.json();
          const reply = data.content[0].text;

          // Save conversation
          const now = new Date().toISOString();
          db.run(`INSERT INTO conversations (user_id, role, message, created_at) VALUES (?, ?, ?, ?)`,
            [user_id, 'user', message, now]);
          db.run(`INSERT INTO conversations (user_id, role, message, created_at) VALUES (?, ?, ?, ?)`,
            [user_id, 'assistant', reply, now]);

          res.json({ reply });

        } catch (error) {
          res.status(500).json({ error: '❌ AI service error. Please try again.' });
        }
      }
    );
  });
}

// GET CONVERSATION HISTORY
function getHistory(req, res) {
  const { user_id } = req.params;
  db.all(
    `SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at ASC`,
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
}

// GET NOTIFICATIONS
function getNotifications(req, res) {
  const { user_id } = req.params;
  db.all(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
}

module.exports = { chat, getHistory, getNotifications };