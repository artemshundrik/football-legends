import { GOAT_CATEGORIES, GOAT_SPECIAL_BRACKETS, buildGoatBracketPlayers } from '../data.js';
import { escapeHtml } from './utils.js';
import { enhancePlayerPhotos, createWikiFaceMarkup } from './media.js';
import { recordGoatProfile } from './profile.js';

const GOAT_ERA_MODES = [
  { id: 'categories', label: 'Категорії' },
  { id: 'bestxi', label: 'Best XI' },
  { id: '1980s', label: '80-ті' },
  { id: '1990s', label: '90-ті' },
  { id: '2000s', label: '2000-ні' },
  { id: '2010s', label: '2010-ні' },
  { id: '2020s', label: '2020-ні' },
];

const GOAT_UI_LABEL = 'GOAT-СІТКА';

export function createGoatController(state, { goTo }) {
  function formatGoatEra(era) {
    const map = {
      '1980s': '80-ті',
      '1990s': '90-ті',
      '2000s': '2000-ні',
      '2010s': '2010-ні',
      '2020s': '2020-ні',
    };
    return map[era] || era || '';
  }

  function getGoatStageName(pairCount) {
    if (pairCount === 8) return '1/8 фіналу';
    if (pairCount === 4) return 'Чвертьфінал';
    if (pairCount === 2) return 'Півфінал';
    return 'Фінал';
  }

  function seedGoatPairs(players) {
    const seeded = [...players].sort((a, b) => b.stat - a.stat);
    const patternMap = {
      16: [[0, 15], [7, 8], [3, 12], [4, 11], [1, 14], [6, 9], [2, 13], [5, 10]],
      8: [[0, 7], [3, 4], [1, 6], [2, 5]],
      4: [[0, 3], [1, 2]],
    };
    const pattern = patternMap[seeded.length] || [];
    return pattern.map(([a, b]) => [seeded[a], seeded[b]]);
  }

  function createGoatCategoryCard(category, index) {
    return `
      <button class="goat-cat-card anim-in" style="animation-delay:${index * 0.06}s" data-goat-category="${escapeHtml(category.id)}">
        <span class="goat-cat-icon">${category.icon}</span>
        <span class="goat-cat-title">${escapeHtml(category.name)}</span>
        <span class="goat-cat-desc">${escapeHtml(category.desc)}</span>
        <span class="goat-cat-meta">16 легенд · 4 раунди</span>
      </button>
    `;
  }

  function createGoatSpecialCard(bracket, index) {
    return `
      <button class="goat-cat-card anim-in special" style="animation-delay:${index * 0.06}s" data-goat-special="${escapeHtml(bracket.id)}">
        <span class="goat-cat-icon">${bracket.icon}</span>
        <span class="goat-cat-title">${escapeHtml(bracket.name)}</span>
        <span class="goat-cat-desc">${escapeHtml(bracket.desc)}</span>
        <span class="goat-cat-meta">${bracket.players.length} легенд · 4 раунди</span>
      </button>
    `;
  }

  function createGoatPlayerCard(player, side) {
    const fact = [formatGoatEra(player.era), player.pos].filter(Boolean).join(' · ');
    return `
      <button class="goat-player-card ${side}" data-goat-player="${escapeHtml(player.id)}">
        <div class="goat-player-head">
          <div class="goat-player-country">${escapeHtml(player.country || '⚽')}</div>
          <div class="goat-player-avatar-badge">${escapeHtml(player.avatar || '★')}</div>
        </div>
        <div class="goat-player-art">
          ${createWikiFaceMarkup(player, 'goat-player-backdrop')}
          ${createWikiFaceMarkup(player, 'goat-player-face')}
        </div>
        <div class="goat-player-name">${escapeHtml(player.n)}</div>
        <div class="goat-player-tag">${escapeHtml(player.tag)}</div>
        <div class="goat-player-fact">${escapeHtml(fact)}</div>
        <div class="goat-player-stats">
          <div class="goat-player-stat"><span class="goat-player-stat-val">${player.atk}</span><span class="goat-player-stat-lbl">ATK</span></div>
          <div class="goat-player-stat"><span class="goat-player-stat-val">${player.def}</span><span class="goat-player-stat-lbl">DEF</span></div>
          <div class="goat-player-stat"><span class="goat-player-stat-val">${player.spd}</span><span class="goat-player-stat-lbl">SPD</span></div>
        </div>
      </button>
    `;
  }

  function renderGoatBracketTrack() {
    const track = document.getElementById('goat-bracket-track');
    const totalStages = state.goatBracketSize ? Math.log2(state.goatBracketSize) : 4;
    track.innerHTML = '';
    for (let i = 0; i < totalStages; i++) {
      const pairs = state.goatRounds[i]?.length || Math.max(1, state.goatBracketSize / (2 ** (i + 1)));
      const pill = document.createElement('div');
      pill.className = 'goat-stage-pill';
      if (i === state.goatRoundIndex) pill.classList.add('active');
      if (i < state.goatRoundIndex) pill.classList.add('done');
      pill.innerHTML = `<span class="goat-stage-name">${getGoatStageName(pairs)}</span><span class="goat-stage-count">${pairs} пар</span>`;
      track.appendChild(pill);
    }
  }

  function renderGoatHistory() {
    const list = document.getElementById('goat-history-list');
    const historySection = list.closest('.goat-history');
    if (!state.goatHistory.length) {
      historySection?.classList.add('is-empty');
      list.innerHTML = '<div class="goat-history-empty">Перший вибір ще попереду. Сітка чекає на твій вердикт.</div>';
      return;
    }
    historySection?.classList.remove('is-empty');
    list.innerHTML = state.goatHistory
      .map(item => `<div class="goat-history-item"><span class="goat-history-stage">${escapeHtml(item.stage)}</span><span class="goat-history-result">${escapeHtml(item.winner.n)} переміг ${escapeHtml(item.loser.n)}</span></div>`)
      .join('');
  }

  function renderGoatRound() {
    const currentPairs = state.goatRounds[state.goatRoundIndex] || [];
    const pair = currentPairs[state.goatPairIndex];
    if (!pair) return;
    const stageName = getGoatStageName(currentPairs.length);
    document.getElementById('goat-screen-title').textContent = state.currentGoatCategory?.shortName || GOAT_UI_LABEL;
    const modeLabel = GOAT_ERA_MODES.find(mode => mode.id === state.currentGoatEra)?.label || 'GOAT';
    document.getElementById('goat-category-label').textContent = `${state.currentGoatCategory?.name || 'Категорія'} · ${modeLabel}`;
    document.getElementById('goat-stage-title').textContent = stageName;
    document.getElementById('goat-progress').textContent = `Пара ${state.goatPairIndex + 1} з ${currentPairs.length}`;
    document.getElementById('goat-round-badge').textContent = `${state.goatPairIndex + 1}/${currentPairs.length}`;
    renderGoatBracketTrack();
    renderGoatHistory();
    const pairWrap = document.getElementById('goat-pair');
    pairWrap.innerHTML = `${createGoatPlayerCard(pair[0], 'left')}<div class="goat-versus">VS</div>${createGoatPlayerCard(pair[1], 'right')}`;
    pairWrap.querySelectorAll('[data-goat-player]').forEach(btn => btn.addEventListener('click', () => chooseGoatWinner(btn.dataset.goatPlayer)));
    enhancePlayerPhotos(pairWrap);
  }

  function advanceGoatBracket() {
    state.goatPairIndex++;
    const currentPairs = state.goatRounds[state.goatRoundIndex];
    if (state.goatPairIndex < currentPairs.length) {
      renderGoatRound();
      return;
    }
    if (state.goatRoundWinners.length === 1) {
      showGoatResult(state.goatRoundWinners[0]);
      return;
    }
    const nextRound = [];
    for (let i = 0; i < state.goatRoundWinners.length; i += 2) nextRound.push([state.goatRoundWinners[i], state.goatRoundWinners[i + 1]]);
    state.goatRounds.push(nextRound);
    state.goatRoundIndex++;
    state.goatPairIndex = 0;
    state.goatRoundWinners = [];
    renderGoatRound();
  }

  function chooseGoatWinner(playerId) {
    const currentPairs = state.goatRounds[state.goatRoundIndex] || [];
    const pair = currentPairs[state.goatPairIndex];
    if (!pair) return;
    const winner = pair.find(player => player.id === playerId);
    const loser = pair.find(player => player.id !== playerId);
    if (!winner || !loser) return;
    const pairWrap = document.getElementById('goat-pair');
    pairWrap.querySelectorAll('[data-goat-player]').forEach(btn => {
      btn.disabled = true;
      btn.classList.toggle('selected', btn.dataset.goatPlayer === playerId);
      btn.classList.toggle('faded', btn.dataset.goatPlayer !== playerId);
    });
    state.goatRoundWinners.push(winner);
    state.goatHistory.push({ stage: getGoatStageName(currentPairs.length), winner, loser });
    renderGoatHistory();
    setTimeout(() => advanceGoatBracket(), 260);
  }

  function showGoatResult(winner) {
    const overlay = document.getElementById('goat-result-overlay');
    document.getElementById('goat-res-headline').textContent = `ТВІЙ GOAT: ${winner.n.toUpperCase()}`;
    document.getElementById('goat-res-subline').textContent = `${winner.n} виграв сітку в категорії «${state.currentGoatCategory.name}».`;
    document.getElementById('goat-res-trophy').textContent = winner.avatar || '👑';
    document.getElementById('goat-result-card').innerHTML = `
      <div class="goat-result-winner goat-result-winner-celebration">
        <div class="goat-result-spark goat-result-spark-a"></div>
        <div class="goat-result-spark goat-result-spark-b"></div>
        <div class="goat-result-spark goat-result-spark-c"></div>
        <div class="goat-result-photo-ring">${createWikiFaceMarkup(winner, 'goat-result-face')}</div>
        <div class="goat-result-name">${escapeHtml(winner.n)}</div>
        <div class="goat-result-meta">${escapeHtml(winner.country || '')} · ${escapeHtml(winner.tag || '')}</div>
        <div class="goat-result-caption">Чемпіон сітки · святкує перемогу</div>
      </div>
    `;
    enhancePlayerPhotos(overlay);
    overlay.classList.add('show');
    recordGoatProfile({ winner, currentGoatCategory: state.currentGoatCategory, currentScreen: state.currentScreen });
  }

  function renderGoatCategories() {
    const list = document.getElementById('goat-categories');
    if (state.currentGoatEra === 'categories') {
      list.innerHTML = GOAT_CATEGORIES.map(createGoatCategoryCard).join('');
      return;
    }
    const special = GOAT_SPECIAL_BRACKETS.find(item => item.id === state.currentGoatEra);
    list.innerHTML = special ? createGoatSpecialCard(special, 0) : '';
  }

  function renderGoatEraTabs() {
    const tabs = document.getElementById('goat-era-tabs');
    tabs.innerHTML = GOAT_ERA_MODES.map(mode => `<button class="filter-tab${mode.id === state.currentGoatEra ? ' active' : ''}" data-goat-era="${mode.id}">${mode.label}</button>`).join('');
  }

  function goToGoatCategories() {
    document.getElementById('goat-result-overlay').classList.remove('show');
    renderGoatCategories();
    renderGoatEraTabs();
    goTo('goat-cats');
  }

  function startGoatBracket(categoryId) {
    const category = state.currentGoatEra === 'categories'
      ? GOAT_CATEGORIES.find(item => item.id === categoryId)
      : GOAT_SPECIAL_BRACKETS.find(item => item.id === state.currentGoatEra);
    if (!category) return;
    const bracketPlayers = buildGoatBracketPlayers(category, 16);
    state.currentGoatCategoryId = categoryId;
    state.currentGoatCategory = { ...category, players: bracketPlayers };
    state.goatRounds = [seedGoatPairs(state.currentGoatCategory.players)];
    state.goatRoundIndex = 0;
    state.goatPairIndex = 0;
    state.goatRoundWinners = [];
    state.goatHistory = [];
    state.goatBracketSize = state.currentGoatCategory.players.length;
    document.getElementById('goat-result-overlay').classList.remove('show');
    goTo('goat');
    renderGoatRound();
  }

  function playGoatAgain() {
    document.getElementById('goat-result-overlay').classList.remove('show');
    if (state.currentGoatCategoryId) startGoatBracket(state.currentGoatCategoryId);
  }

  function goToGoatCategoriesFromResult() {
    document.getElementById('goat-result-overlay').classList.remove('show');
    goToGoatCategories();
  }

  function setGoatEraMode(eraId) {
    if (!GOAT_ERA_MODES.find(mode => mode.id === eraId)) return;
    state.currentGoatEra = eraId;
    renderGoatEraTabs();
    renderGoatCategories();
  }

  async function shareGoatResult() {
    const winner = state.goatHistory[state.goatHistory.length - 1]?.winner;
    if (!winner || !state.currentGoatCategory) return;
    const modeLabel = GOAT_ERA_MODES.find(mode => mode.id === state.currentGoatEra)?.label || 'GOAT';
    const text = `Мій GOAT у режимі ${modeLabel}: ${winner.n} (${state.currentGoatCategory.name})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Football Legends ${GOAT_UI_LABEL}`, text });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(text);
      alert('Результат скопійовано');
    } catch {
      alert(text);
    }
  }

  return { GOAT_ERA_MODES, goToGoatCategories, startGoatBracket, playGoatAgain, goToGoatCategoriesFromResult, setGoatEraMode, shareGoatResult };
}
