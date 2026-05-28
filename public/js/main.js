// public/js/main.js – EcoServe shared utilities

const API = '/api';

/* ─── Auth helpers ─────────────────────────────────────────── */
const Auth = {
  getToken:    () => localStorage.getItem('ecoserve_token'),
  getUser:     () => JSON.parse(localStorage.getItem('ecoserve_user') || 'null'),
  isLoggedIn:  () => !!localStorage.getItem('ecoserve_token'),
  save(token, user) {
    localStorage.setItem('ecoserve_token', token);
    localStorage.setItem('ecoserve_user', JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem('ecoserve_token');
    localStorage.removeItem('ecoserve_user');
    window.location.href = '/pages/login.html';
  }
};

/* ─── HTTP helper ──────────────────────────────────────────── */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  const token = Auth.getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body)  opts.body = JSON.stringify(body);

  try {
    const res  = await fetch(`${API}${endpoint}`, opts);
    const data = await res.json();
    if (res.status === 401) { Auth.logout(); return; }
    return { ok: res.ok, status: res.status, ...data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, message: 'Network error. Please try again.' };
  }
}

/* ─── Toast notifications ──────────────────────────────────── */
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `eco-toast ${type === 'error' ? 'error' : type === 'warning' ? 'warning' : ''}`;
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn .3s ease reverse';
    setTimeout(() => toast.remove(), 280);
  }, duration);
}

/* ─── Status badge HTML ─────────────────────────────────────── */
function statusBadge(status) {
  const label = status.replace(/_/g, ' ');
  return `<span class="badge-status badge-${status}">${label}</span>`;
}

/* ─── Waste type badge ──────────────────────────────────────── */
function wasteTypeBadge(type) {
  const icons = { general:'🗑️', recyclable:'♻️', hazardous:'☣️', organic:'🌿', 'e-waste':'💻' };
  return `<span class="badge-status wtype-${type}">${icons[type] || '📦'} ${type}</span>`;
}

/* ─── Format date ───────────────────────────────────────────── */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── Loading state ─────────────────────────────────────────── */
function setLoading(btn, loading = true, text = 'Submit') {
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="eco-spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px;"></span> Loading...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.original || text;
  }
}

/* ─── Guard: Redirect if not logged in ──────────────────────── */
function requireAuth(allowedRole) {
  if (!Auth.isLoggedIn()) { window.location.href = '/pages/login.html'; return false; }
  const user = Auth.getUser();
  if (allowedRole && user.role !== allowedRole && user.role !== 'admin') {
    showToast('Access denied.', 'error');
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

/* ─── Render sidebar user info ──────────────────────────────── */
function renderSidebarUser() {
  const user = Auth.getUser();
  if (!user) return;
  const el = document.getElementById('sidebar-user');
  if (el) {
    const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:rgba(255,255,255,.07);border-radius:10px;margin-bottom:1.25rem;">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--green-500);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:#fff;font-size:.9rem;flex-shrink:0;">${initials}</div>
        <div style="min-width:0;">
          <div style="font-family:var(--font-display);font-weight:700;color:#fff;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.full_name}</div>
          <div style="font-size:.72rem;color:var(--green-300);text-transform:capitalize;">${user.role}</div>
        </div>
      </div>`;
  }
}

/* ─── Notifications count ───────────────────────────────────── */
async function loadNotificationCount() {
  const data = await apiRequest('/admin/notifications');
  if (data && data.notifications) {
    const unread = data.notifications.filter(n => !n.is_read).length;
    const badge = document.getElementById('notif-count');
    if (badge && unread > 0) { badge.textContent = unread; badge.style.display = 'inline-flex'; }
  }
}
