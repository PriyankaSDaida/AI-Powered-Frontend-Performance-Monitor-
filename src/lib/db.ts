import Database from 'better-sqlite3';
import path from 'path';

// Establish connection to SQLite database
// In next.js dev mode, this might re-connect frequently, but for MVP it's defined.
// Using a file in the project root.
const dbPath = path.join(process.cwd(), 'monitoring.db');
const db = new Database(dbPath);

// Initialize Schema
const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      appId TEXT,
      type TEXT, -- 'vital', 'error', 'navigation'
      timestamp INTEGER,
      payload TEXT, -- JSON string of the details
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as int))
    );
    CREATE INDEX IF NOT EXISTS idx_events_appId_type ON events(appId, type);
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
  `);
};

initDb();

export interface IEvent {
  id: string;
  appId: string;
  type: string;
  timestamp: number;
  payload: any;
}

export function saveEvent(event: IEvent) {
  const stmt = db.prepare(`
    INSERT INTO events (id, appId, type, timestamp, payload)
    VALUES (@id, @appId, @type, @timestamp, @payload)
  `);
  
  stmt.run({
    ...event,
    payload: JSON.stringify(event.payload) // Store payload as JSON string
  });
}

export function getEvents(appId: string, limit = 100) {
  const stmt = db.prepare(`
    SELECT * FROM events 
    WHERE appId = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  const rows = stmt.all(appId, limit) as any[];
  return rows.map(row => ({
    ...row,
    payload: JSON.parse(row.payload)
  }));
}

export function getStats(appId: string) {
    const errorCountStmt = db.prepare(`
        SELECT COUNT(*) as count FROM events WHERE appId = ? AND type = 'error'
    `);
    const vitalsStmt = db.prepare(`
        SELECT payload FROM events WHERE appId = ? AND type = 'vital'
    `);

    // Just basic stats for now
    return {
        errorCount: errorCountStmt.get(appId),
        // complex aggregations can be done here or in SQL
    };
}

export default db;
