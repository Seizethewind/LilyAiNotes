import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

interface SqliteStatement {
  all(...params: unknown[]): Record<string, unknown>[];
  get(...params: unknown[]): Record<string, unknown> | undefined;
  run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (location: string) => SqliteDatabase;
};

class SqlitePreparedStatement {
  constructor(
    private readonly db: SqliteDatabase,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    const normalized = values.map((v) => (v === undefined ? null : v));
    return new SqlitePreparedStatement(this.db, this.sql, normalized) as unknown as D1PreparedStatement;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...(this.params as never[])) as Record<string, unknown> | undefined;
    if (!row) return null;
    if (colName) return (row[colName] ?? null) as T | null;
    return { ...row } as T;
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const rows = this.db.prepare(this.sql).all(...(this.params as never[]));
    return {
      results: rows.map((r) => ({ ...r }) as T),
      success: true,
      meta: { duration: 0, changes: 0, last_row_id: 0, changed_db: false, size_after: 0, rows_read: rows.length, rows_written: 0 },
    } as D1Result<T>;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    const res = this.db.prepare(this.sql).run(...(this.params as never[]));
    return {
      results: [],
      success: true,
      meta: { duration: 0, changes: Number(res.changes), last_row_id: Number(res.lastInsertRowid), changed_db: Number(res.changes) > 0, size_after: 0, rows_read: 0, rows_written: Number(res.changes) },
    } as D1Result<T>;
  }

  executeSync(): D1Result<unknown> {
    const res = this.db.prepare(this.sql).run(...(this.params as never[]));
    return {
      results: [],
      success: true,
      meta: { duration: 0, changes: Number(res.changes), last_row_id: Number(res.lastInsertRowid), changed_db: Number(res.changes) > 0, size_after: 0, rows_read: 0, rows_written: Number(res.changes) },
    } as D1Result<unknown>;
  }
}

export function createMockD1(): D1Database {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  const migration1 = readFileSync(resolve(process.cwd(), "migrations/0001_initial_schema.sql"), "utf-8");
  const migration2 = readFileSync(resolve(process.cwd(), "migrations/0002_classification_and_keys.sql"), "utf-8");
  const migration3 = readFileSync(resolve(process.cwd(), "migrations/0003_api_key_project_scope.sql"), "utf-8");
  sqlite.exec(migration1);
  sqlite.exec(migration2);
  sqlite.exec(migration3);

  const mock = {
    prepare(sql: string) {
      return new SqlitePreparedStatement(sqlite, sql) as unknown as D1PreparedStatement;
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      sqlite.exec("BEGIN IMMEDIATE;");
      try {
        const results = statements.map((stmt) => (stmt as unknown as SqlitePreparedStatement).executeSync() as D1Result<T>);
        sqlite.exec("COMMIT;");
        return results;
      } catch (err) {
        sqlite.exec("ROLLBACK;");
        throw err;
      }
    },
    async exec(sql: string) {
      sqlite.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
  return mock as unknown as D1Database;
}
