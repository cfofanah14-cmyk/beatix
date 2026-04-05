import { pool } from './client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

async function seed() {
  console.log('🌱 Seeding Beatix database...')
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    // Admin user
    const adminHash = await bcrypt.hash('Admin@Beatix2025', 10)
    const adminRes = await client.query(`
      INSERT INTO users (phone, name, email, role, phone_verified)
      VALUES ('+23276000001', 'Beatix Admin', 'admin@beatix.sl', 'admin', true)
      ON CONFLICT (phone) DO NOTHING
      RETURNING id
    `)

    // Demo organizer user
    const orgUserRes = await client.query(`
      INSERT INTO users (phone, name, email, role, phone_verified)
      VALUES ('+23276000002', 'Sierra Live', 'sierralive@beatix.sl', 'organizer', true)
      ON CONFLICT (phone) DO NOTHING
      RETURNING id
    `)

    // Demo buyer
    await client.query(`
      INSERT INTO users (phone, name, role, phone_verified)
      VALUES ('+23276000003', 'Aminata Koroma', 'buyer', true)
      ON CONFLICT (phone) DO NOTHING
    `)

    if (orgUserRes.rows.length > 0) {
      const orgUserId = orgUserRes.rows[0].id

      // Organizer profile
      const orgRes = await client.query(`
        INSERT INTO organizers (user_id, org_name, description, status, verified_at)
        VALUES ($1, 'Sierra Live Entertainment', 'Premier event organizer in Sierra Leone', 'approved', NOW())
        ON CONFLICT (user_id) DO NOTHING
        RETURNING id
      `, [orgUserId])

      if (orgRes.rows.length > 0) {
        const orgId = orgRes.rows[0].id

        // Sample events
        const events = [
          {
            title: 'Freetown Vibes Fest 2025',
            description: "Sierra Leone's biggest music festival. Top Afrobeats, Afropop, and local artists on the shores of Lumley Beach.",
            category: 'Music',
            venue_name: 'Lumley Beach',
            venue_address: 'Lumley Beach Road, Freetown',
            starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ticket_types: [
              { name: 'VIP', price: 150, capacity: 200 },
              { name: 'Regular', price: 50, capacity: 1000 },
            ],
          },
          {
            title: 'Big Afrobeats Night',
            description: 'A night of non-stop Afrobeats featuring top DJs from across West Africa.',
            category: 'Music',
            venue_name: 'Aberdeen Bar & Grill',
            venue_address: 'Aberdeen, Freetown',
            starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            ticket_types: [
              { name: 'VIP Table', price: 200, capacity: 50 },
              { name: 'Regular', price: 80, capacity: 300 },
            ],
          },
          {
            title: 'Krio Comedy Show',
            description: 'di fines comedy show in Freetown. Laugh until your belly hurts!',
            category: 'Comedy',
            venue_name: 'City Hall',
            venue_address: 'Wallace Johnson Street, Freetown',
            starts_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            ticket_types: [
              { name: 'VIP', price: 80, capacity: 100 },
              { name: 'Regular', price: 45, capacity: 400 },
            ],
          },
        ]

        for (const ev of events) {
          const evRes = await client.query(`
            INSERT INTO events (organizer_id, title, description, category, venue_name, venue_address, starts_at, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,'published')
            RETURNING id
          `, [orgId, ev.title, ev.description, ev.category, ev.venue_name, ev.venue_address, ev.starts_at])

          const eventId = evRes.rows[0].id

          for (let i = 0; i < ev.ticket_types.length; i++) {
            const tt = ev.ticket_types[i]
            await client.query(`
              INSERT INTO ticket_types (event_id, name, price, capacity, sort_order)
              VALUES ($1,$2,$3,$4,$5)
            `, [eventId, tt.name, tt.price, tt.capacity, i])
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
