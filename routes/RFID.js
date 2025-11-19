import express from 'express'
import { adminPool } from '../db.js'
import { jwtAuth, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Authenticate RFID using stored procedure
// POST /api/rfid/authenticate
// Body: { rfid_tid, rfid_epc, gate_name }
router.post('/authenticate', async (req, res) => {
  const { rfid_tid, rfid_epc, gate_name } = req.body || {}
  if (!rfid_tid || !rfid_epc || !gate_name) return res.status(400).json({ error: 'rfid_tid, rfid_epc and gate_name are required' })
  try {
    // Call stored procedure which logs attempt and sets OUT variables
    await adminPool.execute('CALL sp_AuthenticateGate_RFID(?, ?, ?, @p_auth_status, @p_message, @p_auth_success)', [rfid_tid, rfid_epc, gate_name])
    const [rows] = await adminPool.execute('SELECT @p_auth_status as auth_status, @p_message as message, @p_auth_success as auth_success')
    // rows is an array with one row
    const result = Array.isArray(rows) && rows.length ? rows[0] : { auth_status: null, message: null, auth_success: null }
    return res.status(200).json({ result })
  } catch (err) {
    console.error('RFID authenticate error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
})

// List gate logs (admin/staff)
// GET /api/rfid/gate-logs
router.get('/gate-logs', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(200, parseInt(req.query.limit) || 50)
    const offset = (page - 1) * limit
    const { gate_name, direction, from, to } = req.query || {}

    let where = 'WHERE 1=1'
    const params = []
    if (gate_name) { where += ' AND gate_name = ?'; params.push(gate_name) }
    if (direction) { where += ' AND direction = ?'; params.push(direction) }
    if (from) { where += ' AND time_stamp >= ?'; params.push(new Date(from)) }
    if (to) { where += ' AND time_stamp <= ?'; params.push(new Date(to)) }

    const [rows] = await adminPool.execute(`SELECT gate_log_id, direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC FROM Gate_Arrival_Departure ${where} ORDER BY time_stamp DESC LIMIT ? OFFSET ?`, [...params, limit, offset])
    const [[{ total }]] = await adminPool.execute(`SELECT COUNT(*) as total FROM Gate_Arrival_Departure ${where}`, params)
    res.json({ logs: rows, total, page, limit })
  } catch (err) {
    console.error('Get gate logs error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single gate log
// GET /api/rfid/gate-logs/:id
router.get('/gate-logs/:id', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  try {
    const [rows] = await adminPool.execute('SELECT gate_log_id, direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC FROM Gate_Arrival_Departure WHERE gate_log_id = ?', [id])
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Log not found' })
    res.json({ log: rows[0] })
  } catch (err) {
    console.error('Get gate log error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create manual gate log (admin/staff)
// POST /api/rfid/gate-logs
// Body: { direction, gate_name, scanned_RFID_TID, scanned_EPC }
router.post('/gate-logs', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const { direction, gate_name, scanned_RFID_TID = null, scanned_EPC = null } = req.body || {}
  if (!direction || !gate_name) return res.status(400).json({ error: 'direction and gate_name required' })
  try {
    const [result] = await adminPool.execute('INSERT INTO Gate_Arrival_Departure (direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC) VALUES (?, NOW(), ?, ?, ?)', [direction, gate_name, scanned_RFID_TID, scanned_EPC])
    const [rows] = await adminPool.execute('SELECT gate_log_id, direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC FROM Gate_Arrival_Departure WHERE gate_log_id = ?', [result.insertId])
    res.status(201).json({ message: 'Log created', log: rows[0] })
  } catch (err) {
    console.error('Create gate log error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update gate log
// PATCH /api/rfid/gate-logs/:id
// Body: { direction?, gate_name?, scanned_RFID_TID?, scanned_EPC? }
router.patch('/gate-logs/:id', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  const { direction, gate_name, scanned_RFID_TID, scanned_EPC } = req.body || {}
  if (direction === undefined && gate_name === undefined && scanned_RFID_TID === undefined && scanned_EPC === undefined) return res.status(400).json({ error: 'Nothing to update' })
  try {
    const [rows] = await adminPool.execute('SELECT gate_log_id FROM Gate_Arrival_Departure WHERE gate_log_id = ?', [id])
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Log not found' })
    if (direction !== undefined) await adminPool.execute('UPDATE Gate_Arrival_Departure SET direction = ? WHERE gate_log_id = ?', [direction, id])
    if (gate_name !== undefined) await adminPool.execute('UPDATE Gate_Arrival_Departure SET gate_name = ? WHERE gate_log_id = ?', [gate_name, id])
    if (scanned_RFID_TID !== undefined) await adminPool.execute('UPDATE Gate_Arrival_Departure SET scanned_RFID_TID = ? WHERE gate_log_id = ?', [scanned_RFID_TID, id])
    if (scanned_EPC !== undefined) await adminPool.execute('UPDATE Gate_Arrival_Departure SET scanned_EPC = ? WHERE gate_log_id = ?', [scanned_EPC, id])
    const [updated] = await adminPool.execute('SELECT gate_log_id, direction, time_stamp, gate_name, scanned_RFID_TID, scanned_EPC FROM Gate_Arrival_Departure WHERE gate_log_id = ?', [id])
    res.json({ message: 'Log updated', log: updated[0] })
  } catch (err) {
    console.error('Update gate log error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete gate log
// DELETE /api/rfid/gate-logs/:id
router.delete('/gate-logs/:id', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const id = Number(req.params.id)
  if (!id) return res.status(400).json({ error: 'Invalid id' })
  try {
    const [rows] = await adminPool.execute('SELECT gate_log_id FROM Gate_Arrival_Departure WHERE gate_log_id = ?', [id])
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Log not found' })
    await adminPool.execute('DELETE FROM Gate_Arrival_Departure WHERE gate_log_id = ?', [id])
    res.json({ message: 'Log deleted' })
  } catch (err) {
    console.error('Delete gate log error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Basic RFID_Tag management (list/create/update/delete)
// GET /api/rfid/tags
router.get('/tags', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  try {
    const [rows] = await adminPool.execute('SELECT RFID_TID, current_EPC, tag_type, tag_status, license_number FROM RFID_Tag ORDER BY RFID_TID')
    res.json({ tags: rows })
  } catch (err) {
    console.error('List RFID tags error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/rfid/tags
// Body: { rfid_tid, current_EPC?, tag_type?, tag_status?, license_number? }
router.post('/tags', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const { rfid_tid, current_EPC = null, tag_type = 'Guest', tag_status = 'Available', license_number = null } = req.body || {}
  if (!rfid_tid) return res.status(400).json({ error: 'rfid_tid required' })
  try {
    const [existing] = await adminPool.execute('SELECT RFID_TID FROM RFID_Tag WHERE RFID_TID = ?', [rfid_tid])
    if (existing && existing.length) return res.status(409).json({ error: 'RFID tag already exists' })
    await adminPool.execute('INSERT INTO RFID_Tag (RFID_TID, current_EPC, tag_type, tag_status, license_number) VALUES (?, ?, ?, ?, ?)', [rfid_tid, current_EPC, tag_type, tag_status, license_number])
    const [rows] = await adminPool.execute('SELECT RFID_TID, current_EPC, tag_type, tag_status, license_number FROM RFID_Tag WHERE RFID_TID = ?', [rfid_tid])
    res.status(201).json({ message: 'Tag created', tag: rows[0] })
  } catch (err) {
    console.error('Create RFID tag error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update the RFID tag
// PATCH /api/rfid/tags/:tid
// Body: { current_EPC?, tag_type?, tag_status?, license_number? }
router.patch('/tags/:tid', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const tid = req.params.tid
  const { current_EPC, tag_type, tag_status, license_number } = req.body || {}
  if (!tid) return res.status(400).json({ error: 'Invalid tid' })
  if (current_EPC === undefined && tag_type === undefined && tag_status === undefined && license_number === undefined) return res.status(400).json({ error: 'Nothing to update' })
  try {
    const [rows] = await adminPool.execute('SELECT RFID_TID FROM RFID_Tag WHERE RFID_TID = ?', [tid])
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tag not found' })
    if (current_EPC !== undefined) await adminPool.execute('UPDATE RFID_Tag SET current_EPC = ? WHERE RFID_TID = ?', [current_EPC, tid])
    if (tag_type !== undefined) await adminPool.execute('UPDATE RFID_Tag SET tag_type = ? WHERE RFID_TID = ?', [tag_type, tid])
    if (tag_status !== undefined) await adminPool.execute('UPDATE RFID_Tag SET tag_status = ? WHERE RFID_TID = ?', [tag_status, tid])
    if (license_number !== undefined) await adminPool.execute('UPDATE RFID_Tag SET license_number = ? WHERE RFID_TID = ?', [license_number, tid])
    const [updated] = await adminPool.execute('SELECT RFID_TID, current_EPC, tag_type, tag_status, license_number FROM RFID_Tag WHERE RFID_TID = ?', [tid])
    res.json({ message: 'Tag updated', tag: updated[0] })
  } catch (err) {
    console.error('Update RFID tag error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete the RFID tag
// DELETE /api/rfid/tags/:tid
router.delete('/tags/:tid', jwtAuth, requireRole('staff','admin','super-admin'), async (req, res) => {
  const tid = req.params.tid
  if (!tid) return res.status(400).json({ error: 'Invalid tid' })
  try {
    const [rows] = await adminPool.execute('SELECT RFID_TID FROM RFID_Tag WHERE RFID_TID = ?', [tid])
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Tag not found' })
    await adminPool.execute('DELETE FROM RFID_Tag WHERE RFID_TID = ?', [tid])
    res.json({ message: 'Tag deleted' })
  } catch (err) {
    console.error('Delete RFID tag error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router