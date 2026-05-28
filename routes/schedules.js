// routes/schedules.js
const express = require('express');
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Create schedule (Admin) ──────────────────────────────────
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { collector_id, zone, ward_no, scheduled_date, shift, route_notes } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO schedules (collector_id, zone, ward_no, scheduled_date, shift, route_notes) VALUES (?, ?, ?, ?, ?, ?)',
      [collector_id, zone, ward_no || null, scheduled_date, shift || 'morning', route_notes || null]
    );
    await pool.query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [collector_id, 'New Schedule Assigned', `You have a new collection schedule for ${zone} on ${scheduled_date}.`, 'info']
    );
    return res.status(201).json({ success: true, message: 'Schedule created.', schedule_id: result.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── My schedules (Collector) ─────────────────────────────────
router.get('/my', authenticate, authorize('collector'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM schedules WHERE collector_id = ? ORDER BY scheduled_date ASC',
      [req.user.id]
    );
    return res.json({ success: true, schedules: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── All schedules (Admin) ────────────────────────────────────
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.full_name AS collector_name
       FROM schedules s JOIN users u ON s.collector_id = u.id
       ORDER BY s.scheduled_date DESC`
    );
    return res.json({ success: true, schedules: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Update schedule status ───────────────────────────────────
router.put('/:id/status', authenticate, authorize('collector', 'admin'), async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE schedules SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ success: true, message: 'Schedule updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;


// ───────────────────────────────────────────────────────────────
// routes/admin.js – Analytics & User Management
// ───────────────────────────────────────────────────────────────
// (exported as a separate module — attach to app as /api/admin)

const adminRouter = express.Router();

// ─── Dashboard stats ──────────────────────────────────────────
adminRouter.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [[citizens]]   = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role='citizen'");
    const [[collectors]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role='collector'");
    const [[pending]]    = await pool.query("SELECT COUNT(*) AS count FROM pickup_requests WHERE status='pending'");
    const [[completed]]  = await pool.query("SELECT COUNT(*) AS count FROM pickup_requests WHERE status='completed'");
    const [[open_comp]]  = await pool.query("SELECT COUNT(*) AS count FROM complaints WHERE status='open'");
    const [[total_waste]]= await pool.query("SELECT COALESCE(SUM(total_weight_kg),0) AS kg FROM waste_reports");
    const [monthly]      = await pool.query(
      `SELECT MONTH(preferred_date) AS month, COUNT(*) AS requests
       FROM pickup_requests WHERE YEAR(preferred_date) = YEAR(NOW())
       GROUP BY MONTH(preferred_date) ORDER BY month`
    );
    const [waste_by_type] = await pool.query(
      `SELECT waste_type, COUNT(*) AS count FROM pickup_requests GROUP BY waste_type`
    );

    return res.json({
      success: true,
      stats: {
        total_citizens:   citizens.count,
        total_collectors: collectors.count,
        pending_requests: pending.count,
        completed_requests: completed.count,
        open_complaints:  open_comp.count,
        total_waste_kg:   total_waste.kg,
        monthly_requests: monthly,
        waste_by_type
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── All collectors ───────────────────────────────────────────
adminRouter.get('/collectors', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.ward_no, u.zone, u.is_active,
              COUNT(r.id) AS total_assigned,
              SUM(CASE WHEN r.status='completed' THEN 1 ELSE 0 END) AS completed
       FROM users u
       LEFT JOIN pickup_requests r ON u.id = r.collector_id
       WHERE u.role = 'collector'
       GROUP BY u.id`
    );
    return res.json({ success: true, collectors: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── All citizens ─────────────────────────────────────────────
adminRouter.get('/citizens', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.ward_no, u.zone, u.is_active, u.created_at,
              COUNT(r.id) AS total_requests
       FROM users u
       LEFT JOIN pickup_requests r ON u.id = r.citizen_id
       WHERE u.role = 'citizen'
       GROUP BY u.id ORDER BY u.created_at DESC`
    );
    return res.json({ success: true, citizens: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Toggle user active status ────────────────────────────────
adminRouter.put('/users/:id/toggle', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'User status toggled.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Notifications ────────────────────────────────────────────
adminRouter.get('/notifications', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    return res.json({ success: true, notifications: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = { schedulesRouter: router, adminRouter };
