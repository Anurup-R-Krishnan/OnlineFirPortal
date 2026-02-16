"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let db = null;
function getDatabaseDriver() {
    const isBun = typeof process.versions?.bun !== 'undefined';
    if (isBun) {
        const bunSqlite = require('bun:sqlite');
        return bunSqlite.Database;
    }
    const betterSqlite3 = require('better-sqlite3');
    return betterSqlite3.default || betterSqlite3;
}
function getDatabase() {
    if (db)
        return db;
    const dataDir = path_1.default.join(process.cwd(), 'data');
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = process.env.DATABASE_PATH
        ? path_1.default.resolve(process.env.DATABASE_PATH)
        : path_1.default.join(dataDir, 'firs.db');
    const DatabaseDriver = getDatabaseDriver();
    db = new DatabaseDriver(dbPath);
    if (!db.prepare && typeof db.query === 'function') {
        db.prepare = db.query.bind(db);
    }
    // performance optimizations
    if (typeof db.pragma === 'function') {
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        db.pragma('foreign_keys = ON');
    }
    else if (typeof db.exec === 'function') {
        db.exec('PRAGMA journal_mode = WAL;');
        db.exec('PRAGMA synchronous = NORMAL;');
        db.exec('PRAGMA foreign_keys = ON;');
    }
    return db;
}
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
//# sourceMappingURL=database-connection.js.map