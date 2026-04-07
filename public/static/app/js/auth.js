/* ============================================
   AUTH.JS — Login & Register
   Django integration: Replace fetch mocks with
   real endpoints:
     POST /api/auth/login/
     POST /api/auth/register/
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---- TAB TOGGLE ----
  const tabs    = document.querySelectorAll('.auth-tab');
  const panels  = document.querySelectorAll('.auth-panel');

  function switchTab(targetId) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === targetId));
    panels.forEach(p => p.classList.toggle('active', p.id === targetId));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Support URL hash: /auth/#register
  if (window.location.hash === '#register') switchTab('register-panel');


  // ---- PASSWORD VISIBILITY TOGGLES ----
  document.querySelectorAll('.input-wrapper__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      const isText = input.type === 'text';
      input.type = isText ? 'password' : 'text';
      btn.textContent = isText ? '👁' : '🙈';
    });
  });


  // ---- VALIDATION HELPERS ----
  function showError(inputEl, msg) {
    inputEl.classList.add('error');
    const errEl = inputEl.closest('.form-group')?.querySelector('.form-error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
  }

  function clearError(inputEl) {
    inputEl.classList.remove('error');
    const errEl = inputEl.closest('.form-group')?.querySelector('.form-error');
    if (errEl) errEl.classList.remove('visible');
  }

  function clearAllErrors(form) {
    form.querySelectorAll('.form-input').forEach(clearError);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }


  // ---- LOGIN FORM ----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(loginForm);

      const email    = loginForm.querySelector('#login-email');
      const password = loginForm.querySelector('#login-password');
      let valid = true;

      if (!validateEmail(email.value.trim())) {
        showError(email, 'Please enter a valid email address.');
        valid = false;
      }
      if (password.value.length < 6) {
        showError(password, 'Password must be at least 6 characters.');
        valid = false;
      }
      if (!valid) return;

      const btn = loginForm.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        // Django integration: uncomment below
        // const res = await fetch('/api/auth/login/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ email: email.value, password: password.value })
        // });
        // const data = await res.json();
        // if (!res.ok) throw new Error(data.detail || 'Login failed');
        // Auth.login(data.user);

        // MOCK: simulate backend delay
        await new Promise(r => setTimeout(r, 800));
        Auth.login({ name: 'Alex Johnson', email: email.value });
        showToast('Welcome back!', 'success');
        setTimeout(() => window.location.href = '/dashboard/', 600);

      } catch (err) {
        showToast(err.message || 'Login failed. Try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }


  // ---- REGISTER FORM ----
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAllErrors(registerForm);

      const name     = registerForm.querySelector('#reg-name');
      const email    = registerForm.querySelector('#reg-email');
      const password = registerForm.querySelector('#reg-password');
      const confirm  = registerForm.querySelector('#reg-confirm');
      let valid = true;

      if (name.value.trim().length < 2) {
        showError(name, 'Name must be at least 2 characters.'); valid = false;
      }
      if (!validateEmail(email.value.trim())) {
        showError(email, 'Please enter a valid email address.'); valid = false;
      }
      if (password.value.length < 8) {
        showError(password, 'Password must be at least 8 characters.'); valid = false;
      }
      if (confirm.value !== password.value) {
        showError(confirm, 'Passwords do not match.'); valid = false;
      }
      if (!valid) return;

      const btn = registerForm.querySelector('[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Creating account…';

      try {
        // Django integration: uncomment below
        // const res = await fetch('/api/auth/register/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ name: name.value, email: email.value, password: password.value })
        // });
        // const data = await res.json();
        // if (!res.ok) throw new Error(data.detail || 'Registration failed');
        // Auth.login(data.user);

        // MOCK
        await new Promise(r => setTimeout(r, 900));
        Auth.login({ name: name.value.trim(), email: email.value });
        showToast('Account created! Welcome!', 'success');
        setTimeout(() => window.location.href = '/dashboard/', 600);

      } catch (err) {
        showToast(err.message || 'Registration failed.', 'error');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }


  // ---- LIVE VALIDATION: clear error on input ----
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('input', () => clearError(input));
  });

});
