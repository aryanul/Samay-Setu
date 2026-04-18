import mysql from "mysql2/promise";

declare global {
  var __ssPool: mysql.Pool | undefined;
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

export const pool = new Proxy({} as mysql.Pool, {
  get(_target, prop, receiver) {
    return Reflect.get(getPool(), prop, receiver);
  },
});
