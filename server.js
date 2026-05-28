// server.js – EcoServe Entry Point
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const authRoutes      = require('./routes/auth');
const requestRoutes   = require('./routes/requests');
const complaintRoutes = require('./routes/complaints');
const reportRoutes    = require('./routes/reports');
const aiRoutes        = require('./routes/ai');
const { schedulesRouter, adminRouter } = require('./routes/schedules');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (Frontend) ──────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/requests',   requestRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/schedules',  schedulesRouter);
app.use('/api/admin',      adminRouter);
app.use('/api/reports',    reportRoutes);
app.use('/api/ai',         aiRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'EcoServe API', timestamp: new Date() });
});

// ─── Catch-all: Serve Frontend ────────────────────────────────
app.get('*', (req, res) => {
  // If requesting an HTML page that doesn't exist, serve 404
  if (req.accepts('html') && !req.path.startsWith('/api')) {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
    return;
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  🌿  EcoServe API running            ║
  ║  ➜   http://localhost:${PORT}           ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;
