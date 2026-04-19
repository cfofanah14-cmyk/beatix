import fs from 'fs'
import path from 'path'
import { pool } from './client'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('🔄 Running Beatix database migrations...')
  const client = await pool.connect()
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
    await client.query(sql)
    console.log('✅ Schema applied successfully')
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
