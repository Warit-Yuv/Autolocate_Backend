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
        console.log('Admin auth login request for username:', username)
        const [rows] = await adminPool.execute(
            'SELECT staff_id, username, password_hash, first_name, last_name, access_level FROM Staff WHERE username = ?',
            [username]
        )
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
        const user = rows[0]
        // Normalize access level from DB and decide role
        const levelRaw = (user.access_level || '').toString().trim().toLowerCase()
        const isSuper = levelRaw.includes('super')
        const isAdmin = levelRaw.includes('admin') || isSuper
        if (!isAdmin) return res.status(403).json({ error: 'Not an admin' })
        const match = await bcrypt.compare(password, user.password_hash)
        if (!match) return res.status(401).json({ error: 'Invalid credentials' })
        // Issue token with role according to access_level (admin or super-admin).
        // Token is set as an HttpOnly cookie by `issueToken`.
        // For testing convenience we may also include the token in the response body when
        // NODE_ENV !== 'production' or JWT_SEND_IN_BODY=true. In production we still only use the cookie.
        const role = isSuper ? 'super-admin' : 'admin'
        const token = issueToken(res, { sub: user.staff_id, role })
        const sendTokenInBody = process.env.JWT_SEND_IN_BODY === 'true' || process.env.NODE_ENV !== 'production'
        const responsePayload = { message: `Authenticated (${role})`, user: { staff_id: user.staff_id, username: user.username, first_name: user.first_name, last_name: user.last_name } }
        if (sendTokenInBody) responsePayload.token = token
        return res.status(200).json(responsePayload)
    } catch (err) {
        console.error('Admin auth error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// Admin-only: create tenant (supports full tenant fields)
// Both admin and super-admin can create tenants
router.post('/tenants', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const { username, password, first_name = null, last_name = null, phone = null, email = null, gender = null, is_primary_contact = null, room_id = null, is_Active } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        console.log('Admin create tenant request by user:', req.user)
        // check existing
        const [existing] = await adminPool.execute('SELECT tenant_id FROM Tenant WHERE username = ?', [username])
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Username already taken' })
        // validate room if provided
        if (room_id !== null && room_id !== undefined) {
            const [roomRows] = await adminPool.execute('SELECT room_id FROM Condo_Room WHERE room_id = ?', [room_id])
            if (!roomRows || roomRows.length === 0) return res.status(400).json({ error: 'Invalid room_id' })
        }
        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds)
        const tenant_status = (is_Active === false || is_Active === 0) ? 'Inactive' : 'Active'
        const [result] = await adminPool.execute(
            'INSERT INTO Tenant (username, password_hash, first_name, last_name, gender, tel_no, email, is_primary_contact, tenant_status, room_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, hash, first_name, last_name, gender, phone, email, is_primary_contact ? 1 : 0, tenant_status, room_id]
        )
        const [rows] = await adminPool.execute('SELECT tenant_id AS tenant_id, username, first_name, last_name, tel_no AS phone, email, tenant_status FROM Tenant WHERE tenant_id = ?', [result.insertId])
        return res.status(201).json({ message: 'Tenant created', tenant: rows[0] })
    } catch (err) {
        console.error('Admin create tenant error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// Admin-only: create staff
router.post('/staff', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const { username, password, first_name = null, last_name = null, position = null, access_level = 'Staff', is_Active = true } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
        console.log('Admin create staff request by user:', req.user)
        // normalize requested access level
        const requested = (access_level || 'staff').toString().trim().toLowerCase()
        const wantsAdmin = requested.includes('admin') || requested === 'super-admin' || requested === 'super admin'
        // If creating admin-level staff, require super-admin role
        if (wantsAdmin && req.user?.role !== 'super-admin') {
            return res.status(403).json({ error: 'Only super-admin can create admin users' })
        }
        // check existing
        const [existing] = await adminPool.execute('SELECT staff_id FROM Staff WHERE username = ?', [username])
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Username already taken' })
        const saltRounds = 10
        const hash = await bcrypt.hash(password, saltRounds)
        // Normalize access_level stored in DB: capitalize properly
        const storeAccess = wantsAdmin ? (requested.includes('super') ? 'Super-Admin' : 'Admin') : 'Staff'
        const [result] = await adminPool.execute(
            'INSERT INTO Staff (first_name, last_name, position, username, password_hash, access_level, is_Active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [first_name, last_name, position, username, hash, storeAccess, is_Active]
        )
        return res.status(201).json({ message: 'Staff created', staff_id: result.insertId })
    } catch (err) {
        console.error('Admin create staff error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// PATCH /staff/:id - update staff fields (first_name, last_name, position, username, password, access_level, is_Active)
// e.g. to change name of user id 7 to 'hiho' : https://testapi.notonoty.me/api/admin/staff/7  with body { "first_name": "hi", "last_name": "ho" }
router.patch('/staff/:id', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const staffId = req.params.id
    const { first_name, last_name, position, username, password, access_level, is_Active } = req.body || {}

    if (
        first_name === undefined && last_name === undefined && position === undefined && username === undefined &&
        password === undefined && access_level === undefined && is_Active === undefined
    ) {
        return res.status(400).json({ error: 'Nothing to update' })
    }

    try {
        console.log(`PATCH /api/admin/staff/${staffId} called by user:`, req.user)
        console.log('Request body:', req.body)
        const [rows] = await adminPool.execute('SELECT staff_id, access_level, username FROM Staff WHERE staff_id = ?', [staffId])
        if (!rows || rows.length === 0) {
            console.warn(`Staff id ${staffId} not found`)
            return res.status(404).json({ error: 'Staff not found' })
        }

        const current = (rows[0].access_level || '').toString().toLowerCase()
        const currentUsername = rows[0].username
        console.log('Current staff record:', { staff_id: rows[0].staff_id, username: currentUsername, access_level: rows[0].access_level })

        // If access_level change requested, apply super-admin guard
        if (access_level !== undefined) {
            console.log(`Attempting to change access_level for staff_id ${staffId} -> ${access_level}`)
            const requested = (access_level || '').toString().toLowerCase()
            const promotingToAdmin = requested.includes('admin')
            // If promoting to admin or modifying an admin, require super-admin
            if (promotingToAdmin || current.includes('admin')) {
                if (req.user?.role !== 'super-admin') return res.status(403).json({ error: 'Only super-admin can modify admin users' })
            }
            const storeAccess = requested.includes('super') ? 'Super-Admin' : (requested.includes('admin') ? 'Admin' : 'Staff')
            console.log(`Updating access_level for staff_id ${staffId} -> ${storeAccess}`)
            await adminPool.execute('UPDATE Staff SET access_level = ? WHERE staff_id = ?', [storeAccess, staffId])
        }

        // Update username if requested (ensure uniqueness)
        if (username !== undefined && username !== currentUsername) {
            console.log(`Attempting to change username for staff_id ${staffId} -> ${username}`)
            const [existing] = await adminPool.execute('SELECT staff_id FROM Staff WHERE username = ? AND staff_id != ?', [username, staffId])
            if (existing && existing.length > 0) {
                console.warn(`Username ${username} already taken`)
                return res.status(409).json({ error: 'Username already taken' })
            }
            await adminPool.execute('UPDATE Staff SET username = ? WHERE staff_id = ?', [username, staffId])
            console.log(`Username updated for staff_id ${staffId}`)
        }

        // Update password if provided (hash it)
        if (password !== undefined) {
            console.log(`Updating password for staff_id ${staffId}`)
            if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
            const saltRounds = 10
            const hash = await bcrypt.hash(password, saltRounds)
            await adminPool.execute('UPDATE Staff SET password_hash = ? WHERE staff_id = ?', [hash, staffId])
            console.log(`Password updated for staff_id ${staffId}`)
        }

        // Update other profile fields
        if (first_name !== undefined) {
            await adminPool.execute('UPDATE Staff SET first_name = ? WHERE staff_id = ?', [first_name, staffId])
            console.log(`first_name updated for staff_id ${staffId}`)
        }
        if (last_name !== undefined) {
            await adminPool.execute('UPDATE Staff SET last_name = ? WHERE staff_id = ?', [last_name, staffId])
            console.log(`last_name updated for staff_id ${staffId}`)
        }
        if (position !== undefined) {
            await adminPool.execute('UPDATE Staff SET position = ? WHERE staff_id = ?', [position, staffId])
            console.log(`position updated for staff_id ${staffId}`)
        }

        // Update is_Active if provided
        if (is_Active !== undefined) {
            const value = (is_Active === true || is_Active === 1) ? 1 : 0
            await adminPool.execute('UPDATE Staff SET is_Active = ? WHERE staff_id = ?', [value, staffId])
            console.log(`is_Active set to ${value} for staff_id ${staffId}`)
        }

        // Return updated row
        const [updatedRows] = await adminPool.execute('SELECT staff_id, first_name, last_name, position, username, access_level, is_Active FROM Staff WHERE staff_id = ?', [staffId])
        console.log('Updated staff record:', updatedRows[0])
        return res.status(200).json({ message: 'Staff updated', staff: updatedRows[0] })
    } catch (err) {
        console.error('Admin modify staff error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})



// Select all staff (admin and super-admin only)
// GET https://testapi.notonoty.me/api/admin/staff-info
router.get('/staff-info', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    try {
        console.log('Admin fetching all staff info')
        const [rows] = await adminPool.execute(`
            SELECT staff_id,
            first_name, last_name,
            position,
            username,
            password_hash,
            access_level,
            is_Active
            FROM Staff
            `)
        res.status(200).json({ staff: rows })
    } catch (err) {
        console.error('Admin get staff error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

// Get single staff by id (admin and super-admin only)
// GET /api/admin/get/staff/:id
router.get('/get/staff/:id', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const staffId = req.params.id
    try {
        console.log(`Admin fetching staff info for staff_id ${staffId}`)
        const [rows] = await adminPool.execute(
            `SELECT staff_id, first_name, last_name, position, username, access_level, is_Active
             FROM Staff WHERE staff_id = ?`,
            [staffId]
        )
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Staff not found' })
        return res.status(200).json({ staff: rows[0] })
    } catch (err) {
        console.error('Admin get single staff error:', err)
        return res.status(500).json({ error: 'Server error' })
    }
})

// List tenants
// GET https://testapi.notonoty.me/api/admin/tenants with
// { "page": 1, "limit": 50, "q": "searchterm", "showInactive": true }
router.get('/tenants', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(200, parseInt(req.query.limit) || 50)
        const offset = (page - 1) * limit
        const q = (req.query.q || '').trim()
        const showInactive = req.query.showInactive === '1' || req.query.showInactive === 'true'

        let where = 'WHERE 1=1'
        const params = []
        if (!showInactive) {
            where += " AND tenant_status = 'Active'"
        }
        if (q) {
            where += ' AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ? )'
            const like = `%${q}%`
            params.push(like, like, like, like)
        }

        const [rows] = await adminPool.execute(
            `SELECT tenant_id AS tenant_id, username, first_name, last_name, gender, tel_no AS phone, email, is_primary_contact, tenant_status, room_id FROM Tenant ${where} ORDER BY tenant_id DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )
        const [[{ total }]] = await adminPool.execute(`SELECT COUNT(*) as total FROM Tenant ${where}`, params)
        res.json({ tenants: rows, total, page, limit })
    } catch (err) {
        console.error('Admin list tenants error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

// Get single tenant
router.get('/tenants/:id', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const tenantId = Number(req.params.id)
    if (!tenantId) return res.status(400).json({ error: 'Invalid tenant id' })
    try {
        const [rows] = await adminPool.execute('SELECT tenant_id, username, first_name, last_name, gender, tel_no AS phone, email, is_primary_contact, tenant_status, room_id FROM Tenant WHERE tenant_id = ?', [tenantId])
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tenant not found' })
        res.json({ tenant: rows[0] })
    } catch (err) {
        console.error('Admin get tenant error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})



// Update tenant (partial)
router.patch('/tenants/:id', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const tenantId = Number(req.params.id)
    if (!tenantId) return res.status(400).json({ error: 'Invalid tenant id' })
    const { first_name, last_name, phone, email, username, password, access_level, is_Active, gender, is_primary_contact, room_id } = req.body || {}
    if (first_name === undefined && last_name === undefined && phone === undefined && email === undefined && username === undefined && password === undefined && access_level === undefined && is_Active === undefined && gender === undefined && is_primary_contact === undefined && room_id === undefined) {
        return res.status(400).json({ error: 'Nothing to update' })
    }
    try {
        const [rows] = await adminPool.execute('SELECT tenant_id, username FROM Tenant WHERE tenant_id = ?', [tenantId])
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tenant not found' })
        const currentUsername = rows[0].username

        if (username !== undefined && username !== currentUsername) {
            const [existing] = await adminPool.execute('SELECT tenant_id FROM Tenant WHERE username = ? AND tenant_id != ?', [username, tenantId])
            if (existing && existing.length > 0) return res.status(409).json({ error: 'Username already taken' })
            await adminPool.execute('UPDATE Tenant SET username = ? WHERE tenant_id = ?', [username, tenantId])
        }

        if (password !== undefined) {
            if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
            const hash = await bcrypt.hash(password, 10)
            await adminPool.execute('UPDATE Tenant SET password_hash = ? WHERE tenant_id = ?', [hash, tenantId])
        }

        if (first_name !== undefined) await adminPool.execute('UPDATE Tenant SET first_name = ? WHERE tenant_id = ?', [first_name, tenantId])
        if (last_name !== undefined) await adminPool.execute('UPDATE Tenant SET last_name = ? WHERE tenant_id = ?', [last_name, tenantId])
        if (phone !== undefined) await adminPool.execute('UPDATE Tenant SET tel_no = ? WHERE tenant_id = ?', [phone, tenantId])
        if (email !== undefined) await adminPool.execute('UPDATE Tenant SET email = ? WHERE tenant_id = ?', [email, tenantId])
        if (gender !== undefined) await adminPool.execute('UPDATE Tenant SET gender = ? WHERE tenant_id = ?', [gender, tenantId])
        if (is_primary_contact !== undefined) await adminPool.execute('UPDATE Tenant SET is_primary_contact = ? WHERE tenant_id = ?', [is_primary_contact ? 1 : 0, tenantId])
        if (room_id !== undefined) {
            // validate room exists
            if (room_id !== null) {
                const [roomRows] = await adminPool.execute('SELECT room_id FROM Condo_Room WHERE room_id = ?', [room_id])
                if (!roomRows || roomRows.length === 0) return res.status(400).json({ error: 'Invalid room_id' })
            }
            await adminPool.execute('UPDATE Tenant SET room_id = ? WHERE tenant_id = ?', [room_id, tenantId])
        }

        if (is_Active !== undefined) {
            const tenant_status = (is_Active === true || is_Active === 1) ? 'Active' : 'Inactive'
            await adminPool.execute('UPDATE Tenant SET tenant_status = ? WHERE tenant_id = ?', [tenant_status, tenantId])
        }

        // access_level is not present on Tenant in current schema; ignore or extend schema if needed

        const [updated] = await adminPool.execute('SELECT tenant_id AS tenant_id, username, first_name, last_name, tel_no AS phone, email, tenant_status FROM Tenant WHERE tenant_id = ?', [tenantId])
        return res.status(200).json({ message: 'Tenant updated', tenant: updated[0] })
    } catch (err) {
        console.error('Admin update tenant error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

// List guest visits
// list guest visits with optional param filters: q (search), from, to, userId (tenant), showCheckedOut
// If want all records: set showCheckedOut=true
router.get('/guest-visits', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(200, parseInt(req.query.limit) || 50)
        const offset = (page - 1) * limit
        const q = (req.query.q || '').trim()
        const from = req.query.from ? new Date(req.query.from) : null
        const to = req.query.to ? new Date(req.query.to) : null
        const userId = req.query.userId ? Number(req.query.userId) : null
        const showCheckedOut = req.query.showCheckedOut === '1' || req.query.showCheckedOut === 'true'

        let where = 'WHERE 1=1'
        const params = []
        if (q) {
            where += ' AND (guest_first_name LIKE ? OR guest_last_name LIKE ? OR license_number LIKE ? OR guest_RFID_TID LIKE ?)'
            const like = `%${q}%`
            params.push(like, like, like, like)
        }
        if (from) {
            where += ' AND check_in_time >= ?'
            params.push(from)
        }
        if (to) {
            where += ' AND check_in_time <= ?'
            params.push(to)
        }
        if (userId) {
            // map tenant_id -> room_id
            const [[tenantRow]] = await adminPool.execute('SELECT room_id FROM Tenant WHERE tenant_id = ?', [userId])
            const roomId = tenantRow ? tenantRow.room_id : null
            if (roomId) {
                where += ' AND room_id = ?'
                params.push(roomId)
            } else {
                // nothing will match
                return res.json({ visits: [], total: 0, page, limit })
            }
        }
        if (!showCheckedOut) {
            where += ' AND check_out_time IS NULL'
        }

        // join to include host user info
        const [rows] = await adminPool.execute(
            `SELECT gv.visit_id, gv.guest_first_name, 
             gv.guest_last_name, gv.guest_gender, gv.license_number, gv.note,
             gv.staff_id, s.first_name AS staff_first_name, s.last_name AS staff_last_name,
             gv.check_in_time, gv.check_out_time, gv.room_id,
             t.tenant_id AS host_id, t.username AS host_username, t.first_name AS host_first_name, t.last_name AS host_last_name
             FROM Guest_Visit gv
             LEFT JOIN Condo_Room cr ON gv.room_id = cr.room_id
             LEFT JOIN Tenant t ON cr.room_id = t.room_id
             LEFT JOIN Staff s ON gv.staff_id = s.staff_id
             ${where}
             ORDER BY gv.check_in_time DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )
        console.log('Guest visits query: ', { where, params })

        const [[{ total }]] = await adminPool.execute(`SELECT COUNT(*) as total FROM Guest_Visit gv LEFT JOIN Condo_Room cr ON gv.room_id = cr.room_id LEFT JOIN Tenant t ON cr.room_id = t.room_id ${where}`, params)
        res.json({ visits: rows, total, page, limit })
    } catch (err) {
        console.error('Admin list guest-visits error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

// List visits for a tenant
router.get('/tenants/:id/visits', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const tenantId = Number(req.params.id)
    if (!tenantId) return res.status(400).json({ error: 'Invalid tenant id' })
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(200, parseInt(req.query.limit) || 50)
        const offset = (page - 1) * limit
        const [[tenantRow]] = await adminPool.execute('SELECT room_id FROM Tenant WHERE tenant_id = ?', [tenantId])
        const roomId = tenantRow ? tenantRow.room_id : null
        if (!roomId) return res.json({ visits: [], total: 0, page, limit })
        const [rows] = await adminPool.execute(
            `SELECT visit_id, guest_first_name, guest_last_name, license_number, purpose, check_in_time, check_out_time FROM Guest_Visit WHERE room_id = ? ORDER BY check_in_time DESC LIMIT ? OFFSET ?`,
            [roomId, limit, offset]
        )
        const [[{ total }]] = await adminPool.execute('SELECT COUNT(*) as total FROM Guest_Visit WHERE room_id = ?', [roomId])
        res.json({ visits: rows, total, page, limit })
    } catch (err) {
        console.error('Admin get tenant visits error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

// Create guest visit (admin)
router.post('/guest-visits', jwtAuth, requireRole('admin', 'super-admin'), async (req, res) => {
    const { tenant_id, visitor_name, license_plate = null, check_in = null, expected_out = null, purpose = null } = req.body || {}
    if (!tenant_id || !visitor_name) return res.status(400).json({ error: 'tenant_id and visitor_name required' })
    try {
        const [[tenantRow]] = await adminPool.execute('SELECT room_id FROM Tenant WHERE tenant_id = ?', [tenant_id])
        const roomId = tenantRow ? tenantRow.room_id : null
        if (!roomId) return res.status(400).json({ error: 'Host tenant has no room/invalid tenant_id' })
        const checkInTime = check_in ? new Date(check_in) : new Date()
        const [result] = await adminPool.execute(
            'INSERT INTO Guest_Visit (guest_first_name, guest_last_name, license_number, check_in_time, check_out_time, purpose, room_id, staff_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [visitor_name, null, license_plate, checkInTime, expected_out || null, purpose, roomId, req.user?.id || null]
        )
        const [rows] = await adminPool.execute('SELECT visit_id, guest_first_name, guest_last_name, license_number, purpose, check_in_time, check_out_time FROM Guest_Visit WHERE visit_id = ?', [result.insertId])
        res.status(201).json({ message: 'Visit created', visit: rows[0] })
    } catch (err) {
        console.error('Admin create guest-visit error:', err)
        res.status(500).json({ error: 'Server error' })
    }
})

router.get('/parking_log', async (req, res) => {
    // Optional query params: ?date=YYYY-MM-DD&license_number=...
    const { date, license_number } = req.query || {}
    let params = []
    let sql = ''
    try {
        const where = []
        params = []
        if (date) {
            where.push('DATE(ps.recorded_time) = ?')
            params.push(date)
        }
        if (license_number) {
            where.push('rt.license_number LIKE ?')
            params.push(`%${license_number}%`)
        }
        const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

        sql = `SELECT
            ps.parking_log_id,
            DATE_FORMAT(ps.recorded_time, '%Y-%m-%d') AS date,
            TIME_FORMAT(ps.recorded_time, '%H:%i:%s') AS time,
            ps.scanned_RFID_TID AS car_id,
            rt.license_number AS license_number,
            CONCAT(t.first_name, ' ', t.last_name) AS tenant_name,
            gv.license_number AS guest_license_number,
            CONCAT(gv.guest_first_name, ' ', gv.guest_last_name) AS guest_name,
            ps.parking_slot_ID AS parking_slot_id,
            ps.note AS note,
            rt.tag_status AS status
        FROM Parking_Log ps
        LEFT JOIN RFID_Tag rt ON rt.RFID_TID = ps.scanned_RFID_TID
        LEFT JOIN Car c ON c.license_number = rt.license_number
        LEFT JOIN Condo_Room cr ON cr.license_number = c.license_number
        LEFT JOIN Tenant t ON t.room_id = cr.room_id
        LEFT JOIN Guest_Visit gv ON gv.guest_RFID_TID = ps.scanned_RFID_TID
        ${whereSql}
        ORDER BY ps.recorded_time DESC
        LIMIT 1000`

        const [rows] = await adminPool.execute(sql, params)
        console.log('GET /api/admin/parking_log - Sample row date:', rows[0]?.date, 'type:', typeof rows[0]?.date)
        return res.status(200).json(rows)
    } catch (err) {
        // Detailed logging for debugging: include timestamp, request info, query/sql and stack
        try {
            console.error('Error fetching parking_log (GET)')
            console.error('timestamp:', new Date().toISOString())
            console.error('url:', req.originalUrl || req.url)
            console.error('method:', req.method)
            console.error('query:', req.query)
            // params and sql may not be defined if error happened earlier; guard access
            if (typeof params !== 'undefined') console.error('db params:', params)
            if (typeof sql !== 'undefined') console.error('sql:', sql)
            if (req.user) console.error('user:', req.user)
            console.error('error stack:', err && err.stack ? err.stack : err)
        } catch (logErr) {
            // If logging itself fails, output minimal error
            console.error('Error while logging parking_log error:', logErr)
        }

        return res.status(500).json({ error: 'Error fetching parking log' })
    }
})

// POST /api/admin/parking_log - accept JSON body { date, license_number }
router.post('/parking_log', async (req, res) => {
    const { date, license_number } = req.body || {}
    console.log('POST /api/admin/parking_log - date:', date, 'license_number:', license_number)
    let params = []
    let sql = ''
    try {
        const where = []
        params = []
        if (date) {
            where.push('DATE(ps.recorded_time) = ?')
            params.push(date)
        }
        if (license_number) {
            where.push('rt.license_number LIKE ?')
            params.push(`%${license_number}%`)
        }
        const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''

        sql = `SELECT
            ps.parking_log_id,
            DATE_FORMAT(ps.recorded_time, '%Y-%m-%d') AS date,
            TIME_FORMAT(ps.recorded_time, '%H:%i:%s') AS time,
            ps.scanned_RFID_TID AS car_id,
            rt.license_number AS license_number,
            CONCAT(t.first_name, ' ', t.last_name) AS tenant_name,
            gv.license_number AS guest_license_number,
            CONCAT(gv.guest_first_name, ' ', gv.guest_last_name) AS guest_name,
            ps.parking_slot_ID AS parking_slot_id,
            ps.note AS note,
            rt.tag_status AS status
            FROM Parking_Log ps
            LEFT JOIN RFID_Tag rt ON rt.RFID_TID = ps.scanned_RFID_TID
            LEFT JOIN Car c ON c.license_number = rt.license_number
            LEFT JOIN Condo_Room cr ON cr.license_number = c.license_number
            LEFT JOIN Tenant t ON t.room_id = cr.room_id
            LEFT JOIN Guest_Visit gv ON gv.guest_RFID_TID = ps.scanned_RFID_TID
            ${whereSql}
            ORDER BY ps.recorded_time DESC
            LIMIT 1000`

        const [rows] = await adminPool.execute(sql, params)
        console.log('POST /api/admin/parking_log - Sample row date:', rows[0]?.date, 'type:', typeof rows[0]?.date)
        return res.status(200).json(rows)
    } catch (err) {
        try {
            console.error('Error fetching parking_log (POST)')
            console.error('timestamp:', new Date().toISOString())
            console.error('url:', req.originalUrl || req.url)
            console.error('method:', req.method)
            console.error('body:', req.body)
            if (typeof params !== 'undefined') console.error('db params:', params)
            if (typeof sql !== 'undefined') console.error('sql:', sql)
            if (req.user) console.error('user:', req.user)
            console.error('error stack:', err && err.stack ? err.stack : err)
        } catch (logErr) {
            console.error('Error while logging parking_log POST error:', logErr)
        }
        return res.status(500).json({ error: 'Error fetching parking log' })
    }
})

export default router
