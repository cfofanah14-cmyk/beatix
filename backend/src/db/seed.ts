import { pool } from './client'
import dotenv from 'dotenv'
dotenv.config()

async function seed() {
  console.log('🌱 Seeding Beatix database...')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Admin user
    await client.query(`
      INSERT INTO users (phone, name, email, role, phone_verified)
      VALUES ('+23276000001','Beatix Admin','admin@beatix.sl','admin',true)
      ON CONFLICT (phone) DO NOTHING
    `)

    // Demo organizer user
    const orgUserRes = await client.query(`
      INSERT INTO users (phone, name, email, role, phone_verified)
      VALUES ('+23276000002','Sierra Live','sierralive@beatix.sl','organizer',true)
      ON CONFLICT (phone) DO NOTHING RETURNING id
    `)

    // Demo buyer
    await client.query(`
      INSERT INTO users (phone, name, role, phone_verified)
      VALUES ('+23276000003','Aminata Koroma','buyer',true)
      ON CONFLICT (phone) DO NOTHING
    `)

    if (orgUserRes.rows.length > 0) {
      const orgRes = await client.query(`
        INSERT INTO organizers (user_id, org_name, description, status, verified_at)
        VALUES ($1,'Sierra Live Entertainment','Premier event organizer in Sierra Leone','approved',NOW())
        ON CONFLICT (user_id) DO NOTHING RETURNING id
      `, [orgUserRes.rows[0].id])

      if (orgRes.rows.length > 0) {
        const orgId = orgRes.rows[0].id
        const events = [
          { title: 'Freetown Vibes Fest 2025', category: 'Music', venue: 'Lumley Beach', days: 7,  tickets: [{ name:'VIP', price:150, cap:200 },{ name:'Regular', price:50, cap:1000 }] },
          { title: 'Big Afrobeats Night',       category: 'Music', venue: 'Aberdeen Bar & Grill', days: 14, tickets: [{ name:'VIP Table', price:200, cap:50 },{ name:'Regular', price:80, cap:300 }] },
          { title: 'Krio Comedy Show',           category: 'Comedy', venue: 'City Hall', days: 21, tickets: [{ name:'VIP', price:80, cap:100 },{ name:'Regular', price:45, cap:400 }] },
        ]
        for (const ev of events) {
          const evRes = await client.query(`
            INSERT INTO events (organizer_id,title,category,venue_name,starts_at,status)
            VALUES ($1,$2,$3,$4,$5,'published') RETURNING id
          `, [orgId, ev.title, ev.category, ev.venue, new Date(Date.now() + ev.days * 86400000)])
          for (let i = 0; i < ev.tickets.length; i++) {
            const tt = ev.tickets[i]
            await client.query(`
              INSERT INTO ticket_types (event_id,name,price,capacity,sort_order)
              VALUES ($1,$2,$3,$4,$5)
            `, [evRes.rows[0].id, tt.name, tt.price, tt.cap, i])
          }
        }
      }
    }

    await client.query('COMMIT')
    console.log('✅ Seed complete')
  } catch (err: any) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
