/* eslint-disable */
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./orders.db');

db.serialize(() => {

    db.run(`
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        location TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        juice_type TEXT NOT NULL,
        size TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total_bottles INTEGER NOT NULL,
        total_price REAL NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        assigned_truck TEXT DEFAULT NULL,
        order_date TEXT NOT NULL
    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'employee',
        truck_code TEXT DEFAULT NULL
    )
    `);

    db.run(`
    CREATE TABLE IF NOT EXISTS trucks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        truck_code TEXT UNIQUE NOT NULL,
        driver_name TEXT NOT NULL,
        status TEXT DEFAULT 'Available'
    )
    `);

  // Default admin
    db.run(`
    INSERT OR IGNORE INTO users (name, username, password, role)
    VALUES ('Admin', 'admin', 'nobel2024', 'admin')
    `);

  // Default employee
    db.run(`
    INSERT OR IGNORE INTO users (name, username, password, role)
    VALUES ('Sara Employee', 'sara', 'sara123', 'employee')
    `);

  // Default trucks
    db.run(`INSERT OR IGNORE INTO trucks (truck_