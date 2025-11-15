import express from 'express'
import bcrypt from 'bcrypt'
import { adminPool } from '../db.js'

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
        return res.status(200).json({ message: 'Authenticated (admin)', user: { staff_id: user.staff_id, username: user.username } })
    } catch (err) {
        console.error('Admin auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
