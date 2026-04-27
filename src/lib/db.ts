import mysql from "mysql2/promise";
import { ensureSchema } from "./schema";

declare global {
  var __ssPool: mysql.Pool | undefined;
  var __ssSchemaReady: Promise<void> | undefined;
}

function createPool(): mysql.Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return mysql.createPool({
    uri: url,
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
    dateStrings: false,
    timezone: "Z",
  });
}

export function getPool(): mysql.Pool {
  if (!global.__ssPool) {
    global.__ssPool = createPool();
  }
  return global.__ssPool;
}

/**
 * Runs ensureSchema() once per Node process the first time the pool is used.
 * On failure the cached promise is cleared so the next request retries.
 */
function schemaReady(): Promise<void> {
  if (!global.__ssSchemaReady) {
    global.__ssSchemaReady = ensureSchema(getPool()).catch((err) => {
      console.error("[db] schema bootstrap failed; will retry on next query:", err);
      global.__ssSchemaReady = undefined;
      throw err;
    });
  }
  return global.__ssSchemaReady;
}

/**
 * Methods that hit the database. We await the schema bootstrap before
 * delegating. Other props (config, escape, etc.) pass through untouched.
 */
const ASYNC_DB_METHODS = new Set(["query", "execute", "getConnection"]);

export const pool = new Proxy({} as mysql.Pool, {
  get(_target, prop, receiver) {
    const target = getPool();
    const original = Reflect.get(target, prop, receiver);
    if (
      typeof original === "function" &&
      typeof prop === "string" &&
      ASYNC_DB_METHODS.has(prop)
    ) {
      return async (...args: unknown[]) => {
        await schemaReady();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (original as any).apply(target, args);
      };
    }
    return original;
  },
});
