/* eslint-disable */
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./orders.db');

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL,
        juice_type TEXT NOT NULL,
        size TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        order_date TEXT NOT NULL
    )
    `);
});

module.exports = db;