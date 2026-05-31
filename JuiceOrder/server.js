/* eslint-disable */
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// POST - Save a new order
app.post('/order', (req, res) => {
    const { shop_name, juice_type, size, quantity } = req.body;
    const order_date = new Date().toLocaleString();

    db.run(
    `INSERT INTO orders (shop_name, juice_type, size, quantity, order_date
    VALUES (?, ?, ?, ?, ?)`,
    [shop_name, juice_type, size, quantity, order_date],
    function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ Order saved!', id: this.lastID });
    }
    );
});

// GET - View all orders
app.get('/orders', (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY id DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
    });
});

app.listen(3000, () => {
    console.log('✅ Server running at http://localhost:3000');
});