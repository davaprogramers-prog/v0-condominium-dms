import postgres from "postgres"
import { readFileSync } from "node:fs"

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
if (!connectionString) {
  console.error("Missing POSTGRES_URL_NON_POOLING / POSTGRES_URL")
  process.exit(1)
}

const file = process.argv[2]
if (!file) {
  console.error("Usage: node run-migration.mjs <sql-file>")
  process.exit(1)
}

const sql = readFileSync(file, "utf8")
const client = postgres(connectionString, { prepare: false })

try {
  await client.unsafe(sql)
  console.log(`[migration] Applied: ${file}`)
} catch (err) {
  console.error("[migration] Failed:", err)
  process.exit(1)
} finally {
  await client.end()
}
