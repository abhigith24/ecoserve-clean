// public/js/layout.js – builds navbar + sidebar dynamically

function buildLayout(activePage) {
  const user = Auth.getUser();
  if (!user) return;

  const menus = {
    admin: [
      { section: 'OVERVIEW' },
      { id: 'dashboard',   icon: 'fa-gauge',        label: 'Dashboard',      href: 'dashboard-admin.html' },
      { section: 'MANAGE' },
      { id: 'requests',    icon: 'fa-inbox',         label: 'Pickup Requests',href: 'admin-requests.html' },
      { id: 'schedules',   icon: 'fa-calendar-days', label: 'Schedules',      href: 'admin-schedules.html' },
      { id: 'complaints',  icon: 'fa-triangle-exclamation', label: 'Complaints', href: 'admin-complaints.html' },
      { id: 'reports',     icon: 'fa-chart-bar',     label: 'Waste Reports',  href: 'admin-reports.html' },
      { section: 'PEOPLE' },
      { id: 'collectors',  icon: 'fa-users',         label: 'Collectors',     href: 'admin-collectors.html' },
      { id: 'citizens',    icon: 'fa-user-group',    label: 'Citizens',       href: 'admin-citizens.html' },
      { section: 'SMART' },
      { id: 'smart',       icon: 'fa-robot',          label: 'AI & Features',  href: 'smart-features.html' },
      { section: 'ACCOUNT' },
      { id: 'profile',     icon: 'fa-user-circle',   label: 'My Profile',     href: 'profile.html' },
    ],
    collector: [
      { section: 'OVERVIEW' },
      { id: 'dashboard',   icon: 'fa-gauge',         label: 'Dashboard',      href: 'dashboard-collector.html' },
      { section: 'WORK' },
      { id: 'assigned',    icon: 'fa-truck',          label: 'My Pickups',     href: 'collector-pickups.html' },
      { id: 'schedules',   icon: 'fa-calendar-days',  label: 'My Schedule',    href: 'collector-schedule.html' },
      { id: 'reports',     icon: 'fa-clipboard-list', label: 'Submit Report',  href: 'collector-reports.html' },
      { section: 'SMART' },
      { id: 'smart',       icon: 'fa-robot',           label: 'AI & Features',  href: 'smart-features.html' },
      { section: 'ACCOUNT' },
      { id: 'profile',     icon: 'fa-user-circle',    label: 'My Profile',     href: 'profile.html' },
    ],
    citizen: [
      { section: 'OVERVIEW' },
      { id: 'dashboard',   icon: 'fa-gauge',           label: 'Dashboard',      href: 'dashboard-citizen.html' },
      { section: 'SERVICES' },
      { id: 'new-request', icon: 'fa-plus-circle',     label: 'New Request',    href: 'citizen-request.html' },
      { id: 'my-requests', icon: 'fa-inbox',            label: 'My Requests',    href: 'citizen-my-requests.html' },
      { id: 'complaints',  icon: 'fa-triangle-exclamation', label: 'Complaints', href: 'citizen-complaints.html' },
      { section: 'SMART' },
      { id: 'smart',       icon: 'fa-robot',               label: 'AI & Features',  href: 'smart-features.html' },
      { section: 'ACCOUNT' },
      { id: 'profile',     icon: 'fa-user-circle',     label: 'My Profile',     href: 'profile.html' },
    ]
  };

  const items = menus[user.role] || [];
  const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Navbar ──────────────────────────────────────────────────
  const navbar = document.getElementById('app-navbar');
  if (navbar) {
    navbar.innerHTML = `
      <div class="container-fluid d-flex align-items-center" style="gap:.75rem;">
        <button class="btn d-lg-none" id="sidebar-toggle" style="color:#fff;padding:.3rem .6rem;border:1px solid rgba(255,255,255,.2);border-radius:6px;">
          <i class="fas fa-bars"></i>
        </button>
        <a href="/" class="brand"><span class="leaf">🌿</span> EcoServe</a>
        <div class="ms-auto d-flex align-items-center gap-3">
          <button class="btn position-relative" style="color:rgba(255,255,255,.8);padding:.3rem .6rem;" onclick="openNotifications()">
            <i class="fas fa-bell"></i>
            <span id="notif-count" class="badge rounded-pill" style="background:var(--green-400);position:absolute;top:0;right:0;font-size:.65rem;display:none;"></span>
          </button>
          <div class="d-flex align-items-center gap-2" style="cursor:default;">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--green-500);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:#fff;font-size:.8rem;">${initials}</div>
            <span style="color:rgba(255,255,255,.85);font-size:.85rem;font-weight:500;">${user.full_name.split(' ')[0]}</span>
          </div>
          <button onclick="Auth.logout()" class="btn" style="color:rgba(255,255,255,.6);font-size:.82rem;padding:.3rem .7rem;border:1px solid rgba(255,255,255,.15);border-radius:6px;">
            <i class="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>`;
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('app-sidebar').classList.toggle('open');
    });
  }

  // ── Sidebar ──────────────────────────────────────────────────
  const sidebar = document.getElementById('app-sidebar');
  if (sidebar) {
    let html = `<div style="display:flex;align-items:center;gap:.75rem;padding:.75rem;background:rgba(255,255,255,.07);border-radius:10px;margin-bottom:1rem;">
      <div style="width:38px;height:38px;border-radius:50%;background:var(--green-500);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:#fff;font-size:.9rem;flex-shrink:0;">${initials}</div>
      <div style="min-width:0;overflow:hidden;">
        <div style="font-family:var(--font-display);font-weight:700;color:#fff;font-size:.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${user.full_name}</div>
        <div style="font-size:.72rem;color:var(--green-300);text-transform:capitalize;">${user.role}</div>
      </div>
    </div>`;

    for (const item of items) {
      if (item.section) {
        html += `<div class="sidebar-header">${item.section}</div>`;
      } else {
        const isActive = activePage === item.id ? 'active' : '';
        html += `<a href="/pages/${item.href}" class="sidebar-link ${isActive}">
          <span class="icon"><i class="fas ${item.icon}"></i></span>${item.label}
        </a>`;
      }
    }

    html += `<div style="margin-top:auto;padding-top:1.5rem;">
      <button onclick="Auth.logout()" class="sidebar-link" style="color:rgba(255,100,100,.8);">
        <span class="icon"><i class="fas fa-sign-out-alt"></i></span> Logout
      </button>
    </div>`;
    sidebar.innerHTML = html;
  }

  // ── Load notification count ───────────────────────────────────
  loadNotificationCount();
}

// ── Notification modal ─────────────────────────────────────────
async function openNotifications() {
  const data = await apiRequest('/admin/notifications');
  const notifs = data?.notifications || [];
  const badge = document.getElementById('notif-count');
  if (badge) badge.style.display = 'none';

  let rows = notifs.length
    ? notifs.map(n => `
        <div class="d-flex gap-3 py-3" style="border-bottom:1px solid var(--border);">
          <span style="font-size:1.3rem;">${n.type === 'success' ? '✅' : n.type === 'warning' ? '⚠️' : n.type === 'alert' ? '🔴' : 'ℹ️'}</span>
          <div>
            <div style="font-family:var(--font-display);font-size:.88rem;font-weight:700;">${n.title}</div>
            <div style="font-size:.82rem;color:var(--text-muted);">${n.message}</div>
            <div style="font-size:.72rem;color:var(--gray-400);margin-top:.25rem;">${formatDateTime(n.created_at)}</div>
          </div>
        </div>`).join('')
    : '<div class="empty-state" style="padding:2rem;"><div class="empty-icon">🔔</div><p>No notifications yet.</p></div>';

  document.getElementById('notif-body').innerHTML = rows;
  new bootstrap.Modal(document.getElementById('notifModal')).show();
}
