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
} from './game.js';

// ── Telegram init ──
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0f1623');
  tg.setBackgroundColor('#080c14');
}

// ── Wire up all buttons ──

// Home screen
document.getElementById('btn-hero-play').addEventListener('click', goToEra);
document.getElementById('btn-mode-era').addEventListener('click', goToEra);
document.getElementById('nav-home').addEventListener('click', () => goTo('home'));
document.getElementById('nav-play').addEventListener('click', goToEra);

// Era screen
document.getElementById('btn-era-back').addEventListener('click', () => goTo('home'));
document.getElementById('nav-era-home').addEventListener('click', goToHome);
document.getElementById('confirm-bar-btn').addEventListener('click', startMatch);

document.querySelectorAll('.filter-tab').forEach(btn => {
  btn.addEventListener('click', () => filterTeams(btn.dataset.filter, btn));
});

// Match screen
document.getElementById('btn-match-back').addEventListener('click', confirmLeave);
document.getElementById('booster-btn').addEventListener('click', useBooster);
document.getElementById('fight-btn').addEventListener('click', resolveRound);

// Result overlay
document.getElementById('btn-play-again').addEventListener('click', playAgain);
document.getElementById('btn-result-home').addEventListener('click', goToHome);

// ── Init ──
renderTeams(TEAMS);
