import express from 'express'
import bcrypt from 'bcrypt'
import { staffPool } from '../db.js'
import { issueToken } from '../middleware/auth.js'

const router = express.Router()

// Staff login (uses staff DB user)
router.post('/auth', async (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        const [rows] = await staffPool.execute(
            'SELECT staff_id, username, password_hash, first_name, last_name, access_level FROM Staff WHERE username = ?',
            [username]
        )
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
        const user = rows[0]
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) return res.status(401).json({ error: 'Invalid credentials' })
        // Issue token with staff role
        issueToken(res, { sub: user.staff_id, role: 'staff' })
        return res.status(200).json({ message: 'Authenticated (staff)', user: { staff_id: user.staff_id, username: user.username, access_level: user.access_level } })
    } catch (err) {
        console.error('Staff auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router
