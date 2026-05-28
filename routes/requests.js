// routes/requests.js – Waste Pickup Requests
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── CITIZEN: Create pickup request ──────────────────────────
router.post('/', authenticate, authorize('citizen'), [
  body('waste_type').isIn(['general','recyclable','hazardous','organic','e-waste']),
  body('address').notEmpty(),
  body('preferred_date').isDate()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { waste_type, quantity_kg, description, address, ward_no, zone, preferred_date, preferred_time } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO pickup_requests (citizen_id, waste_type, quantity_kg, description, address, ward_no, zone, preferred_date, preferred_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, waste_type, quantity_kg || null, description || null, address, ward_no || null, zone || null, preferred_date, preferred_time || null]
    );

    // Notify citizen
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req.user.id, 'Pickup Request Submitted', `Your waste pickup request #${result.insertId} has been received.`, 'success']
    );

    return res.status(201).json({ success: true, message: 'Pickup request submitted.', request_id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── CITIZEN: My requests ────────────────────────────────────
router.get('/my', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS collector_name 
       FROM pickup_requests r
       LEFT JOIN users u ON r.collector_id = u.id
       WHERE r.citizen_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    return res.json({ success: true, requests: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── COLLECTOR: Assigned requests ────────────────────────────
router.get('/assigned', authenticate, authorize('collector'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS citizen_name, u.phone AS citizen_phone
       FROM pickup_requests r
       JOIN users u ON r.citizen_id = u.id
       WHERE r.collector_id = ? AND r.status != 'cancelled'
       ORDER BY r.preferred_date ASC`,
      [req.user.id]
    );
    return res.json({ success: true, requests: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── ADMIN: All requests ─────────────────────────────────────
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  const { status, waste_type, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = '1=1';
  const params = [];

  if (status)     { whereClause += ' AND r.status = ?';     params.push(status); }
  if (waste_type) { whereClause += ' AND r.waste_type = ?'; params.push(waste_type); }

  try {
    const [rows] = await pool.query(
      `SELECT r.*, c.full_name AS citizen_name, c.phone AS citizen_phone,
              col.full_name AS collector_name
       FROM pickup_requests r
       JOIN users c ON r.citizen_id = c.id
       LEFT JOIN users col ON r.collector_id = col.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM pickup_requests r WHERE ${whereClause}`, params
    );

    return res.json({ success: true, requests: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── ADMIN: Assign collector ─────────────────────────────────
router.put('/:id/assign', authenticate, authorize('admin'), async (req, res) => {
  const { collector_id } = req.body;
  try {
    const [req_rows] = await pool.query('SELECT * FROM pickup_requests WHERE id = ?', [req.params.id]);
    if (!req_rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });

    await pool.query(
      `UPDATE pickup_requests SET collector_id = ?, status = 'assigned' WHERE id = ?`,
      [collector_id, req.params.id]
    );

    // Notify collector
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [collector_id, 'New Pickup Assigned', `You have been assigned pickup request #${req.params.id}.`, 'info']
    );

    // Notify citizen
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req_rows[0].citizen_id, 'Request Assigned', `A collector has been assigned to your pickup request #${req.params.id}.`, 'success']
    );

    return res.json({ success: true, message: 'Collector assigned successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── COLLECTOR: Update status ────────────────────────────────
router.put('/:id/status', authenticate, authorize('collector', 'admin'), async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  try {
    await pool.query(
      'UPDATE pickup_requests SET status = ?, notes = ? WHERE id = ?',
      [status, notes || null, req.params.id]
    );

    const [rows] = await pool.query('SELECT citizen_id FROM pickup_requests WHERE id = ?', [req.params.id]);
    if (rows.length) {
      const msgMap = {
        in_progress: 'Your waste pickup is in progress.',
        completed:   'Your waste pickup has been completed successfully!',
        cancelled:   'Your pickup request has been cancelled.'
      };
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [rows[0].citizen_id, 'Pickup Update', msgMap[status], status === 'completed' ? 'success' : 'warning']
      );
    }

    return res.json({ success: true, message: 'Status updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── CITIZEN: Cancel request ─────────────────────────────────
router.delete('/:id', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM pickup_requests WHERE id = ? AND citizen_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (['in_progress','completed'].includes(rows[0].status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel a request that is in progress or completed.' });
    }

    await pool.query("UPDATE pickup_requests SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    return res.json({ success: true, message: 'Request cancelled.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
