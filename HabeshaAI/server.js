/* eslint-disable */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { register, login, getProfile } = require('./server/auth');
const { submitPayment, confirmPayment, getAllPayments, checkExpiredPlans, PLANS } = require('./server/payments');
const { chat, getHistory, getNotifications } = require('./server/ai');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─── AUTH ROUTES ─────────────────────────────────────────
app.post('/api/register', register);
app.post('/api/login', login);
app.get('/api/profile', getProfile);

// ─── PAYMENT ROUTES ──────────────────────────────────────
app.post('/api/payment/submit', submitPayment);
app.post('/api/payment/confirm', confirmPayment);
app.get('/api/payments', getAllPayments);
app.get('/api/plans', (req, res) => res.json(PLANS));

// ─── AI ROUTES ───────────────────────────────────────────
app.post('/api/chat', chat);
app.get('/api/history/:user_id', getHistory);
app.get('/api/notifications/:user_id', getNotifications);

// ─── ADMIN ROUTES ────────────────────────────────────────
app.get('/api/users', (req, res) => {
  const db = require('./server/database');
  db.all(`SELECT id, full_name, email, phone, plan, plan_status, plan_expires, role, created_at
          FROM users ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Check expired plans every hour
setInterval(checkExpiredPlans, 60 * 60 * 1000);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Habesha AI Server running at http://localhost:${PORT}`);
});