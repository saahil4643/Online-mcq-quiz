/* ============================================
   RESULT.JS
   Django integration: In production, read the
   result from /api/quiz-attempts/{id}/ instead
   of sessionStorage.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const attemptId = params.get('attempt');
  const raw = attemptId ? getStoredAttemptById(attemptId) : sessionStorage.getItem('quizResult');

  // If no result in session, use demo data
  const result = raw ? JSON.parse(raw) : {
    quizName:   'Computer Basics',
    total:      10,
    correct:    7,
    incorrect:  2,
    unanswered: 1,
    score:      70,
    timeTaken:  480,
    answers:    { 0:0, 1:1, 2:0, 3:2, 4:2, 5:1, 6:1, 7:2, 8:1 },
    questions:  []
  };

  // ---- SCORE RING ----
  const ring = document.getElementById('score-ring');
  const scoreNum = document.getElementById('score-num');
  const scoreTitle = document.getElementById('result-title');
  const scoreSub   = document.getElementById('result-sub');
  const gradeEl    = document.getElementById('result-grade');

  if (ring) {
    const circumference = 2 * Math.PI * 70; // r=70
    ring.style.strokeDasharray  = circumference;
    ring.style.strokeDashoffset = circumference;

    setTimeout(() => {
      const offset = circumference - (result.score / 100) * circumference;
      ring.style.strokeDashoffset = offset;

      if (result.score >= 80) ring.style.stroke = 'var(--clr-success)';
      else if (result.score >= 50) ring.style.stroke = 'var(--clr-primary)';
      else ring.style.stroke = 'var(--clr-danger)';
    }, 200);
  }

  if (scoreNum) scoreNum.textContent = `${result.score}%`;

  // Grade + message
  let grade, title, sub;
  if (result.score >= 90)      { grade = '🏆 Excellent';  title = 'Outstanding!';          sub = 'You nailed it! Top-tier performance.'; }
  else if (result.score >= 80) { grade = '⭐ Great';       title = 'Great Job!';             sub = 'Solid understanding of the material.'; }
  else if (result.score >= 60) { grade = '👍 Good';        title = 'Good Effort!';           sub = 'A little more practice and you\'ll ace it.'; }
  else if (result.score >= 40) { grade = '📘 Average';     title = 'Keep Practising';        sub = 'Review the concepts and try again.'; }
  else                         { grade = '💪 Keep Going';  title = 'Don\'t Give Up!';        sub = 'Study the material and take another shot.'; }

  if (gradeEl)    { gradeEl.textContent = grade; }
  if (scoreTitle) scoreTitle.textContent = title;
  if (scoreSub)   scoreSub.textContent   = sub;

  // ---- STAT CARDS ----
  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl('stat-total',      result.total);
  setEl('stat-correct',    result.correct);
  setEl('stat-incorrect',  result.incorrect);
  setEl('stat-time',       formatTime(result.timeTaken));

  // ---- PROGRESS BARS ----
  animateBar('bar-correct',    (result.correct    / result.total) * 100, 'var(--clr-success)');
  animateBar('bar-incorrect',  (result.incorrect  / result.total) * 100, 'var(--clr-danger)');
  animateBar('bar-unanswered', (result.unanswered / result.total) * 100, 'var(--clr-muted)');

  document.getElementById('lbl-correct')?.setAttribute('data-val',    result.correct);
  document.getElementById('lbl-incorrect')?.setAttribute('data-val',  result.incorrect);
  document.getElementById('lbl-unanswered')?.setAttribute('data-val', result.unanswered);

  // ---- REVIEW QUESTIONS ----
  const reviewWrap = document.getElementById('review-wrap');
  if (reviewWrap && result.questions && result.questions.length) {
    result.questions.forEach((q, i) => {
      const userAns = result.answers[i];
      const isCorrect = userAns === q.answer;

      const item = document.createElement('div');
      item.className = 'review-item';
      item.innerHTML = `
        <div class="review-item__q">
          <span class="badge ${isCorrect ? 'badge-success' : userAns !== undefined ? 'badge-danger' : 'badge-muted'}" style="margin-right:8px">
            ${isCorrect ? '✓ Correct' : userAns !== undefined ? '✗ Wrong' : '— Skipped'}
          </span>
          Q${i + 1}. ${q.question}
        </div>
        <div class="review-item__answers">
          ${q.options.map((opt, j) => {
            let cls = 'neutral';
            if (j === q.answer) cls = 'correct';
            else if (j === userAns) cls = 'selected-wrong';
            return `<span class="review-answer ${cls}">${['A','B','C','D'][j]}. ${opt}</span>`;
          }).join('')}
        </div>
      `;
      reviewWrap.appendChild(item);
    });
  }

  // ---- SAVE TO DASHBOARD ----
  saveToDashboard(result);
});

function animateBar(id, pct, color) {
  const fill = document.getElementById(id);
  if (!fill) return;
  fill.style.background = color;
  setTimeout(() => { fill.style.width = `${pct}%`; }, 300);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function saveToDashboard(result) {
  // Django integration: this is handled server-side. Skip on production.
  const key  = 'quizapp_history';
  const prev = JSON.parse(localStorage.getItem(key) || '[]');
  const attemptId = Date.now().toString();
  prev.unshift({
    id:       attemptId,
    name:     result.quizName,
    score:    result.score,
    correct:  result.correct,
    total:    result.total,
    date:     new Date().toISOString(),
    result:   { ...result, id: attemptId }
  });
  localStorage.setItem(key, JSON.stringify(prev.slice(0, 20))); // keep last 20
}

function getStoredAttemptById(attemptId) {
  const history = JSON.parse(localStorage.getItem('quizapp_history') || '[]');
  const attempt = history.find(item => String(item.id) === String(attemptId));
  return attempt ? JSON.stringify(attempt.result || attempt) : null;
}


/* ============================================
   DASHBOARD.JS
   Django integration: Fetch attempts from
   GET /api/quiz-attempts/?user=me
   ============================================ */

