// routes/reports.js – Waste Collection Reports
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool    = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// ─── Collector: Submit waste report after pickup ─────────────
router.post('/', authenticate, authorize('collector'), [
  body('total_weight_kg').isFloat({ gt: 0 }).withMessage('Valid weight is required'),
  body('waste_type').isIn(['general','recyclable','hazardous','organic','e-waste']),
  body('collection_date').isDate().withMessage('Valid date required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { request_id, total_weight_kg, waste_type, disposal_site, collection_date, remarks } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO waste_reports (collector_id, request_id, total_weight_kg, waste_type, disposal_site, collection_date, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, request_id || null, total_weight_kg, waste_type, disposal_site || null, collection_date, remarks || null]
    );

    // If linked to a request, mark it completed
    if (request_id) {
      await pool.query(
        "UPDATE pickup_requests SET status = 'completed' WHERE id = ? AND collector_id = ?",
        [request_id, req.user.id]
      );
    }

    return res.status(201).json({ success: true, message: 'Report submitted.', report_id: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Collector: My reports ───────────────────────────────────
router.get('/my', authenticate, authorize('collector'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, p.address AS pickup_address
       FROM waste_reports r
       LEFT JOIN pickup_requests p ON r.request_id = p.id
       WHERE r.collector_id = ?
       ORDER BY r.collection_date DESC`,
      [req.user.id]
    );
    return res.json({ success: true, reports: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: All reports with filters & summary ───────────────
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  const { collector_id, waste_type, from_date, to_date } = req.query;
  let where = '1=1';
  const params = [];

  if (collector_id) { where += ' AND r.collector_id = ?'; params.push(collector_id); }
  if (waste_type)   { where += ' AND r.waste_type = ?';   params.push(waste_type); }
  if (from_date)    { where += ' AND r.collection_date >= ?'; params.push(from_date); }
  if (to_date)      { where += ' AND r.collection_date <= ?'; params.push(to_date); }

  try {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS collector_name
       FROM waste_reports r
       JOIN users u ON r.collector_id = u.id
       WHERE ${where}
       ORDER BY r.collection_date DESC`,
      params
    );

    const [[totals]] = await pool.query(
      `SELECT
         COUNT(*) AS total_reports,
         COALESCE(SUM(total_weight_kg), 0) AS total_kg,
         COUNT(DISTINCT collector_id) AS active_collectors
       FROM waste_reports r WHERE ${where}`,
      params
    );

    return res.json({ success: true, reports: rows, summary: totals });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── Admin: Aggregated monthly analytics ────────────────────
router.get('/analytics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [byMonth] = await pool.query(
      `SELECT MONTH(collection_date) AS month, YEAR(collection_date) AS year,
              SUM(total_weight_kg) AS total_kg, COUNT(*) AS reports
       FROM waste_reports
       WHERE YEAR(collection_date) = YEAR(NOW())
       GROUP BY YEAR(collection_date), MONTH(collection_date)
       ORDER BY month`
    );

    const [byType] = await pool.query(
      `SELECT waste_type, SUM(total_weight_kg) AS total_kg, COUNT(*) AS count
       FROM waste_reports GROUP BY waste_type ORDER BY total_kg DESC`
    );

    const [byCollector] = await pool.query(
      `SELECT u.full_name, u.zone, SUM(r.total_weight_kg) AS total_kg, COUNT(*) AS total_reports
       FROM waste_reports r JOIN users u ON r.collector_id = u.id
       GROUP BY r.collector_id ORDER BY total_kg DESC LIMIT 10`
    );

    return res.json({ success: true, by_month: byMonth, by_type: byType, by_collector: byCollector });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
