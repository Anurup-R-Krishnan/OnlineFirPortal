import path from 'path';
import fs from 'fs';

let db: any = null;

function getDatabaseDriver() {
    const isBun = typeof (process as any).versions?.bun !== 'undefined';
    if (isBun) {
        const bunSqlite = require('bun:sqlite');
        return bunSqlite.Database;
    }

    const betterSqlite3 = require('better-sqlite3');
    return betterSqlite3.default || betterSqlite3;
}

export function getDatabase() {
    if (db) return db;

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = process.env.DATABASE_PATH
        ? path.resolve(process.env.DATABASE_PATH)
        : path.join(dataDir, 'firs.db');
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
    } else if (typeof db.exec === 'function') {
        db.exec('PRAGMA journal_mode = WAL;');
        db.exec('PRAGMA synchronous = NORMAL;');
        db.exec('PRAGMA foreign_keys = ON;');
    }

    return db;
}

export function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
