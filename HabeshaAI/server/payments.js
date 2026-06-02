/* eslint-disable */
const db = require('./database');

const PLANS = {
  student: { name: 'Student Plan', price: 99,  duration: 30 },
  creator: { name: 'Creator Plan', price: 199, duration: 30 },
  pro:     { name: 'Pro Plan',     price: 349, duration: 30 }
};

// SUBMIT PAYMENT
function submitPayment(req, res) {
  const { user_id, plan, payment_method, transaction_ref } = req.body;

  if (!user_id || !plan || !payment_method || !transaction_ref) {
    return res.status(400).json({ error: '❌ Please fill in all fields' });
  }

  if (!PLANS[plan]) {
    return res.status(400).json({ error: '❌ Invalid plan selected' });
  }

  const amount = PLANS[plan].price;
  const submitted_at = new Date().toISOString();

  db.run(
    `INSERT INTO payments (user_id, plan, amount, payment_method, transaction_ref, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    [user_id, plan, amount, payment_method, transaction_ref, submitted_at],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: '✅ Payment submitted! Waiting for confirmation.', id: this.lastID });
    }
  );
}

// CONFIRM PAYMENT (admin only)
function confirmPayment(req, res) {
  const { payment_id } = req.body;

  db.get(`SELECT * FROM payments WHERE id = ?`, [payment_id], (err, payment) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!payment) return res.status(404).json({ error: '❌ Payment not found' });

    const confirmed_at = new Date().toISOString();
    const plan_started = new Date().toISOString();
    const plan_expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Update payment status
    db.run(
      `UPDATE payments SET status = 'confirmed', confirmed_at = ? WHERE id = ?`,
      [confirmed_at, payment_id]
    );

    // Activate user plan
    db.run(
      `UPDATE users SET plan = ?, plan_status = 'active', plan_started = ?, plan_expires = ? WHERE id = ?`,
      [payment.plan, plan_started, plan_expires, payment.user_id]
    );

    // Send notification to user
    db.run(
      `INSERT INTO notifications (user_id, message, type, created_at) VALUES (?, ?, ?, ?)`,
      [
        payment.user_id,
        `🎉 Your ${PLANS[payment.plan].name} has been activated! Valid for 30 days.`,
        'success',
        confirmed_at
      ]
    );

    res.json({ message: '✅ Payment confirmed and plan activated!' });
  });
}

// GET ALL PAYMENTS (admin)
function getAllPayments(req, res) {
  db.all(
    `SELECT p.*, u.full_name, u.email, u.phone
     FROM payments p
     JOIN users u ON p.user_id = u.id
     ORDER BY p.submitted_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
}

// CHECK EXPIRED PLANS
function checkExpiredPlans() {
  const now = new Date().toISOString();
  db.all(
    `SELECT * FROM users WHERE plan_status = 'active' AND plan_expires < ?`,
    [now],
    (err, users) => {
      if (err) return;
      users.forEach(user => {
        db.run(`UPDATE users SET plan_status = 'expired' WHERE id = ?`, [user.id]);
        db.run(
          `INSERT INTO notifications (user_id, message, type, created_at) VALUES (?, ?, ?, ?)`,
          [
            user.id,
            '⚠️ Your plan has expired! Please renew to continue using Habesha AI.',
            'warning',
            now
          ]
        );
      });
    }
  );
}

module.exports = { submitPayment, confirmPayment, getAllPayments, checkExpiredPlans, PLANS };