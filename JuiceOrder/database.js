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
        items TEXT,
        total_packets INTEGER DEFAULT 0,
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

    db.run(`INSERT OR IGNORE INTO users (name, username, password, role) VALUES ('Admin', 'admin', 'nobel2024', 'admin')`);
    db.run(`INSERT OR IGNORE INTO users (name, username, password, role) VALUES ('Sara Employee', 'sara', 'sara123', 'employee')`);

    db.run(`INSERT OR IGNORE INTO trucks (truck_code, driver_name) VALUES ('TRK-001', 'Abebe Kebede')`);
    db.run(`INSERT OR IGNORE INTO trucks (truck_code, driver_name) VALUES ('TRK-002', 'Tadesse Alemu')`);
    db.run(`INSERT OR IGNORE INTO trucks (truck_code, driver_name) VALUES ('TRK-003', 'Girma Haile')`);
    db.run(`INSERT OR IGNORE INTO trucks (truck_code, driver_name) VALUES ('TRK-004', 'Bekele Worku')`);

    db.run(`INSERT OR IGNORE INTO users (name, username, password, role, truck_code) VALUES ('Abebe Kebede', 'abebe', 'drv001', 'driver', 'TRK-001')`);
    db.run(`INSERT OR IGNORE INTO users (name, username, password, role, truck_code) VALUES ('Tadesse Alemu', 'tadesse', 'drv002', 'driver', 'TRK-002')`);
    db.run(`INSERT OR IGNORE INTO users (name, username, password, role, truck_code) VALUES ('Girma Haile', 'girma', 'drv003', 'driver', 'TRK-003')`);
    db.run(`INSERT OR IGNORE INTO users (name, username, password, role, truck_code) VALUES ('Bekele Worku', 'bekele', 'drv004', 'driver', 'TRK-004')`);

});

module.exports = db;s