/* eslint-disable */
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./habesha.db');

db.serialize(() => {

  // USERS TABLE
    db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password TEXT NOT NULL,
        plan TEXT DEFAULT 'none',
        plan_status TEXT DEFAULT 'inactive',
        plan_started TEXT,
        plan_expires TEXT,
        language TEXT DEFAULT 'english',
        role TEXT DEFAULT 'user',
        created_at TEXT NOT NULL
    )
    `);

  // PAYMENTS TABLE
    db.run(`
    CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        transaction_ref TEXT,
        status TEXT DEFAULT 'pending',
        submitted_at TEXT NOT NULL,
        confirmed_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `);

  // AI CONVERSATIONS TABLE
    db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `);

  // GENERATED IMAGES TABLE
    db.run(`
    CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        image_url TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `);

  // NOTIFICATIONS TABLE
    db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    `);

  // CREATE DEFAULT ADMIN
    const adminPassword = bcrypt.hashSync('habesha_admin_2024', 10);
    db.run(`
    INSERT OR IGNORE INTO users
    (full_name, email, phone, password, plan, plan_status, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
    'Admin',
    'admin@habeshaai.com',
    '0911000000',
    adminPassword,
    'pro',
    'active',
    'admin',
    new Date().toISOString()
    ]);

});

module.exports = db;