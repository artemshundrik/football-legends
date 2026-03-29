import { TEAMS } from './data.js';
import {
  goTo,
  goToEra,
  goToHome,
  filterTeams,
  renderTeams,
  startMatch,
  useBooster,
  resolveRound,
  playAgain,
  confirmLeave,
  updateNavActive,
  updateNavIndicator,
} from './game.js';

// ── Wire up screens ──
document.getElementById('btn-hero-play').addEventListener('click', goToEra);
document.getElementById('btn-mode-era').addEventListener('click', goToEra);
document.getElementById('btn-era-back').addEventListener('click', () => goTo('home'));
document.getElementById('confirm-bar-btn').addEventListener('click', startMatch);
document.getElementById('btn-match-back').addEventListener('click', confirmLeave);
document.getElementById('booster-btn').addEventListener('click', useBooster);
document.getElementById('fight-btn').addEventListener('click', resolveRound);
document.getElementById('btn-play-again').addEventListener('click', playAgain);
document.getElementById('btn-result-home').addEventListener('click', goToHome);

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
    if (target === 'era') {
      goToEra();
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
