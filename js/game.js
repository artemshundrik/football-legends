import { TEAMS, ROUNDS } from './data.js';

// ── State ──
let currentScreen = 'home';
let selectedTeamId = null;
let currentRound = 0;
let myScore = 0;
let oppScore = 0;
let boosterCount = 2;
let chosenPlayer = null;
let roundResults = [];
let currentTeam = null;
let oppTeam = null;

// ── Navigation ──
export function goTo(screenId) {
  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + screenId);
  if (!next || current === next) return;

  current.classList.add('exit');
  setTimeout(() => current.classList.remove('active', 'exit'), 250);
  next.classList.add('active');
  currentScreen = screenId;

  next.querySelectorAll('.anim-in').forEach((el, i) => {
    el.style.animationName = 'none';
    requestAnimationFrame(() => {
      el.style.animationName = '';
      el.style.animationDelay = (i * 0.06) + 's';
    });
  });
}

export function goToEra() {
  renderTeams(TEAMS);
  goTo('era');
}

export function goToHome() {
  document.getElementById('result-overlay').classList.remove('show');
  selectedTeamId = null;
  document.getElementById('confirm-bar').classList.remove('show');
  goTo('home');
}

// ── Teams ──
export function filterTeams(filter, btn) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const filtered = filter === 'all'
    ? TEAMS
    : TEAMS.filter(t => t.type === filter || t.era === filter);
  renderTeams(filtered);
}

export function renderTeams(teams) {
  const list = document.getElementById('teams-list');
  list.innerHTML = '';
  teams.forEach((team, i) => {
    const div = document.createElement('div');
    div.className = 'team-row anim-in' + (team.id === selectedTeamId ? ' selected' : '');
    div.style.animationDelay = (i * 0.06) + 's';
    div.innerHTML = `
      <div class="team-crest" style="background:${team.bg}">${team.emoji}</div>
      <div class="team-row-info">
        <div class="team-row-name">${team.name}</div>
        <div class="team-row-year">${team.year} · Зірка: ${team.star}</div>
        <div class="team-row-ability">★ ${team.ability}</div>
      </div>
      <div class="team-row-rating">${team.rating}</div>
      <div class="check-mark">✓</div>
    `;
    div.addEventListener('click', () => selectTeam(team.id, div));
    list.appendChild(div);
  });
}

export function selectTeam(id, el) {
  document.querySelectorAll('.team-row').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  selectedTeamId = id;
  const team = TEAMS.find(t => t.id === id);
  document.getElementById('confirm-bar-btn').textContent = `ГРАТИ ЗА ${team.name.toUpperCase()}`;
  document.getElementById('confirm-bar').classList.add('show');
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ── Match ──
export function startMatch() {
  const myT = TEAMS.find(t => t.id === selectedTeamId);
  if (!myT) return;

  const opponents = TEAMS.filter(t => t.id !== selectedTeamId);
  const oppT = opponents[Math.floor(Math.random() * opponents.length)];
  currentTeam = myT;
  oppTeam = oppT;
  currentRound = 0;
  myScore = 0;
  oppScore = 0;
  boosterCount = 2;
  chosenPlayer = null;
  roundResults = [];

  document.getElementById('match-header-title').textContent =
    myT.name.split(' ')[0].toUpperCase() + ' vs ' + oppT.name.split(' ')[0].toUpperCase();
  document.getElementById('sb-my-name').textContent = myT.name.toUpperCase();
  document.getElementById('sb-opp-name').textContent = oppT.name.toUpperCase();
  document.getElementById('sb-my-score').textContent = '0';
  document.getElementById('sb-opp-score').textContent = '0';
  document.getElementById('booster-count').textContent = boosterCount;
  document.getElementById('booster-btn').disabled = false;

  buildRoundsTrack();
  goTo('match');
  document.getElementById('confirm-bar').classList.remove('show');
  renderRound();
}

function buildRoundsTrack() {
  const track = document.getElementById('rounds-track');
  track.innerHTML = '';
  ROUNDS.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'rd-pill' + (i === 0 ? ' active' : '');
    div.id = 'rd-' + i;
    div.textContent = r.emoji;
    track.appendChild(div);
  });
}

