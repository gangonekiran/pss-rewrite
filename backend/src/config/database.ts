import sql from "mssql";

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

  console.log("✅ SQL Server Connected");

  return pool;
}

export async function getPool() {
  if (!pool) {
    await connectDB();
  }

  return pool;
}

export { sql };