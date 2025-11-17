import express from 'express'
import bcrypt from 'bcrypt'
import { adminPool } from '../db.js'
import { jwtAuth } from '../middleware/auth.js'

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

