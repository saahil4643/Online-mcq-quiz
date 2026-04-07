/* ============================================
   QUIZ DATA
   Django integration: Replace quizData with a
   fetch() call to /api/quizzes/{id}/questions/
   ============================================ */

const fallbackQuizData = [
  {
    id: 1,
    question: "What does CPU stand for?",
    options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Control Processing Unit"],
    answer: 0
  },
  {
    id: 2,
    question: "Which of the following is an input device?",
    options: ["Monitor", "Printer", "Keyboard", "Speaker"],
    answer: 2
  },
  {
    id: 3,
    question: "Which part of the computer is called the brain of the computer?",
    options: ["Monitor", "CPU", "Keyboard", "Mouse"],
    answer: 1
  },
  {
    id: 4,
    question: "Which of the following is system software?",
    options: ["MS Word", "Paint", "Operating System", "Calculator"],
    answer: 2
  },
  {
    id: 5,
    question: "What does RAM stand for?",
    options: ["Read Access Memory", "Random Access Memory", "Run Access Memory", "Real Access Memory"],
    answer: 1
  },
  {
    id: 6,
    question: "Which of the following is NOT a programming language?",
    options: ["Python", "Java", "HTML", "Mouse"],
    answer: 3
  },
  {
    id: 7,
    question: "Which device is used to display output?",
    options: ["Keyboard", "Mouse", "Monitor", "Scanner"],
    answer: 2
  },
  {
    id: 8,
    question: "What is the full form of OS?",
    options: ["Open Software", "Operating System", "Output System", "Order Software"],
    answer: 1
  },
  {
    id: 9,
    question: "Which of the following is secondary storage?",
    options: ["RAM", "Cache", "Hard Disk", "Register"],
    answer: 2
  },
  {
    id: 10,
    question: "Which language is used to create web pages?",
    options: ["C", "Java", "HTML", "Python"],
    answer: 2
  }
];

let quizData = [];


/* ============================================
   QUIZ ENGINE
   ============================================ */

const QUIZ_DURATION_SECONDS = 15 * 60; // 15 minutes

const QuizState = {
  currentIndex: 0,
  answers: {},        // { questionIndex: optionIndex }
  startTime: null,
  timerInterval: null,
  secondsLeft: QUIZ_DURATION_SECONDS,
  submitted: false
};

// ---- DOM REFS ----
const els = {
  questionNum:   document.getElementById('question-num'),
  questionText:  document.getElementById('question-text'),
  optionsWrap:   document.getElementById('options-wrap'),
  progressBar:   document.getElementById('quiz-progress-bar'),
  progressCount: document.getElementById('progress-count'),
  progressPct:   document.getElementById('progress-pct'),
  dotsWrap:      document.getElementById('quiz-dots'),
  timerDisplay:  document.getElementById('timer-display'),
  timerCard:     document.getElementById('quiz-timer'),
  btnPrev:       document.getElementById('btn-prev'),
  btnNext:       document.getElementById('btn-next'),
  btnSubmit:     document.getElementById('btn-submit'),
  modalOverlay:  document.getElementById('modal-overlay'),
  modalMsg:      document.getElementById('modal-msg'),
  modalConfirm:  document.getElementById('modal-confirm'),
  modalCancel:   document.getElementById('modal-cancel'),
};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', async () => {
  quizData = await loadQuizData();
  if (!quizData.length) {
    showToast('No questions available right now.', 'error');
    return;
  }

  QuizState.startTime = Date.now();
  buildDots();
  renderQuestion(0);
  startTimer();
  updateNav();
});

async function loadQuizData() {
  const quizPage = document.getElementById('quiz-page');
  const quizSlug = quizPage?.dataset?.quizSlug || 'computer-basics';
  const quizTitle = quizPage?.dataset?.quizTitle || 'Computer Basics';

  try {
    const response = await fetch(`/api/quiz/${quizSlug}/questions/`);
    if (!response.ok) {
      throw new Error('Could not load quiz from server.');
    }
    const payload = await response.json();
    quizPage.dataset.quizTitle = payload.quiz?.title || quizTitle;
    return payload.questions || [];
  } catch (error) {
    console.error(error);
    if (quizPage) quizPage.dataset.quizTitle = quizTitle;
    return fallbackQuizData;
  }
}


