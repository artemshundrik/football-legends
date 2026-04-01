import { QUIZ_PACKS } from '../data.js';
import { escapeHtml } from './utils.js';
import { recordQuizProfile } from './profile.js';

export function createQuizController(state, { goTo }) {
  function renderQuizHub() {
    const grid = document.getElementById('quiz-pack-grid');
    if (!grid) return;
    grid.innerHTML = QUIZ_PACKS.map((pack, index) => `
      <button class="quiz-pack-card quiz-pack-card-${pack.accent}" type="button" data-quiz-pack="${pack.id}" style="animation-delay:${index * 0.06}s">
        <div class="quiz-pack-card-top">
          <div class="quiz-pack-icon">${pack.icon}</div>
          <div class="quiz-pack-size">${pack.questions.length} питань</div>
        </div>
        <div class="quiz-pack-name">${escapeHtml(pack.title)}</div>
        <div class="quiz-pack-desc">${escapeHtml(pack.desc)}</div>
      </button>
    `).join('');
  }

  function renderQuizQuestion() {
    if (!state.currentQuizPack) return;
    const question = state.currentQuizPack.questions[state.currentQuizIndex];
    if (!question) return;
    document.getElementById('quiz-screen-title').textContent = state.currentQuizPack.title;
    document.getElementById('quiz-screen-subtitle').textContent = 'Питання';
    document.getElementById('quiz-progress-badge').textContent = `${state.currentQuizIndex + 1}/${state.currentQuizPack.questions.length}`;
    document.getElementById('quiz-question-kicker').textContent = question.kicker;
    document.getElementById('quiz-pack-title').textContent = state.currentQuizPack.title;
    document.getElementById('quiz-score-chip').textContent = `${state.currentQuizScore} / ${state.currentQuizPack.questions.length}`;
    document.getElementById('quiz-question-text').textContent = question.prompt;

    const list = document.getElementById('quiz-option-list');
    list.innerHTML = question.options.map(option => {
      const isSelected = state.currentQuizSelection === option;
      const isCorrect = state.currentQuizLocked && option === question.answer;
      const isWrong = state.currentQuizLocked && state.currentQuizSelection === option && option !== question.answer;
      return `
        <button class="quiz-option${isSelected ? ' selected' : ''}${isCorrect ? ' correct' : ''}${isWrong ? ' wrong' : ''}" type="button" data-quiz-option="${escapeHtml(option)}" ${state.currentQuizLocked ? 'disabled' : ''}>
          <span>${escapeHtml(option)}</span>
        </button>
      `;
    }).join('');

    const feedback = document.getElementById('quiz-feedback');
    if (!state.currentQuizLocked) {
      feedback.className = 'quiz-feedback';
      feedback.innerHTML = '';
    } else {
      const isCorrect = state.currentQuizSelection === question.answer;
      feedback.className = `quiz-feedback show ${isCorrect ? 'correct' : 'wrong'}`;
      feedback.innerHTML = `
        <div class="quiz-feedback-title">${isCorrect ? 'Правильно' : 'Мимо'}</div>
        <div class="quiz-feedback-copy">${escapeHtml(question.explanation)}</div>
      `;
    }

    const submitBtn = document.getElementById('btn-quiz-submit');
    submitBtn.disabled = !state.currentQuizLocked && !state.currentQuizSelection;
    submitBtn.textContent = state.currentQuizLocked
      ? (state.currentQuizIndex === state.currentQuizPack.questions.length - 1 ? 'ДО РЕЗУЛЬТАТУ' : 'ДАЛІ')
      : 'ВІДПОВІСТИ';
  }

  function renderQuizResult() {
    if (!state.currentQuizPack) return;
    const hero = document.getElementById('quiz-result-hero');
    const list = document.getElementById('quiz-result-list');
    const total = state.currentQuizPack.questions.length;
    const percent = Math.round((state.currentQuizScore / total) * 100);
    const label = state.currentQuizScore === total ? 'Ідеальний сет' : state.currentQuizScore >= Math.ceil(total * 0.6) ? 'Сильний прохід' : 'Є куди рости';

    hero.innerHTML = `
      <div class="quiz-result-kicker">${escapeHtml(state.currentQuizPack.title)}</div>
      <div class="quiz-result-score">${state.currentQuizScore}/${total}</div>
      <div class="quiz-result-title">${label}</div>
      <div class="quiz-result-meta">${percent}% правильних відповідей у цьому сеті.</div>
    `;
    list.innerHTML = state.currentQuizAnswers.map((item, index) => `
      <div class="quiz-result-item ${item.correct ? 'correct' : 'wrong'}">
        <div class="quiz-result-item-top">
          <div class="quiz-result-item-index">#${index + 1}</div>
          <div class="quiz-result-item-state">${item.correct ? '✓' : '✕'}</div>
        </div>
        <div class="quiz-result-item-question">${escapeHtml(item.prompt)}</div>
        <div class="quiz-result-item-answer">Правильна: ${escapeHtml(item.answer)}</div>
      </div>
    `).join('');
  }

  function startQuizPack(packId) {
    const pack = QUIZ_PACKS.find(item => item.id === packId);
    if (!pack) return;
    state.currentQuizPackId = packId;
    state.currentQuizPack = pack;
    state.currentQuizIndex = 0;
    state.currentQuizScore = 0;
    state.currentQuizSelection = null;
    state.currentQuizLocked = false;
    state.currentQuizAnswers = [];
    goTo('quiz-play');
    renderQuizQuestion();
  }

  function selectQuizOption(option) {
    if (state.currentQuizLocked) return;
    state.currentQuizSelection = option;
    renderQuizQuestion();
  }

  function submitQuizAnswer() {
    if (!state.currentQuizPack) return;
    const question = state.currentQuizPack.questions[state.currentQuizIndex];
    if (!question) return;

    if (!state.currentQuizLocked) {
      if (!state.currentQuizSelection) return;
      const correct = state.currentQuizSelection === question.answer;
      if (correct) state.currentQuizScore += 1;
      state.currentQuizAnswers.push({
        prompt: question.prompt,
        answer: question.answer,
        selected: state.currentQuizSelection,
        correct,
      });
      state.currentQuizLocked = true;
      renderQuizQuestion();
      return;
    }

    state.currentQuizIndex += 1;
    state.currentQuizSelection = null;
    state.currentQuizLocked = false;

    if (state.currentQuizIndex >= state.currentQuizPack.questions.length) {
      recordQuizProfile({ currentQuizPack: state.currentQuizPack, currentQuizScore: state.currentQuizScore, currentScreen: state.currentScreen });
      goTo('quiz-result');
      renderQuizResult();
      return;
    }

    renderQuizQuestion();
  }

  function replayQuizPack() {
    if (state.currentQuizPackId) startQuizPack(state.currentQuizPackId);
  }

  function goToQuizHub() {
    renderQuizHub();
    goTo('quiz-hub');
  }

  return { goToQuizHub, startQuizPack, selectQuizOption, submitQuizAnswer, replayQuizPack };
}
