/* ==========================================================================
   Ishmar Admin — auth guard
   Runs on every admin page except admin/index.html (the login page).
   Confirms a Supabase session exists, loads the caller's profile/role,
   wires up the sidebar user card + logout, and redirects to login if
   there is no session (or if Supabase isn't configured at all).
   ========================================================================== */

window.ishmarAdmin = { user: null, profile: null };

async function requireAdminSession() {
  if (!window.ishmarSupabase) {
    window.location.href = 'index.html';
    return;
  }

  const { data: { session } } = await window.ishmarSupabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }

  const { data: profile, error } = await window.ishmarSupabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('[Ishmar Admin] Could not load profile:', error);
  }

  window.ishmarAdmin.user = session.user;
  window.ishmarAdmin.profile = profile || { role: 'viewer', full_name: session.user.email };

  renderAdminUserCard();
  applyRoleVisibility();

  window.ishmarSupabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') window.location.href = 'index.html';
  });

  document.dispatchEvent(new CustomEvent('ishmar-admin-ready'));
}

function renderAdminUserCard() {
  const { user, profile } = window.ishmarAdmin;
  const name = profile.full_name || user.email;
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  const avatarEl = document.getElementById('admin-user-avatar');
  const nameEl = document.getElementById('admin-user-name');
  const roleEl = document.getElementById('admin-user-role');

  if (avatarEl) avatarEl.textContent = initial;
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = (profile.role || 'viewer').replace('_', ' ');
}

// Hides nav links whose data-roles list doesn't include the caller's role.
// Links with no data-roles attribute are visible to every signed-in role.
function applyRoleVisibility() {
  const role = window.ishmarAdmin.profile.role;
  document.querySelectorAll('[data-roles]').forEach((el) => {
    const allowed = el.dataset.roles.split(',').map((r) => r.trim());
    if (!allowed.includes(role)) el.style.display = 'none';
  });
}

function initAdminLogout() {
  document.querySelectorAll('[data-admin-logout]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await window.ishmarSupabase.auth.signOut();
      window.location.href = 'index.html';
    });
  });
}

function initAdminSidebarToggle() {
  const toggle = document.querySelector('.admin-menu-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => sidebar.classList.toggle('is-open'));
}

function markActiveNavLink() {
  const current = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.admin-nav a').forEach((a) => {
    if (a.getAttribute('href') === current) a.classList.add('is-active');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminLogout();
  initAdminSidebarToggle();
  markActiveNavLink();
  requireAdminSession();
});
