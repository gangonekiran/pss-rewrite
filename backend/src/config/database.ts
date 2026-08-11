/*import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_SQL_PASSWORD!,
  port: Number(process.env.DB_PORT),

  options: {
    encrypt: true,
    trustServerCertificate: true,
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool;

export async function connectDB() {
  if (pool) {
    return pool;
  }

  pool = await sql.connect(config);

  console.log("SQL Server Connected");

  return pool;
}

export async function getPool() {
  if (!pool) {
    await connectDB();
  }

  return pool;
}

export { sql };*/

import sql from "mssql/msnodesqlv8";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
  server: process.env.DB_SERVER || "",
  database: process.env.DB_DATABASE || "",

  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },

  // This is the actual ODBC driver installed on both environments
  driver: "SQL Server",
};

let pool: sql.ConnectionPool | null = null;

/**
 * Connect to SQL Server using Windows Authentication.
 */
export async function connectDB(): Promise<sql.ConnectionPool> {
  if (pool?.connected) {
    return pool;
  }

  try {
    console.log("Connecting to SQL Server...");
    console.log(`Server: ${config.server}`);
    console.log(`Database: ${config.database}`);
    console.log("Driver: SQL Server");
    console.log("Authentication: Windows Authentication");

    pool = await sql.connect(config);

    console.log("SQL Server connected successfully.");

    return pool;
  } catch (error) {
    pool = null;

    console.error(
      "SQL Server connection failed:",
      error instanceof Error ? error.message : error,
    );

    throw error;
  }
}

/**
 * Get the active SQL Server connection pool.
 */
export function getPool(): sql.ConnectionPool {
  if (!pool || !pool.connected) {
    throw new Error(
      "Database is not connected. Call connectDB() first.",
    );
  }

  return pool;
}

/**
 * Alias for getPool().
 *
 * Can be used by newer modules.
 */
export function getDb(): sql.ConnectionPool {
  return getPool();
}

/**
 * Close SQL Server connection.
 */
export async function closeDB(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;

    console.log("SQL Server connection closed.");
  }
}

export { sql };