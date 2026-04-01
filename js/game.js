import { TEAMS } from './data.js';
import { renderProfileScreen } from './game/profile.js';
import { state } from './game/state.js';
import { createStatsController } from './game/stats.js';
import { createQuizController } from './game/quiz.js';
import { createGoatController } from './game/goat.js';
import { createEraController } from './game/era.js';
import { createDreamController } from './game/dream.js';

// ── State ──
let currentScreen = 'home';
let selectedTeamId = null;
let currentRound = 0;
let myScore = 0;
let oppScore = 0;
let chosenPlayer = null;
let roundResults = [];
let currentTeam = null;
let oppTeam = null;
let pendingRoundAdvance = false;
let currentGoatCategoryId = null;
let currentGoatCategory = null;
let currentGoatEra = 'categories';
let goatRounds = [];
let goatRoundIndex = 0;
let goatPairIndex = 0;
let goatRoundWinners = [];
let goatHistory = [];
let goatBracketSize = 0;
let pendingLeaveTarget = 'era';
let currentStatsScope = 'players';
let currentDreamTeamId = null;
let currentDreamTeam = null;
let currentDreamStep = 0;
let currentDreamSelections = {};
let currentQuizPackId = null;
let currentQuizPack = null;
let currentQuizIndex = 0;
let currentQuizScore = 0;
let currentQuizSelection = null;
let currentQuizLocked = false;
let currentQuizAnswers = [];
let screenExitTimer = null;

function bridgeState(key, getter, setter) {
  Object.defineProperty(state, key, {
    get: getter,
    set: setter,
    configurable: true,
  });
}

bridgeState('currentScreen', () => currentScreen, value => { currentScreen = value; });
bridgeState('selectedTeamId', () => selectedTeamId, value => { selectedTeamId = value; });
bridgeState('currentRound', () => currentRound, value => { currentRound = value; });
bridgeState('myScore', () => myScore, value => { myScore = value; });
bridgeState('oppScore', () => oppScore, value => { oppScore = value; });
bridgeState('chosenPlayer', () => chosenPlayer, value => { chosenPlayer = value; });
bridgeState('roundResults', () => roundResults, value => { roundResults = value; });
bridgeState('currentTeam', () => currentTeam, value => { currentTeam = value; });
bridgeState('oppTeam', () => oppTeam, value => { oppTeam = value; });
bridgeState('pendingRoundAdvance', () => pendingRoundAdvance, value => { pendingRoundAdvance = value; });
bridgeState('currentGoatCategoryId', () => currentGoatCategoryId, value => { currentGoatCategoryId = value; });
bridgeState('currentGoatCategory', () => currentGoatCategory, value => { currentGoatCategory = value; });
bridgeState('currentGoatEra', () => currentGoatEra, value => { currentGoatEra = value; });
bridgeState('goatRounds', () => goatRounds, value => { goatRounds = value; });
bridgeState('goatRoundIndex', () => goatRoundIndex, value => { goatRoundIndex = value; });
bridgeState('goatPairIndex', () => goatPairIndex, value => { goatPairIndex = value; });
bridgeState('goatRoundWinners', () => goatRoundWinners, value => { goatRoundWinners = value; });
bridgeState('goatHistory', () => goatHistory, value => { goatHistory = value; });
bridgeState('goatBracketSize', () => goatBracketSize, value => { goatBracketSize = value; });
bridgeState('pendingLeaveTarget', () => pendingLeaveTarget, value => { pendingLeaveTarget = value; });
bridgeState('currentStatsScope', () => currentStatsScope, value => { currentStatsScope = value; });
bridgeState('currentDreamTeamId', () => currentDreamTeamId, value => { currentDreamTeamId = value; });
bridgeState('currentDreamTeam', () => currentDreamTeam, value => { currentDreamTeam = value; });
bridgeState('currentDreamStep', () => currentDreamStep, value => { currentDreamStep = value; });
bridgeState('currentDreamSelections', () => currentDreamSelections, value => { currentDreamSelections = value; });
bridgeState('currentQuizPackId', () => currentQuizPackId, value => { currentQuizPackId = value; });
bridgeState('currentQuizPack', () => currentQuizPack, value => { currentQuizPack = value; });
bridgeState('currentQuizIndex', () => currentQuizIndex, value => { currentQuizIndex = value; });
bridgeState('currentQuizScore', () => currentQuizScore, value => { currentQuizScore = value; });
bridgeState('currentQuizSelection', () => currentQuizSelection, value => { currentQuizSelection = value; });
bridgeState('currentQuizLocked', () => currentQuizLocked, value => { currentQuizLocked = value; });
bridgeState('currentQuizAnswers', () => currentQuizAnswers, value => { currentQuizAnswers = value; });
bridgeState('screenExitTimer', () => screenExitTimer, value => { screenExitTimer = value; });


export function openTeamLineup(teamId) {
  eraController.openTeamLineup(teamId);
}

export function closeTeamLineup() {
  eraController.closeTeamLineup();
}

export async function shareGoatResult() {
  return goatController.shareGoatResult();
}

