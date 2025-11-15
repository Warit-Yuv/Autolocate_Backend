import express from 'express'
import bcrypt from 'bcrypt'
import { tenantPool, adminPool } from '../db.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.status(401).send('Unauthorized access to tenant endpoint.');
});

router.get('/auth', (req, res) => {
    res.status(200).send('Tenant auth GET endpoint.');
});

// Tenant login (uses tenant DB user)
router.post('/auth', async (req, res) => {
    const { username, password } = req.body || {}
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing username or password' })
    }
    console.log(`Tenant login attempt for username: ${username}`);
    console.log(`Password provided: ${password}`);
    try {
        // const [rows] = await tenantPool.execute(
        //     'SELECT tenant_id, username, password_hash, first_name, last_name FROM Tenant WHERE username = ?',
        //     [username]
        // )
        // if (!rows || rows.length === 0) {
        //     return res.status(401).json({ error: 'Invalid credentials' })
        // }
        // const user = rows[0]
        // const match = await bcrypt.compare(password, user.password_hash)
        // if (!match) {
        //     return res.status(401).json({ error: 'Invalid credentials' })
        // }
        // Successful authentication - do not return password_hash
        return res.status(200).json({
            message: 'Authenticated',
            user: { tenant_id: user.tenant_id, username: user.username, first_name: user.first_name, last_name: user.last_name },
        })
    } catch (err) {
        console.error('Tenant auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// Tenant registration - creates new tenant (use adminPool to perform the INSERT)
router.post('/register', async (req, res) => {
    const { username, password, first_name = null, last_name = null, email = null } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        // Check existing username
        const [existing] = await tenantPool.execute('SELECT tenant_id FROM Tenant WHERE username = ?', [username])
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Username already taken' })

        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds)

        // Use adminPool to insert new tenant (assumes admin DB user can INSERT into Tenant)
        const [result] = await adminPool.execute(
            'INSERT INTO Tenant (username, password_hash, first_name, last_name, email) VALUES (?, ?, ?, ?, ?)',
            [username, hash, first_name, last_name, email]
        )
        const insertId = result.insertId || null
        return res.status(201).json({ message: 'Tenant created', tenant_id: insertId, username })
    } catch (err) {
        console.error('Tenant register error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

export default router