import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const common = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  database: process.env.DB_NAME || 'CondoParkingDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

export const adminPool = mysql.createPool({
  ...common,
  user: process.env.ADMIN_DB_USER || 'admin_user',
  password: process.env.ADMIN_DB_PASS || 'admin_pass',
})

export const staffPool = mysql.createPool({
  ...common,
  user: process.env.STAFF_DB_USER || 'staff_user',
  password: process.env.STAFF_DB_PASS || 'staff_pass',
})

export const tenantPool = mysql.createPool({
  ...common,
  user: process.env.TENANT_DB_USER || 'tenant_user',
  password: process.env.TENANT_DB_PASS || 'tenant_pass',
})

export default { adminPool, staffPool, tenantPool }
