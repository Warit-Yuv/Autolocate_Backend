import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

const DB_Config_common = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  database: process.env.DB_NAME || 'CondoParkingDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

export const adminPool = mysql.createPool({
  ...DB_Config_common,
  user: process.env.ADMIN_DB_USER || 'adminpool',
  password: process.env.ADMIN_DB_PASS || 'admin_secure_password1',
})

export const staffPool = mysql.createPool({
  ...DB_Config_common,
  user: process.env.STAFF_DB_USER || 'staffpool',
  password: process.env.STAFF_DB_PASS || 'staff_secure_password1',
})

export const tenantPool = mysql.createPool({
  ...DB_Config_common,
  user: process.env.TENANT_DB_USER || 'tenantpool',
  password: process.env.TENANT_DB_PASS || 'tenant_secure_password1',
})

export default { adminPool, staffPool, tenantPool }
