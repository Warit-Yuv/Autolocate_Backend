import express from 'express'
import bcrypt from 'bcrypt'
import { tenantPool, staffPool, adminPool } from '../db.js'
import { issueToken, jwtAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Staff login (uses staff DB user)
router.post('/auth', async (req, res) => {
    const { username, password } = req.body || {}
    console.log(`Staff login attempt for username: ${username}`);
    console.log(`Password provided: ${password}`);
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        const [rows] = await staffPool.execute(
            'SELECT staff_id, username, password_hash, first_name, last_name, access_level, is_Active FROM Staff WHERE username = ?',
            [username]
        )
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
        const user = rows[0]

        if (!user.is_Active) {
            console.log(`Staff ${username} is not active.`);
            return res.status(403).json({ error: 'Account is inactive' });
        }

        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) return res.status(401).json({ error: 'Invalid credentials' })
        console.log(`Login successful for username: ${username}`);
        // Issue token with staff role. This sets an HttpOnly cookie via issueToken.
        // For testing convenience we may also include the token in the response body when
        // NODE_ENV !== 'production' or JWT_SEND_IN_BODY=true. In production we still only use the cookie.
        const token = issueToken(res, { sub: user.staff_id, role: 'staff' })
        console.log(`Issued token for staff_id: ${user.staff_id}`);
        const sendTokenInBody = process.env.JWT_SEND_IN_BODY === 'true' || process.env.NODE_ENV !== 'production'
        const responsePayload = {
            message: 'Authenticated (staff)',
            user: { staff_id: user.staff_id, username: user.username, access_level: user.access_level, first_name: user.first_name, last_name: user.last_name, position: user.position }
        }
        if (sendTokenInBody) responsePayload.token = token
        return res.status(200).json(responsePayload)
    } catch (err) {
        console.error('Staff auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

//try select * from Tenant table - typing /api/tenant/tenants should return all tenants
router.get('/tenants', jwtAuth, requireRole('staff', 'admin', 'super-admin'), async (req, res) => {
    try {
        const [rows] = await tenantPool.execute('SELECT * FROM Tenant');
        res.status(200).json({ tenants: rows });
    } catch (err) {
        console.error('Error fetching tenants:', err);
        res.status(500).json({ error: 'Error fetching tenants' });
    }
});

// Retrieve parking log (staff only)
// https://testapi.notonoty.me/api/staff/parking_log_search
router.post('/parking_log_search', jwtAuth, requireRole('staff', 'admin', 'super-admin'), async (req, res) => {
    console.log('Received parking log search request with body:', req.body);
    try {
        const [rows] = await staffPool.execute(
            `SELECT 
                     Date(ps.recorded_time) as rec_date,
                     Time(ps.recorded_time) as rec_time,
                     ps.parking_log_id,
                     ps.scanned_RFID_TID as CarID,
                     rt.license_number as car_license_no
                     FROM parking_log ps JOIN rfid_tag rt
                     on rt.RFID_TID= ps.scanned_RFID_TID;`
        );
        res.status(200).json({ car_log: rows });
    } catch (err) {
        console.error('Error fetching tenants:', err);
        res.status(500).json({ error: 'Error fetching parking log' });
    }
});

// Staff dashboard data
// https://testapi.notonoty.me/api/staff/dashboard
router.post('/dashboard', jwtAuth, requireRole('staff', 'admin', 'super-admin'), async (req, res) => {
    try {
        console.log('Fetching dashboard data for staff');
        const [rows] = await staffPool.execute('SELECT rt.tag_status,count(rt.RFID_TID) as count_num FROM RFID_Tag rt where rt.tag_type="Guest" Group by tag_status ');
        res.status(200).json({ dashboard: rows });
    } catch (err) {
        console.error('Error fetching tenants:', err);
        res.status(500).json({ error: 'Error fetching parking log' });
    }
});

router.post('/guest_management', jwtAuth, requireRole('staff', 'admin', 'super-admin'), async (req, res) => {
    console.log('Received guest management request with body:', req.body);
    const { license_number, brand, model, color, firstname, lastname, gender, note, room_id, guest_RFID_TID, visit_EPC, staff_id } = req.body || {};

    if (!license_number || !brand || !model || !color || !firstname || !lastname || !gender) {
        return res.status(400).json({ error: 'Please fill all required information' });
    }

    try {
        const [carCheck] = await staffPool.execute(
            'SELECT license_number FROM car WHERE license_number = ?',
            [license_number]
        );

        if (carCheck.length === 0) {
            await staffPool.execute(
                `INSERT INTO car (license_number, brand, model, color,staff_id)
             VALUES (?, ?, ?, ?,?)`,
                [license_number, brand, model, color,staff_id]
            );
            console.log(`Car inserted: ${license_number}`);
        } else {
            console.log(`Car already exists: ${license_number}`);
        }

        const [guestInsert] = await staffPool.execute(
            `INSERT INTO guest_visit 
            (guest_first_name, guest_last_name, guest_gender, check_in_time, 
             note, room_id, license_number, guest_RFID_TID, visit_EPC, staff_id)
           VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)
          `,
            [firstname, lastname, gender, note || '', room_id, license_number, guest_RFID_TID, visit_EPC, staff_id]
        );

        console.log(`Guest visit inserted: id = ${guestInsert.insertId}`);

        return res.status(200).json({
            message: 'Guest visit saved successfully',
            car_exists: carCheck.length > 0 ? true : false,
            guest_visit_id: guestInsert.insertId
        });
    } catch (err) {
        console.error('Guest Management Insert Error:', err);
        return res
            .status(500)
            .json({ error: 'Server error while saving guest visit' });
    }
});

// Retrieve parking slots by floor (staff only)
// https://testapi.notonoty.me/api/staff/slots_by_floor
// Request body: { floor: '1' }
router.post('/slots_by_floor', jwtAuth, requireRole('staff', 'admin', 'super-admin'), async (req, res) => {
    const { floor } = req.body;

    if (!floor) return res.status(400).json({ error: 'floor is required' });

    try {
        // Query slots on the floor
        const [slots] = await staffPool.execute(
            `SELECT ps.parking_slot_id, ps.floor, ps.slot_type, 
                    latest.license_number 
             FROM parking_slot ps
             LEFT JOIN (
                 SELECT pl.parking_slot_id, rt.license_number
                 FROM parking_log pl
                 JOIN rfid_tag rt ON rt.RFID_TID = pl.scanned_RFID_TID
                 WHERE pl.recorded_time = (
                     SELECT MAX(recorded_time) FROM parking_log pl2 WHERE pl2.parking_slot_id = pl.parking_slot_id
                 )
             ) AS latest ON latest.parking_slot_id = ps.parking_slot_id
             WHERE ps.floor = ?`,
            [floor]
        );

        res.status(200).json({ slots });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching slots' });
    }
});

router.post('/parking_slot_scan', jwtAuth, requireRole('staff', 'admin', 'super-admin'), async (req, res) => {
    const { slotId, tid, epc, note } = req.body;
    const staffId = req.user.staff_id;

    if (!slotId || !tid || !epc) return res.status(400).json({ error: 'Missing required fields' });

    try {
        await staffPool.execute(
            `INSERT INTO Parking_Log 
                (recorded_time, note, scanned_RFID_TID, scanned_EPC, parking_slot_ID, staff_id)
             VALUES (NOW(), ?, ?, ?, ?, ?)`,
            [note || 'Vehicle matches slot.', tid, epc, slotId, staffId]
        );

        res.status(200).json({ message: 'Parking log inserted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error inserting parking log' });
    }
});


export default router
