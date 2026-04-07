/* ============================================
   MAIN.JS — Shared utilities, navbar, toast
   ============================================ */

// ---- NAVBAR TOGGLE ----
(function initNavbar() {
  const hamburger = document.querySelector('.navbar__hamburger');
  const mobileMenu = document.querySelector('.navbar__mobile');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  // Mark active nav link
  const links = document.querySelectorAll('.navbar__link');
  links.forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname;
    if (linkPath === window.location.pathname) {
      link.classList.add('active');
    }
  });
})();


// ---- TOAST NOTIFICATION ----
/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} duration ms
 */
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), duration + 400);
}


// ---- SIMPLE ROUTER / SESSION ----
// Django integration note: Replace these with actual session/JWT checks
const SESSION_KEY = 'quizapp_user';

const Auth = {
  /** @param {{ name: string, email: string }} user */
  login(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  },
  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = '/';
  },
  /** @returns {{ name: string, email: string } | null} */
  getUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  },
  isLoggedIn() {
    return !!this.getUser();
  }
};


// ---- QUIZ SCORE COLOR HELPER ----
/** @param {number} pct 0–100 */
function scoreClass(pct) {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
}


// ---- FORMAT DATE ----
/** @param {Date|string} d */
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}


// ---- PAGE ENTER ANIMATION ----
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-enter');
});
