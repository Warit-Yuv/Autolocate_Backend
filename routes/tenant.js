import express from 'express'
import bcrypt from 'bcrypt'
import { tenantPool, adminPool } from '../db.js'
import { issueToken, jwtAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.status(401).send('Unauthorized access to tenant endpoint.');
});

router.get('/auth', (req, res) => {
    res.status(200).send('Tenant auth GET endpoint.');
});

//test if DB connection works - typing /api/tenant/test-db-connection should return success message
router.get('/test-db-connection', async (req, res) => {
    try {
        const [rows] = await tenantPool.execute('SELECT 1');
        res.status(200).json({ message: 'Database connection successful', rows });
    } catch (err) {
        console.error('Database connection test failed:', err);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

//try select * from Tenant table - typing /api/tenant/tenants should return all tenants
router.get('/tenants', async (req, res) => {
    try {
        const [rows] = await tenantPool.execute('SELECT * FROM Tenant');
        res.status(200).json({ tenants: rows });
    } catch (err) {
        console.error('Error fetching tenants:', err);
        res.status(500).json({ error: 'Error fetching tenants' });
    }
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
        const [rows] = await tenantPool.execute(
            'SELECT tenant_id, username, password_hash, first_name, last_name FROM Tenant WHERE username = ?',
            [username]
        )
        if (!rows || rows.length === 0) {
            console.log(`No user found with username: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        const user = rows[0]
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) {
            console.log(`Password mismatch for username: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        // Successful authentication - issue JWT cookie and return user info
        console.log(`Tenant '${username}' authenticated successfully.`);
        issueToken(res, { sub: user.tenant_id, role: 'tenant' })
        return res.status(200).json({
            message: 'Authenticated',
            user: { tenant_id: user.tenant_id, username: user.username, first_name: user.first_name, last_name: user.last_name },
        })
    } catch (err) {
        console.error('Tenant auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})


export default router