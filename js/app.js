import { TEAMS } from './data.js';
import {
  goTo,
  goToPlay,
  goToEra,
  goToGoatCategories,
  goToHome,
  filterTeams,
  renderTeams,
  startMatch,
  startGoatBracket,
  setGoatEraMode,
  useBooster,
  resolveRound,
  acknowledgeBattle,
  playAgain,
  playGoatAgain,
  goToGoatCategoriesFromResult,
  shareGoatResult,
  confirmLeave,
  cancelLeave,
  proceedLeave,
  renderStatsScreen,
  setStatsScope,
  setStatsCategory,
  openStatsProfile,
  closeStatsProfile,
  updateNavActive,
  updateNavIndicator,
} from './game.js';

// ── Wire up screens ──
document.getElementById('btn-hero-play').addEventListener('click', goToPlay);
document.getElementById('btn-play-era').addEventListener('click', goToEra);
document.getElementById('btn-play-goat').addEventListener('click', goToGoatCategories);
document.getElementById('btn-era-back').addEventListener('click', goToPlay);
document.getElementById('btn-goat-cats-back').addEventListener('click', goToPlay);
document.getElementById('btn-goat-back').addEventListener('click', goToGoatCategories);
document.getElementById('confirm-bar-btn').addEventListener('click', startMatch);
document.getElementById('btn-match-back').addEventListener('click', () => confirmLeave('era'));
document.getElementById('booster-btn').addEventListener('click', useBooster);
document.getElementById('fight-btn').addEventListener('click', resolveRound);
document.getElementById('battle-ok-btn').addEventListener('click', acknowledgeBattle);
document.getElementById('btn-play-again').addEventListener('click', playAgain);
document.getElementById('btn-result-home').addEventListener('click', goToHome);
document.getElementById('btn-goat-again').addEventListener('click', playGoatAgain);
document.getElementById('btn-goat-categories').addEventListener('click', goToGoatCategoriesFromResult);
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
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeStatsProfile();
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
