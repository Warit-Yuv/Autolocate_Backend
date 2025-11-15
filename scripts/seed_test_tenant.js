import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { adminPool } from '../db.js'

dotenv.config()

async function seed() {
  const username = process.env.SEED_TENANT_USERNAME || 'root'
  const password = process.env.SEED_TENANT_PASSWORD || 'root'
  const first_name = process.env.SEED_TENANT_FIRST_NAME || 'Test'
  const last_name = process.env.SEED_TENANT_LAST_NAME || 'Tenant'

  try {
    const saltRounds = 10
    const hash = await bcrypt.hash(password, saltRounds)

    const [existing] = await adminPool.execute('SELECT tenant_id FROM Tenant WHERE username = ?', [username])
    if (existing && existing.length > 0) {
      console.log(`Tenant with username '${username}' already exists (tenant_id=${existing[0].tenant_id}).`)
      process.exit(0)
    }

    const [result] = await adminPool.execute(
      'INSERT INTO Tenant (username, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)',
      [username, hash, first_name, last_name]
    )
    console.log('Inserted test tenant:', { tenant_id: result.insertId, username })
    process.exit(0)
  } catch (err) {
    console.error('Error seeding test tenant:', err)
    process.exit(1)
  }
}

seed()
