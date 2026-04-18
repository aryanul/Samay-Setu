import mysql from "mysql2/promise";

declare global {
  var __ssPool: mysql.Pool | undefined;
}

function createPool() {
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

export const pool: mysql.Pool = global.__ssPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__ssPool = pool;
}
