const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { getConfig } = require("../config");

const databasePath = path.resolve(getConfig().dbPath);
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");
db.pragma("journal_mode = WAL");

console.log("Banco de dados conectado.");

module.exports = db;
