import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[]; rowCount: number }> {
  const res = await pool.query(text, params)
  return { rows: res.rows, rowCount: res.rowCount ?? 0 }
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect()
  try { await client.query('SELECT NOW()') } finally { client.release() }
}

export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
