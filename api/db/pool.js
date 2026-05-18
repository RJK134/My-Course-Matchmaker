const { Pool } = require("pg");
require("dotenv").config();

// Fly.io's `fly postgres attach` only sets DATABASE_URL. If that's all we have,
// derive the discrete DB_* vars from it so the rest of the API can stay
// untouched. Honours explicit DB_HOST if the user has already wired them.
if (process.env.DATABASE_URL && !process.env.DB_HOST) {
  try {
    const u = new URL(process.env.DATABASE_URL);
    process.env.DB_HOST = u.hostname;
    process.env.DB_PORT = u.port || "5432";
    process.env.DB_USER = decodeURIComponent(u.username);
    process.env.DB_PASSWORD = decodeURIComponent(u.password);
    process.env.DB_NAME = u.pathname.replace(/^\//, "");
  } catch (err) {
    console.warn("[pool] DATABASE_URL set but unparseable:", err.message);
  }
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Fly Postgres requires SSL in production. Allow self-signed certs since
  // Fly's internal cert chain isn't in the default trust store.
  ssl: process.env.PGSSL === "true" || process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("[pool] unexpected database error:", err.message);
  // Don't crash; the route will surface the error to the client.
});

module.exports = pool;