// Runs only on dashboard page
if (document.getElementById('dashboard-page')) {

  // ---- USER INFO ----
  // Django: replace with user from session/JWT
  const user = Auth?.getUser?.() || { name: 'Alex Johnson', email: 'alex@example.com' };

  const nameEls = document.querySelectorAll('[data-user-name]');
  nameEls.forEach(el => el.textContent = user.name);

  const avatarEls = document.querySelectorAll('[data-user-avatar]');
  avatarEls.forEach(el => el.textContent = user.name.charAt(0).toUpperCase());

  // ---- LOAD HISTORY ----
  // Django: fetch('/api/quiz-attempts/').then(r=>r.json()).then(renderHistory)
  const dummy = [
    { id:1, name:'Computer Basics',      score:70, correct:7,  total:10, date:'2024-05-10T10:00:00Z' },
    { id:2, name:'Input Devices',        score:90, correct:9,  total:10, date:'2024-05-08T14:30:00Z' },
    { id:3, name:'Hardware Concepts',    score:60, correct:6,  total:10, date:'2024-05-06T09:15:00Z' },
    { id:4, name:'Operating Systems',    score:80, correct:8,  total:10, date:'2024-05-04T11:45:00Z' },
    { id:5, name:'Storage & Memory',     score:40, correct:4,  total:10, date:'2024-05-01T16:00:00Z' },
  ];

  const stored = JSON.parse(localStorage.getItem('quizapp_history') || '[]');
  const history = stored.length ? stored : dummy;

  renderHistory(history);
  renderMiniChart(history);
  renderCategoryBars(history);

  // ---- OVERVIEW STATS ----
  const totalAttempts = history.length;
  const avgScore      = Math.round(history.reduce((a, h) => a + h.score, 0) / history.length);
  const bestScore     = Math.max(...history.map(h => h.score));

  document.getElementById('stat-attempts')?.let?.(el => el.textContent = totalAttempts);
  document.getElementById('stat-avg')?.let?.(el => el.textContent = `${avgScore}%`);
  document.getElementById('stat-best')?.let?.(el => el.textContent = `${bestScore}%`);

  // Safer version without .let:
  const safeSet = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  safeSet('stat-attempts', totalAttempts);
  safeSet('stat-avg',      `${avgScore}%`);
  safeSet('stat-best',     `${bestScore}%`);
  safeSet('stat-streak',   '5 🔥');
}

function renderHistory(history) {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  history.forEach((h, i) => {
    const cls  = scoreClass(h.score);
    const date = formatDate(h.date);
    const tr   = document.createElement('tr');
    // Django: data-attempt-id="${h.id}" for linking to detail view
    tr.setAttribute('data-attempt-id', h.id);
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>
        <span style="font-weight:600;color:var(--clr-white)">${h.name}</span>
      </td>
      <td>${h.correct ?? '—'}/${h.total ?? '—'}</td>
      <td><span class="score-cell ${cls}">${h.score}%</span></td>
      <td><span class="text-muted" style="font-size:.85rem">${date}</span></td>
      <td>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a href="/result/?attempt=${encodeURIComponent(h.id)}" class="btn btn-outline btn-sm">View Results</a>
          <a href="/quiz/" class="btn btn-ghost btn-sm">Retake</a>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderMiniChart(history) {
  const wrap = document.getElementById('mini-chart');
  const lbls = document.getElementById('mini-chart-labels');
  if (!wrap) return;

  const recent = history.slice(0, 6).reverse();
  const max    = Math.max(...recent.map(h => h.score), 1);

  wrap.innerHTML = '';
  if (lbls) lbls.innerHTML = '';

  recent.forEach((h, i) => {
    const heightPct = (h.score / max) * 100;
    const bar = document.createElement('div');
    bar.className = `mini-bar${h.score === max ? ' peak' : ''}`;
    bar.style.height = '0';
    bar.title = `${h.name}: ${h.score}%`;
    wrap.appendChild(bar);

    setTimeout(() => { bar.style.height = `${heightPct}%`; }, 100 + i * 80);

    if (lbls) {
      const lbl = document.createElement('span');
      lbl.textContent = h.name.slice(0, 3);
      lbls.appendChild(lbl);
    }
  });
}

function renderCategoryBars(history) {
  const catList = document.getElementById('cat-list');
  if (!catList) return;
  catList.innerHTML = '';

  history.slice(0, 4).forEach(h => {
    const item = document.createElement('div');
    item.className = 'cat-item';
    item.innerHTML = `
      <div class="cat-item__top">
        <span class="cat-item__name">${h.name}</span>
        <span class="cat-item__score">${h.score}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill" id="cat-bar-${h.id}" style="width:0"></div>
      </div>
    `;
    catList.appendChild(item);
    setTimeout(() => {
      const fill = document.getElementById(`cat-bar-${h.id}`);
      if (fill) {
        fill.style.width = `${h.score}%`;
        if (h.score >= 80)       fill.style.background = 'var(--clr-success)';
        else if (h.score >= 50)  fill.style.background = 'var(--clr-primary)';
        else                     fill.style.background = 'var(--clr-danger)';
      }
    }, 200);
  });
}

// Helper used in result page too
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
function scoreClass(pct) {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
}
