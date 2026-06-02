/* eslint-disable */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'habeshaai_secret_2024';

// REGISTER
function register(req, res) {
  const { full_name, email, phone, password } = req.body;

  if (!full_name || !password || (!email && !phone)) {
    return res.status(400).json({ error: '❌ Please fill in all fields' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO users (full_name, email, phone, password, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [full_name, email || null, phone || null, hashedPassword, created_at],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: '❌ Email or phone already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      const token = jwt.sign({ id: this.lastID, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ message: '✅ Account created!', token, userId: this.lastID });
    }
  );
}

// LOGIN
function login(req, res) {
  const { emailOrPhone, password } = req.body;

  if (!emailOrPhone || !password) {
    return res.status(400).json({ error: '❌ Please enter your credentials' });
  }

  db.get(
    `SELECT * FROM users WHERE email = ? OR phone = ?`,
    [emailOrPhone, emailOrPhone],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: '❌ Account not found' });

      const validPassword = bcrypt.compareSync(password, user.password);
      if (!validPassword) return res.status(401).json({ error: '❌ Wrong password' });

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
      res.json({
        message: '✅ Login successful!',
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          plan: user.plan,
          plan_status: user.plan_status,
          plan_expires: user.plan_expires,
          role: user.role
        }
      });
    }
  );
}

// GET USER PROFILE
function getProfile(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '❌ Not logged in' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.get(`SELECT * FROM users WHERE id = ?`, [decoded.id], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: '❌ User not found' });
      res.json({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        plan: user.plan,
        plan_status: user.plan_status,
        plan_expires: user.plan_expires,
        role: user.role
      });
    });
  } catch {
    res.status(401).json({ error: '❌ Session expired. Please login again.' });
  }
}

module.exports = { register, login, getProfile };