// ── Navigation ──
export function goTo(screenId) {
  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + screenId);
  if (!next || current === next) return;

  if (screenExitTimer) {
    clearTimeout(screenExitTimer);
    screenExitTimer = null;
  }

  current.classList.add('exit');
  next.classList.add('active');
  next.classList.remove('exit');
  screenExitTimer = setTimeout(() => {
    current.classList.remove('active', 'exit');
    screenExitTimer = null;
  }, 250);
  currentScreen = screenId;

  // Show/hide global nav
  const nav = document.getElementById('bottom-nav');
  if (screenId === 'match' || screenId === 'era' || screenId === 'era-lineup' || screenId === 'goat-cats' || screenId === 'goat' || screenId === 'dream-teams' || screenId === 'dream' || screenId === 'dream-result' || screenId === 'quiz-hub' || screenId === 'quiz-play' || screenId === 'quiz-result') {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
    updateNavActive(screenId);
  }

  if (screenId === 'profile') {
    renderProfileScreen();
  }

  if (screenId !== 'era') {
    document.getElementById('confirm-bar').classList.remove('show');
  }

  next.querySelectorAll('.anim-in').forEach((el, i) => {
    el.style.animationName = 'none';
    requestAnimationFrame(() => {
      el.style.animationName = '';
      el.style.animationDelay = (i * 0.06) + 's';
    });
  });
}

export function updateNavActive(screenId) {
  const items = document.querySelectorAll('.nav-item');
  items.forEach(btn => btn.classList.remove('active'));
  const active = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
  if (active) {
    active.classList.add('active');
    updateNavIndicator(active);
  }
}

export function updateNavIndicator(activeBtn) {
  const nav = document.getElementById('bottom-nav');
  const shell = document.getElementById('bottom-nav-shell');
  const indicator = document.getElementById('nav-indicator');
  if (!nav || !indicator || !activeBtn) return;
  const navRect = (shell || nav).getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  const left = btnRect.left - navRect.left + 1;
  const width = btnRect.width - 2;
  indicator.style.left = left + 'px';
  indicator.style.width = width + 'px';
}

const statsController = createStatsController(state);
const quizController = createQuizController(state, { goTo });
const goatController = createGoatController(state, { goTo });
const eraController = createEraController(state, { goTo, goToEra: () => goToEra() });
const dreamController = createDreamController(state, { goTo });

export function goToPlay() {
  document.getElementById('result-overlay').classList.remove('show');
  document.getElementById('goat-result-overlay').classList.remove('show');
  document.getElementById('round-flash').classList.remove('show');
  selectedTeamId = null;
  currentDreamTeamId = null;
  currentDreamTeam = null;
  currentDreamStep = 0;
  currentDreamSelections = {};
  currentQuizSelection = null;
  currentQuizLocked = false;
  pendingRoundAdvance = false;
  document.getElementById('confirm-bar').classList.remove('show');
  goTo('play');
}

export function goToEra() {
  selectedTeamId = null;
  document.getElementById('confirm-bar').classList.remove('show');
  eraController.renderTeams(TEAMS);
  goTo('era');
}

export function goToGoatCategories() {
  goatController.goToGoatCategories();
}

export function goToDreamResult() {
  goTo('dream-result');
  dreamController.renderDreamResult();
}

export function goToQuizHub() {
  quizController.goToQuizHub();
}

export function goToHome() {
  document.getElementById('result-overlay').classList.remove('show');
  document.getElementById('goat-result-overlay').classList.remove('show');
  document.getElementById('round-flash').classList.remove('show');
  selectedTeamId = null;
  pendingRoundAdvance = false;
  document.getElementById('confirm-bar').classList.remove('show');
  goTo('home');
}

export function startGoatBracket(categoryId) {
  goatController.startGoatBracket(categoryId);
}

export function playGoatAgain() {
  goatController.playGoatAgain();
}

export function goToGoatCategoriesFromResult() {
  goatController.goToGoatCategoriesFromResult();
}

export function setGoatEraMode(eraId) {
  goatController.setGoatEraMode(eraId);
}

export function openStatsProfile(entityName, scope = currentStatsScope) {
  statsController.openStatsProfile(entityName, scope);
}

export function closeStatsProfile() {
  statsController.closeStatsProfile();
}

export function renderStatsScreen() {
  statsController.renderStatsScreen();
}

export function setStatsScope(scope) {
  statsController.setStatsScope(scope);
}

export function setStatsCategory(categoryId) {
  statsController.setStatsCategory(categoryId);
}

export function goToDreamTeams() {
  dreamController.goToDreamTeams();
}

export function startDreamDraft(teamId) {
  dreamController.startDreamDraft(teamId);
}

export function selectDreamPlayer(playerName) {
  dreamController.selectDreamPlayer(playerName);
}

export function goBackFromDreamDraft() {
  dreamController.goBackFromDreamDraft();
}

export function replayDreamDraft() {
  dreamController.replayDreamDraft();
}

export function startQuizPack(packId) {
  quizController.startQuizPack(packId);
}

export function selectQuizOption(option) {
  quizController.selectQuizOption(option);
}

export function submitQuizAnswer() {
  quizController.submitQuizAnswer();
}

export function replayQuizPack() {
  quizController.replayQuizPack();
}

// ── Teams ──
export function filterTeams(filter, btn) {
  eraController.filterTeams(filter, btn);
}

export function renderTeams(teams) {
  eraController.renderTeams(teams);
}

export function selectTeam(id, el) {
  eraController.selectTeam(id, el);
}

// ── Match ──
export function startMatch() {
  eraController.startMatch();
}

export function renderRound() {
  eraController.renderRound();
}

export function pickPlayer(el, p) {
  eraController.pickPlayer(el, p);
}

export function resolveRound() {
  eraController.resolveRound();
}

export function acknowledgeBattle() {
  eraController.acknowledgeBattle();
}

export function playAgain() {
  eraController.playAgain();
}

export function confirmLeave(target = 'era') {
  eraController.confirmLeave(target);
}

export function cancelLeave() {
  eraController.cancelLeave();
}

export function proceedLeave() {
  eraController.proceedLeave();
}
