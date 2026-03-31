import { TEAMS } from './data.js';
import {
  goTo,
  goToPlay,
  goToEra,
  goToGoatCategories,
  goToDreamTeams,
  goToQuizHub,
  goToHome,
  filterTeams,
  renderTeams,
  startMatch,
  startGoatBracket,
  setGoatEraMode,
  resolveRound,
  acknowledgeBattle,
  playAgain,
  playGoatAgain,
  goToGoatCategoriesFromResult,
  startDreamDraft,
  selectDreamPlayer,
  goBackFromDreamDraft,
  replayDreamDraft,
  startQuizPack,
  selectQuizOption,
  submitQuizAnswer,
  replayQuizPack,
  shareGoatResult,
  confirmLeave,
  cancelLeave,
  proceedLeave,
  renderStatsScreen,
  renderProfileScreen,
  setStatsScope,
  setStatsCategory,
  openStatsProfile,
  closeStatsProfile,
  openTeamLineup,
  closeTeamLineup,
  updateNavActive,
  updateNavIndicator,
} from './game.js';

function applyDisplayModeClass() {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  document.documentElement.classList.toggle('app-standalone', isStandalone);
  document.documentElement.classList.toggle('app-browser', !isStandalone);
  document.body.classList.toggle('app-standalone', isStandalone);
  document.body.classList.toggle('app-browser', !isStandalone);
}

applyDisplayModeClass();
window.matchMedia('(display-mode: standalone)').addEventListener?.('change', applyDisplayModeClass);
window.addEventListener('pageshow', applyDisplayModeClass);

// ── Wire up screens ──
document.getElementById('btn-hero-play').addEventListener('click', goToPlay);
document.getElementById('btn-home-era').addEventListener('click', goToEra);
document.getElementById('btn-home-goat').addEventListener('click', goToGoatCategories);
document.getElementById('btn-home-dream').addEventListener('click', goToDreamTeams);
document.getElementById('btn-home-quiz').addEventListener('click', goToQuizHub);
document.getElementById('btn-home-quiz-cta').addEventListener('click', goToQuizHub);
document.getElementById('btn-play-era').addEventListener('click', goToEra);
document.getElementById('btn-play-goat').addEventListener('click', goToGoatCategories);
document.getElementById('btn-play-dream').addEventListener('click', goToDreamTeams);
document.getElementById('btn-play-quiz').addEventListener('click', goToQuizHub);
document.getElementById('btn-quiz-hub-back').addEventListener('click', goToPlay);
document.getElementById('btn-quiz-back').addEventListener('click', goToQuizHub);
document.getElementById('btn-quiz-result-back').addEventListener('click', goToQuizHub);
document.getElementById('btn-era-back').addEventListener('click', goToPlay);
document.getElementById('btn-era-lineup-back').addEventListener('click', goToEra);
document.getElementById('btn-goat-cats-back').addEventListener('click', goToPlay);
document.getElementById('btn-goat-back').addEventListener('click', goToGoatCategories);
document.getElementById('btn-dream-teams-back').addEventListener('click', goToPlay);
document.getElementById('btn-dream-back').addEventListener('click', goBackFromDreamDraft);
document.getElementById('btn-dream-result-back').addEventListener('click', goToDreamTeams);
document.getElementById('confirm-bar-btn').addEventListener('click', startMatch);
document.getElementById('btn-era-lineup-play').addEventListener('click', startMatch);
document.getElementById('btn-match-back').addEventListener('click', () => confirmLeave('era'));
document.getElementById('fight-btn').addEventListener('click', resolveRound);
document.getElementById('battle-ok-btn').addEventListener('click', acknowledgeBattle);
document.getElementById('btn-play-again').addEventListener('click', playAgain);
document.getElementById('btn-result-home').addEventListener('click', goToHome);
document.getElementById('btn-goat-again').addEventListener('click', playGoatAgain);
document.getElementById('btn-goat-categories').addEventListener('click', goToGoatCategoriesFromResult);
document.getElementById('btn-dream-again').addEventListener('click', replayDreamDraft);
document.getElementById('btn-dream-other-team').addEventListener('click', goToDreamTeams);
document.getElementById('btn-quiz-submit').addEventListener('click', submitQuizAnswer);
document.getElementById('btn-quiz-again').addEventListener('click', replayQuizPack);
document.getElementById('btn-quiz-other-pack').addEventListener('click', goToQuizHub);
document.getElementById('leave-match-cancel').addEventListener('click', event => {
  event.preventDefault();
  cancelLeave();
});
document.getElementById('leave-match-confirm').addEventListener('click', event => {
  event.preventDefault();
  proceedLeave();
});
document.getElementById('leave-match-dialog').addEventListener('cancel', event => {
  event.preventDefault();
  cancelLeave();
});
document.getElementById('leave-match-dialog').addEventListener('click', event => {
  const dialog = event.currentTarget;
  if (event.target === dialog) cancelLeave();
});

