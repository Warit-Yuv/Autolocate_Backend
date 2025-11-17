import express from 'express'
import bcrypt from 'bcrypt'
import { tenantPool, staffPool, adminPool } from '../db.js'
import { issueToken, jwtAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.status(401).send('Unauthorized access to tenant endpoint.');
});

router.get('/auth', (req, res) => {
    res.status(401).send('Unauthorized access to tenant endpoint. Use POST to authenticate.');
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
            console.log(`No tenant found with username: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        const user = rows[0]
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) {
            console.log(`Password mismatch for username: ${username}`);
            return res.status(401).json({ error: 'Invalid credentials' })
        }
        // Successful authentication - issue JWT cookie and return tenant info
        console.log(`Tenant '${username}' authenticated successfully.`);
        // issueToken returns the signed token as a convenience
        const token = issueToken(res, { sub: user.tenant_id, role: 'tenant' })
        const sendTokenInBody = process.env.JWT_SEND_IN_BODY === 'true' || process.env.NODE_ENV !== 'production'
        const responsePayload = {
            message: 'Authenticated',
            user: { tenant_id: user.tenant_id, username: user.username, first_name: user.first_name, last_name: user.last_name },
        }
        // For development/testing only (or when explicitly enabled), include token in response so frontend JS can use Authorization header
        if (sendTokenInBody) responsePayload.token = token
        return res.status(200).json(responsePayload)
    } catch (err) {
        console.error('Tenant auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
});

// Tenent retrieve parking slots
// https://testapi.notonoty.me/api/tenant/carlocation with body { "username": "tenant_username" }
router.post('/carlocation', jwtAuth, requireRole('tenant', 'staff', 'admin', 'super-admin'), async (req, res) => {
    console.log('Received car location request with body:', req.body);
    const { username } = req.body || {}
    if (!username) {
        return res.status(400).json({ error: 'Missing username' })
    }
    try {
        const [rows] = await tenantPool.execute(
            `SELECT ps.parking_slot_id as parking_slot_id, ps.floor as floor, c.license_number as license_number
            FROM parking_slot ps
            JOIN parking_log pl ON ps.parking_slot_id = pl.parking_slot_id
            JOIN rfid_tag rt ON pl.scanned_rfid_tid = rt.rfid_tid
            JOIN car c ON rt.license_number = c.license_number
            JOIN condo_room cr ON c.license_number = cr.license_number
            JOIN tenant t ON cr.room_id = t.room_id
            WHERE t.username = ?`, [username]
        );
        res.status(200).json({ carLocations: rows });
    } catch (err) {
        console.error('Error fetching car locations:', err);
        res.status(500).json({ error: 'Error fetching car locations' });
    }
});

// post to retrieve recent vehicale direction status
router.post('/vehicleDirection', jwtAuth, requireRole('tenant', 'staff', 'admin', 'super-admin'), async (req, res) => {
    console.log('Received vehicle direction request with body:', req.body);
    const { license_number } = req.body || {}
    if (!license_number) {
        return res.status(400).json({ error: 'Missing license_number' })
    }
    try {
        const [rows] = await tenantPool.execute(
            `SELECT gad.direction AS vehicleDirection, gad.time_stamp, gad.gate_name,
            gad.scanned_RFID_TID, gad.scanned_EPC, rt.license_number
            FROM gate_arrival_departure gad
            JOIN rfid_tag rt ON gad.scanned_RFID_TID = rt.RFID_TID
            WHERE rt.license_number = ?
            ORDER BY gad.time_stamp DESC LIMIT 1;`, [license_number]
        );
        res.status(200).json({ vehicleDirectionStatus: rows });
    } catch (err) {
        console.error('Error fetching vehicle direction status:', err);
        res.status(500).json({ error: 'Error fetching vehicle direction status' });
    }
});



export default router