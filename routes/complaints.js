// routes/complaints.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Submit complaint (Citizen) ───────────────────────────────
router.post('/', authenticate, authorize('citizen'), [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('complaint_type').isIn(['missed_pickup','improper_disposal','collector_behavior','bin_damage','other'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { subject, description, complaint_type, ward_no } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO complaints (citizen_id, subject, description, complaint_type, ward_no) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, subject, description, complaint_type, ward_no || null]
    );
    return res.status(201).json({ success: true, message: 'Complaint submitted.', complaint_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── My complaints ────────────────────────────────────────────
router.get('/my', authenticate, authorize('citizen'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM complaints WHERE citizen_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, complaints: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── All complaints (Admin) ───────────────────────────────────
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  const { status } = req.query;
  let where = '1=1'; const params = [];
  if (status) { where += ' AND c.status = ?'; params.push(status); }

  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name AS citizen_name, u.phone
       FROM complaints c JOIN users u ON c.citizen_id = u.id
       WHERE ${where} ORDER BY c.created_at DESC`,
      params
    );
    return res.json({ success: true, complaints: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Respond to complaint (Admin) ────────────────────────────
router.put('/:id/respond', authenticate, authorize('admin'), async (req, res) => {
  const { status, admin_response } = req.body;
  try {
    const resolved = status === 'resolved' ? new Date() : null;
    await pool.query(
      'UPDATE complaints SET status = ?, admin_response = ?, resolved_at = ? WHERE id = ?',
      [status, admin_response, resolved, req.params.id]
    );

    const [rows] = await pool.query('SELECT citizen_id FROM complaints WHERE id = ?', [req.params.id]);
    if (rows.length) {
      await pool.query(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [rows[0].citizen_id, 'Complaint Update', `Your complaint #${req.params.id} status has been updated to: ${status}.`, 'info']
      );
    }
    return res.json({ success: true, message: 'Complaint updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
