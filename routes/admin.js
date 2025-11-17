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

// Admin-only: create tenant
// Both admin and super-admin can create tenants
router.post('/tenants', jwtAuth, requireRole('admin','super-admin'), async (req, res) => {
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
router.post('/staff', jwtAuth, requireRole('admin','super-admin'), async (req, res) => {
    const { username, password, first_name = null, last_name = null, position = null, access_level = 'Staff', is_Active = true } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: 'Missing username or password' })
    try {
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
router.patch('/staff/:id', jwtAuth, requireRole('admin','super-admin'), async (req, res) => {
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
router.get('/staff-info', jwtAuth, requireRole('admin','super-admin'), async (req, res) => {
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
router.get('/get/staff/:id', jwtAuth, requireRole('admin','super-admin'), async (req, res) => {
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

export default router
