/* eslint-disable */
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─── CUSTOMER ───────────────────────────────────────────

app.post('/order', (req, res) => {
    const { shop_name, phone, location, latitude, longitude, items, total_packets, total_bottles, total_price, payment_method } = req.body;
    const order_date = new Date().toLocaleString();
    const itemsJSON = JSON.stringify(items || []);
    db.run(
    `INSERT INTO orders (shop_name, phone, location, latitude, longitude, items, total_packets, total_bottles, total_price, payment_method, status, order_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
    [shop_name, phone, location, latitude, longitude, itemsJSON, total_packets, total_bottles, total_price, payment_method, order_date],
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Order placed successfully!', id: this.lastID });
    }
    );
});

app.get('/orders', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
    });
});

// ─── AUTH ────────────────────────────────────────────────

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(
    `SELECT * FROM users WHERE username = ? AND password = ?`,
    [username, password],
    (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid username or password' });
        res.json({
        message: 'Login successful',
        user: { id: row.id, name: row.name, role: row.role, truck_code: row.truck_code }
        });
    }
    );
});

// ─── ADMIN / EMPLOYEE ────────────────────────────────────

app.get('/admin/orders', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY status ASC, order_date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
    });
});

app.get('/trucks', (req, res) => {
  db.all(`SELECT * FROM trucks`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
    });
});

app.post('/trucks', (req, res) => {
    const { truck_code, driver_name } = req.body;
    db.run(
    `INSERT INTO trucks (truck_code, driver_name, status) VALUES (?, ?, 'Available')`,
    [truck_code, driver_name],
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Truck added!', id: this.lastID });
    }
    );
});

app.post('/assign', (req, res) => {
    const { order_ids, truck_code } = req.body;
    const placeholders = order_ids.map(() => '?').join(',');
    db.run(
    `UPDATE orders SET assigned_truck = ?, status = 'Assigned' WHERE id IN (${placeholders})`,
    [truck_code, ...order_ids],
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `✅ Orders assigned to ${truck_code}` });
    }
    );
});

app.post('/deliver/:id', (req, res) => {
    db.run(
    `UPDATE orders SET status = 'Delivered' WHERE id = ?`,
    [req.params.id],
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Marked as delivered!' });
    }
    );
});

// Add employee or driver
app.post('/users', (req, res) => {
    const { name, username, password, role, truck_code } = req.body;
    db.run(
    `INSERT INTO users (name, username, password, role, truck_code) VALUES (?, ?, ?, ?, ?)`,
    [name, username, password, role, truck_code || null],
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ User added successfully!' });
    }
    );
});

// Get all users
app.get('/users', (req, res) => {
    db.all(`SELECT id, name, username, role, truck_code FROM users`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
    });
});

// ─── DRIVER ──────────────────────────────────────────────

app.get('/driver/:truck_code', (req, res) => {
    db.all(
    `SELECT * FROM orders WHERE assigned_truck = ? AND status != 'Delivered' ORDER BY id ASC`,
    [req.params.truck_code],
    (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    }
    );
});

app.get('/driver/:truck_code/all', (req, res) => {
    db.all(
    `SELECT * FROM orders WHERE assigned_truck = ? ORDER BY id ASC`,
    [req.params.truck_code],
    (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    }
    );
});

app.listen(3000, () => {
    console.log('✅ Server running at http://localhost:3000');
});