document.getElementById('goat-categories').addEventListener('click', event => {
  const card = event.target.closest('[data-goat-category], [data-goat-special]');
  if (!card) return;
  startGoatBracket(card.dataset.goatCategory || card.dataset.goatSpecial);
});

document.getElementById('goat-era-tabs').addEventListener('click', event => {
  const btn = event.target.closest('[data-goat-era]');
  if (!btn) return;
  setGoatEraMode(btn.dataset.goatEra);
});
document.getElementById('dream-team-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-dream-team]');
  if (!card) return;
  startDreamDraft(card.dataset.dreamTeam);
});
document.getElementById('dream-candidate-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-dream-player]');
  if (!card) return;
  selectDreamPlayer(card.dataset.dreamPlayer);
});
document.getElementById('quiz-pack-grid').addEventListener('click', event => {
  const card = event.target.closest('[data-quiz-pack]');
  if (!card) return;
  startQuizPack(card.dataset.quizPack);
});
document.getElementById('quiz-option-list').addEventListener('click', event => {
  const option = event.target.closest('[data-quiz-option]');
  if (!option) return;
  selectQuizOption(option.dataset.quizOption);
});
document.getElementById('btn-goat-share').addEventListener('click', shareGoatResult);
document.getElementById('stats-scope-tabs').addEventListener('click', event => {
  const btn = event.target.closest('[data-stats-scope]');
  if (!btn) return;
  setStatsScope(btn.dataset.statsScope);
});
document.getElementById('stats-category-tabs').addEventListener('click', event => {
  const btn = event.target.closest('[data-stats-category]');
  if (!btn) return;
  setStatsCategory(btn.dataset.statsCategory);
});
document.getElementById('stats-leaderboard').addEventListener('click', event => {
  const row = event.target.closest('[data-stats-entity]');
  if (!row) return;
  openStatsProfile(row.dataset.statsEntity, row.dataset.statsScope);
});
document.getElementById('stats-profile-close').addEventListener('click', closeStatsProfile);
document.getElementById('stats-profile-overlay').addEventListener('click', event => {
  if (event.target === event.currentTarget) closeStatsProfile();
});
document.getElementById('team-lineup-close').addEventListener('click', closeTeamLineup);
document.getElementById('team-lineup-overlay').addEventListener('click', event => {
  if (event.target === event.currentTarget) closeTeamLineup();
});
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  closeStatsProfile();
  closeTeamLineup();
});

document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => filterTeams(btn.dataset.filter, btn));
});


// ── Global nav ──
document.querySelectorAll('.nav-item[data-screen]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.screen;
    // If in match, ask before leaving
    if (document.querySelector('.screen.active')?.id === 'screen-match') {
      confirmLeave(target);
      return;
    }
    if (target === 'play') {
      goToPlay();
    } else {
      goTo(target);
    }
  });
});

// ── Init indicator on first render ──
// Wait for layout then position indicator under active tab
requestAnimationFrame(() => {
  const activeBtn = document.querySelector('.nav-item.active');
  if (activeBtn) updateNavIndicator(activeBtn);
});

// Recalculate indicator on resize (orientation change)
window.addEventListener('resize', () => {
  const activeBtn = document.querySelector('.nav-item.active');
  if (activeBtn) updateNavIndicator(activeBtn);
});

// ── Init ──
renderTeams(TEAMS);
renderStatsScreen();
renderProfileScreen();
