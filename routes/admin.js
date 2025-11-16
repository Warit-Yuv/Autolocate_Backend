import express from 'express'
import bcrypt from 'bcrypt'
import { adminPool } from '../db.js'
import { issueToken, jwtAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Admin login (uses admin DB user). Admins are stored in the Staff table; we check access_level === 'admin'
router.post('/auth', async (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        const [rows] = await adminPool.execute(
            'SELECT staff_id, username, password_hash, first_name, last_name, access_level FROM Staff WHERE username = ?',
            [username]
        )
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
        const user = rows[0]
        if (user.access_level !== 'admin') return res.status(403).json({ error: 'Not an admin' })
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) return res.status(401).json({ error: 'Invalid credentials' })
        // Issue token with admin role
        issueToken(res, { sub: user.staff_id, role: 'admin' })
        return res.status(200).json({ message: 'Authenticated (admin)', user: { staff_id: user.staff_id, username: user.username } })
    } catch (err) {
        console.error('Admin auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// Admin-only: create tenant
router.post('/tenants', jwtAuth, requireRole('admin'), async (req, res) => {
    const { username, password, first_name = null, last_name = null, email = null } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        // check existing
        const [existing] = await adminPool.execute('SELECT tenant_id FROM Tenant WHERE username = ?', [username])
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Username already taken' })
        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds)
        const [result] = await adminPool.execute(
            'INSERT INTO Tenant (username, password_hash, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)',
            [username, hash, first_name, last_name, email]
        )
        return res.status(201).json({ message: 'Tenant created', tenant_id: result.insertId })
    } catch (err) {
        console.error('Admin create tenant error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// Admin-only: create staff
router.post('/staff', jwtAuth, requireRole('admin'), async (req, res) => {
    const { username, password, first_name = null, last_name = null, position = null, access_level = 'staff', is_Active = true } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        // check existing
        const [existing] = await adminPool.execute('SELECT staff_id FROM Staff WHERE username = ?', [username])
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Username already taken' })
        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds)
        const [result] = await adminPool.execute(
            'INSERT INTO Staff (first_name, last_name, position, username, password_hash, access_level, is_Active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, position, username, hash, access_level, is_Active]
        )
        return res.status(201).json({ message: 'Staff created', staff_id: result.insertId })
    } catch (err) {
        console.error('Admin create staff error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