export function renderRound() {
  const r = ROUNDS[currentRound];
  chosenPlayer = null;

  document.getElementById('phase-label').textContent = 'Раунд ' + (currentRound + 1) + ' з 5';
  document.getElementById('phase-name').textContent = r.emoji + ' ' + r.name;
  document.getElementById('phase-hint').textContent = r.hint;
  document.getElementById('match-round-badge').textContent = (currentRound + 1) + '/5';
  document.getElementById('fight-btn').disabled = true;

  for (let i = 0; i < 5; i++) {
    const dot = document.getElementById('rd-' + i);
    dot.classList.remove('active', 'win', 'lose');
    if (i < roundResults.length) {
      dot.classList.add(roundResults[i] ? 'win' : 'lose');
    } else if (i === currentRound) {
      dot.classList.add('active');
    }
  }

  const list = document.getElementById('player-pick-list');
  list.innerHTML = '';
  currentTeam.players.slice(0, 4).forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'player-pick anim-in';
    div.style.animationDelay = (i * 0.07) + 's';
    div.innerHTML = `
      <div class="player-num">${i + 1}</div>
      <div class="player-pick-info">
        <div class="player-pick-name">${p.n}</div>
        <div class="player-pick-pos">${p.pos}</div>
      </div>
      <div class="player-pick-stat">${p.stat}</div>
    `;
    div.addEventListener('click', () => pickPlayer(div, p));
    list.appendChild(div);
  });
}

export function pickPlayer(el, p) {
  document.querySelectorAll('.player-pick').forEach(d => d.classList.remove('chosen'));
  el.classList.add('chosen');
  chosenPlayer = { ...p };
  document.getElementById('fight-btn').disabled = false;
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

export function useBooster() {
  if (!chosenPlayer || boosterCount <= 0) return;
  boosterCount--;
  chosenPlayer.stat = Math.min(99, chosenPlayer.stat + 12);
  document.getElementById('booster-count').textContent = boosterCount;
  if (boosterCount === 0) document.getElementById('booster-btn').disabled = true;

  document.querySelectorAll('.player-pick.chosen').forEach(el => {
    el.classList.add('boosted');
    el.querySelector('.player-pick-stat').textContent = chosenPlayer.stat;
  });
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
}

export function resolveRound() {
  if (!chosenPlayer) return;

  const myVal = chosenPlayer.stat;
  const oppPlayer = oppTeam.players[Math.floor(Math.random() * oppTeam.players.length)];
  const oppVal = oppPlayer.stat + Math.floor(Math.random() * 16) - 5;
  const won = myVal >= oppVal;

  roundResults.push(won);
  if (won) myScore++; else oppScore++;

  document.getElementById('sb-my-score').textContent = myScore;
  document.getElementById('sb-opp-score').textContent = oppScore;

  const flash = document.getElementById('round-flash');
  const label = document.getElementById('flash-label');
  const detail = document.getElementById('flash-detail');
  label.textContent = won ? 'РАУНД ТВІЙ!' : 'РАУНД ПРОГРАНО';
  label.className = 'flash-label ' + (won ? 'w' : 'l');
  detail.textContent = myVal + ' vs ' + Math.max(oppVal, 70);
  flash.classList.add('show');

  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(won ? 'success' : 'error');

  document.getElementById('fight-btn').disabled = true;

  setTimeout(() => {
    flash.classList.remove('show');
    currentRound++;
    if (currentRound >= 5) {
      setTimeout(showResult, 200);
    } else {
      renderRound();
    }
  }, 1100);
}

function showResult() {
  const win = myScore > oppScore;
  document.getElementById('res-trophy').textContent = win ? '🏆' : '😔';
  const headline = document.getElementById('res-headline');
  headline.textContent = win ? 'ПЕРЕМОГА!' : 'ПОРАЗКА';
  headline.className = 'result-headline ' + (win ? 'win' : 'lose');
  document.getElementById('res-subline').textContent =
    (win ? 'Ти виграв' : 'Ти програв') + ' ' + myScore + ':' + oppScore + ' по раундах';

  const rr = document.getElementById('res-rounds');
  rr.innerHTML = '';
  roundResults.forEach(w => {
    const div = document.createElement('div');
    div.className = 'res-rd ' + (w ? 'w' : 'l');
    div.textContent = w ? '✓' : '✗';
    rr.appendChild(div);
  });

  document.getElementById('result-overlay').classList.add('show');
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(win ? 'success' : 'error');
}

export function playAgain() {
  document.getElementById('result-overlay').classList.remove('show');
  goToEra();
}

export function confirmLeave() {
  const tg = window.Telegram?.WebApp;
  if (tg?.showConfirm) {
    tg.showConfirm('Вийти з матчу?', ok => { if (ok) goTo('era'); });
  } else {
    goTo('era');
  }
}