// ---- TIMER ----
function startTimer() {
  updateTimerDisplay();
  QuizState.timerInterval = setInterval(() => {
    QuizState.secondsLeft--;
    updateTimerDisplay();
    if (QuizState.secondsLeft <= 0) {
      clearInterval(QuizState.timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(QuizState.secondsLeft / 60).toString().padStart(2, '0');
  const s = (QuizState.secondsLeft % 60).toString().padStart(2, '0');
  if (els.timerDisplay) els.timerDisplay.textContent = `${m}:${s}`;

  if (els.timerCard) {
    els.timerCard.classList.remove('warning', 'danger');
    if (QuizState.secondsLeft <= 60)  els.timerCard.classList.add('danger');
    else if (QuizState.secondsLeft <= 180) els.timerCard.classList.add('warning');
  }
}

function autoSubmit() {
  showToast("Time's up! Submitting quiz…", 'info');
  setTimeout(submitQuiz, 1000);
}


// ---- RENDER QUESTION ----
function renderQuestion(index) {
  const q = quizData[index];
  if (!q) return;

  // Question number & text
  if (els.questionNum)  els.questionNum.textContent  = `Question ${index + 1}`;
  if (els.questionText) els.questionText.textContent = q.question;

  // Options
  if (els.optionsWrap) {
    els.optionsWrap.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.setAttribute('data-index', i);
      // Django integration: data-question-id="${q.id}" for backend answer submission
      btn.setAttribute('data-question-id', q.id);
      btn.innerHTML = `
        <span class="quiz-option__letter">${letters[i]}</span>
        <span class="quiz-option__text">${opt}</span>
        <span class="quiz-option__check">${i === QuizState.answers[index] ? '✓' : ''}</span>
      `;

      if (QuizState.answers[index] === i) btn.classList.add('selected');

      btn.addEventListener('click', () => selectOption(index, i));
      els.optionsWrap.appendChild(btn);
    });
  }

  updateProgress(index);
  updateDots(index);
}

// ---- SELECT OPTION ----
function selectOption(qIndex, optIndex) {
  if (QuizState.submitted) return;
  QuizState.answers[qIndex] = optIndex;

  // Update UI
  document.querySelectorAll('.quiz-option').forEach((btn, i) => {
    btn.classList.toggle('selected', i === optIndex);
    const check = btn.querySelector('.quiz-option__check');
    if (check) check.textContent = i === optIndex ? '✓' : '';
  });

  updateDots(qIndex);
}


// ---- PROGRESS ----
function updateProgress(index) {
  const total     = quizData.length;
  const answered  = Object.keys(QuizState.answers).length;
  const pct       = Math.round(((index + 1) / total) * 100);

  if (els.progressBar)   els.progressBar.style.width    = `${pct}%`;
  if (els.progressCount) els.progressCount.textContent  = `Question ${index + 1} of ${total}`;
  if (els.progressPct)   els.progressPct.textContent    = `${answered} answered`;
}


// ---- DOTS ----
function buildDots() {
  if (!els.dotsWrap) return;
  els.dotsWrap.innerHTML = '';
  quizData.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'quiz-dot';
    dot.textContent = i + 1;
    dot.setAttribute('aria-label', `Go to question ${i + 1}`);
    dot.addEventListener('click', () => goToQuestion(i));
    els.dotsWrap.appendChild(dot);
  });
}

function updateDots(currentIndex) {
  const dots = document.querySelectorAll('.quiz-dot');
  dots.forEach((dot, i) => {
    dot.classList.remove('current', 'answered', 'skipped');
    if (i === currentIndex) dot.classList.add('current');
    else if (QuizState.answers[i] !== undefined) dot.classList.add('answered');
  });
}


// ---- NAVIGATION ----
function goToQuestion(index) {
  if (index < 0 || index >= quizData.length) return;
  QuizState.currentIndex = index;
  renderQuestion(index);
  updateNav();
}

function updateNav() {
  const i = QuizState.currentIndex;
  if (els.btnPrev)   els.btnPrev.disabled = i === 0;
  if (els.btnNext)   els.btnNext.disabled = i === quizData.length - 1;
  if (els.btnSubmit) {
    els.btnSubmit.style.display = i === quizData.length - 1 ? 'inline-flex' : 'none';
    if (els.btnNext) els.btnNext.style.display = i === quizData.length - 1 ? 'none' : 'inline-flex';
  }
}

// Button listeners
if (els.btnPrev) {
  els.btnPrev.addEventListener('click', () => {
    goToQuestion(QuizState.currentIndex - 1);
  });
}
if (els.btnNext) {
  els.btnNext.addEventListener('click', () => {
    goToQuestion(QuizState.currentIndex + 1);
  });
}
if (els.btnSubmit) {
  els.btnSubmit.addEventListener('click', () => openModal());
}


// ---- MODAL ----
function openModal() {
  const unanswered = quizData.length - Object.keys(QuizState.answers).length;
  if (els.modalMsg) {
    els.modalMsg.textContent = unanswered > 0
      ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Are you sure you want to submit?`
      : 'Are you ready to submit your quiz?';
  }
  if (els.modalOverlay) els.modalOverlay.classList.add('open');
}

if (els.modalConfirm) {
  els.modalConfirm.addEventListener('click', () => {
    els.modalOverlay.classList.remove('open');
    submitQuiz();
  });
}
if (els.modalCancel) {
  els.modalCancel.addEventListener('click', () => {
    els.modalOverlay.classList.remove('open');
  });
}
if (els.modalOverlay) {
  els.modalOverlay.addEventListener('click', (e) => {
    if (e.target === els.modalOverlay) els.modalOverlay.classList.remove('open');
  });
}


// ---- SUBMIT QUIZ ----
function submitQuiz() {
  QuizState.submitted = true;
  clearInterval(QuizState.timerInterval);

  // Calculate score
  let correct = 0;
  quizData.forEach((q, i) => {
    if (QuizState.answers[i] === q.answer) correct++;
  });

  const timeTaken = Math.floor((Date.now() - QuizState.startTime) / 1000);
  const pct = Math.round((correct / quizData.length) * 100);

  // Django integration: POST results to /api/quiz-attempts/
  // fetch('/api/quiz-attempts/', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
  //   body: JSON.stringify({ answers: QuizState.answers, timeTaken })
  // });

  // Store result in sessionStorage for result page
  const result = {
    quizName:     document.getElementById('quiz-page')?.dataset?.quizTitle || 'Computer Basics',
    total:        quizData.length,
    correct,
    incorrect:    quizData.length - correct,
    unanswered:   quizData.length - Object.keys(QuizState.answers).length,
    score:        pct,
    timeTaken,
    answers:      QuizState.answers,
    questions:    quizData
  };
  sessionStorage.setItem('quizResult', JSON.stringify(result));

  window.location.href = '/result/';
}
