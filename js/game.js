import {
  TEAMS,
  ROUNDS,
  GOAT_CATEGORIES,
  GOAT_SPECIAL_BRACKETS,
  PLAYER_WIKI_TITLES,
  getTier,
  getPlayerAvatar,
  getTeamDisplayName,
  getTeamSeasonLabel,
} from './data.js';

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
const playerPhotoCache = new Map();

const GOAT_ERA_MODES = [
  { id: 'categories', label: 'Категорії' },
  { id: 'bestxi', label: 'Best XI' },
  { id: '1980s', label: '80-ті' },
  { id: '1990s', label: '90-ті' },
  { id: '2000s', label: '2000-ні' },
  { id: '2010s', label: '2010-ні' },
  { id: '2020s', label: '2020-ні' },
];

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function getPlayerWikiTitle(teamId, playerName) {
  return PLAYER_WIKI_TITLES[`${teamId}:${playerName}`] || null;
}

function getPhotoCandidatesForWikiTitle(wikiTitle) {
  if (!wikiTitle) return [];
  const encodedTitle = encodeURIComponent(wikiTitle);
  return [
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
    `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=pageimages&format=json&piprop=original|thumbnail&pithumbsize=512&titles=${encodedTitle}`,
    `https://en.wikipedia.org/w/api.php?action=query&origin=*&prop=images&imlimit=12&format=json&titles=${encodedTitle}`,
  ];
}

function getPlayerPhotoCandidates(teamId, playerName) {
  return getPhotoCandidatesForWikiTitle(getPlayerWikiTitle(teamId, playerName));
}

async function fetchPlayerPhoto(teamId, playerName) {
  const cacheKey = `${teamId}:${playerName}`;
  if (playerPhotoCache.has(cacheKey)) return playerPhotoCache.get(cacheKey);

  const candidates = getPlayerPhotoCandidates(teamId, playerName);
  if (!candidates.length) {
    playerPhotoCache.set(cacheKey, null);
    return null;
  }

  const photoPromise = (async () => {
    try {
      const summaryRes = await fetch(candidates[0]);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        const summaryPhoto = data?.originalimage?.source || data?.thumbnail?.source;
        if (summaryPhoto) return summaryPhoto;
      }
    } catch {}

    try {
      const fallbackRes = await fetch(candidates[1]);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const page = Object.values(data?.query?.pages || {})[0];
        const fallbackPhoto = page?.original?.source || page?.thumbnail?.source || null;
        if (fallbackPhoto) return fallbackPhoto;
      }
    } catch {}

    try {
      const imageListRes = await fetch(candidates[2]);
      if (!imageListRes.ok) return null;
      const data = await imageListRes.json();
      const page = Object.values(data?.query?.pages || {})[0];
      const image = (page?.images || []).find(item => {
        const title = item?.title || '';
        return title.startsWith('File:')
          && !/logo|crest|flag|icon|symbol/i.test(title)
          && /\.(jpe?g|png|webp)$/i.test(title);
      });
      if (!image?.title) return null;

      return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(image.title.replace(/^File:/, ''))}?width=640`;
    } catch {
      return null;
    }
  })();

  playerPhotoCache.set(cacheKey, photoPromise);
  const photoUrl = await photoPromise;
  playerPhotoCache.set(cacheKey, photoUrl);
  return photoUrl;
}

async function fetchPhotoByWikiTitle(wikiTitle) {
  const cacheKey = `wiki:${wikiTitle}`;
  if (playerPhotoCache.has(cacheKey)) return playerPhotoCache.get(cacheKey);

  const candidates = getPhotoCandidatesForWikiTitle(wikiTitle);
  if (!candidates.length) {
    playerPhotoCache.set(cacheKey, null);
    return null;
  }

  const photoPromise = (async () => {
    try {
      const summaryRes = await fetch(candidates[0]);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        const summaryPhoto = data?.originalimage?.source || data?.thumbnail?.source;
        if (summaryPhoto) return summaryPhoto;
      }
    } catch {}

    try {
      const fallbackRes = await fetch(candidates[1]);
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const page = Object.values(data?.query?.pages || {})[0];
        const fallbackPhoto = page?.original?.source || page?.thumbnail?.source || null;
        if (fallbackPhoto) return fallbackPhoto;
      }
    } catch {}

    return null;
  })();

  playerPhotoCache.set(cacheKey, photoPromise);
  const photoUrl = await photoPromise;
  playerPhotoCache.set(cacheKey, photoUrl);
  return photoUrl;
}

function enhancePlayerPhotos(root = document) {
  root.querySelectorAll('[data-player-name]').forEach(async wrap => {
    if (wrap.dataset.loaded === '1') return;
    wrap.dataset.loaded = '1';

    const photoUrl = wrap.dataset.wikiTitle
      ? await fetchPhotoByWikiTitle(wrap.dataset.wikiTitle)
      : await fetchPlayerPhoto(wrap.dataset.teamId, wrap.dataset.playerName);
    if (!photoUrl) return;

    const imgClass = wrap.classList.contains('card-photo-wrap') ? 'card-photo' : '';
    wrap.innerHTML = `<img class="${imgClass}" src="${photoUrl}" alt="${escapeHtml(wrap.dataset.playerName)}" loading="lazy" referrerpolicy="no-referrer">`;
  });
}

function createFaceMarkup(team, player, className = '') {
  return `
    <div class="${className}" data-team-id="${escapeHtml(team.id)}" data-player-name="${escapeHtml(player.n)}">
      <span>${escapeHtml(getPlayerAvatar(player))}</span>
    </div>
  `;
}

function createWikiFaceMarkup(player, className = '') {
  return `
    <div class="${className}" data-player-name="${escapeHtml(player.n)}" data-wiki-title="${escapeHtml(player.wikiTitle)}">
      <span>${escapeHtml(getPlayerAvatar(player))}</span>
    </div>
  `;
}

function createTeamBadge(team) {
  const fallback = escapeHtml(team.emoji || team.name[0]);
  return `
    <div class="team-crest" style="background:${team.bg}">
      <img class="team-crest-img" src="${team.crest}" alt="${escapeHtml(team.name)} logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="team-crest-fallback">${fallback}</span>
    </div>
  `;
}

function createPlayerCard(team, player, index) {
  const tier = getTier(player.stat);

  return `
    <article class="player-card ${tier} anim-in" style="animation-delay:${index * 0.07}s">
      <div class="card-art"></div>
      <div class="card-top">
        <div>
          <div class="card-rating">${player.stat}</div>
          <div class="card-pos">${escapeHtml(player.pos)}</div>
        </div>
        <div class="card-crest-mini">
          <img src="${team.crest}" alt="${escapeHtml(team.name)} crest" loading="lazy">
        </div>
      </div>
      <div class="card-photo-wrap" data-team-id="${escapeHtml(team.id)}" data-player-name="${escapeHtml(player.n)}">
        <span class="card-avatar-initials">${escapeHtml(getPlayerAvatar(player))}</span>
      </div>
      <div class="card-name">${escapeHtml(player.n)}</div>
      <div class="card-stats">
        <div class="card-stat">
          <span class="card-stat-val">${player.atk}</span>
          <span class="card-stat-lbl">ATK</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-val">${player.def}</span>
          <span class="card-stat-lbl">DEF</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-val">${player.spd}</span>
          <span class="card-stat-lbl">SPD</span>
        </div>
      </div>
    </article>
  `;
}

function renderBattleOverlay(myPlayer, oppPlayer, myVal, oppVal, won) {
  const flash = document.getElementById('round-flash');
  const label = document.getElementById('flash-label');
  const detail = document.getElementById('flash-detail');
  const meCard = document.getElementById('battle-me-card');
  const oppCard = document.getElementById('battle-opp-card');
  const box = document.getElementById('battle-box');

  label.textContent = won ? 'ДУЕЛЬ ВИГРАНО' : 'ДУЕЛЬ ПРОГРАНО';
  label.className = `battle-topline ${won ? 'win' : 'lose'}`;
  box.className = `flash-box battle-box ${won ? 'win' : 'lose'}`;

  meCard.className = 'battle-card me' + (won ? ' win' : ' lose');
  oppCard.className = 'battle-card opp' + (won ? ' lose' : ' win');

  const metric = getRoundMetric(ROUNDS[currentRound].key);

  meCard.innerHTML = `
    ${createFaceMarkup(currentTeam, myPlayer, 'battle-face')}
    <div class="battle-name">${escapeHtml(myPlayer.n)}</div>
    <div class="battle-team">${escapeHtml(getTeamDisplayName(currentTeam))}</div>
    <div class="battle-statline">
      <div class="battle-stat">${myVal}</div>
      <div class="battle-stat-label">${metric}</div>
    </div>
  `;

  oppCard.innerHTML = `
    ${createFaceMarkup(oppTeam, oppPlayer, 'battle-face')}
    <div class="battle-name">${escapeHtml(oppPlayer.n)}</div>
    <div class="battle-team">${escapeHtml(getTeamDisplayName(oppTeam))}</div>
    <div class="battle-statline">
      <div class="battle-stat">${Math.max(oppVal, 70)}</div>
      <div class="battle-stat-label">${metric}</div>
    </div>
  `;

  detail.innerHTML = `
    <span class="battle-detail-copy">${won ? 'Твій гравець переграв суперника' : 'Суперник забрав дуель'}</span>
    <span class="battle-detail-score">${escapeHtml(myPlayer.n)} <strong class="${won ? 'win' : 'lose'}">${myVal}</strong> vs ${escapeHtml(oppPlayer.n)} <strong class="${won ? 'lose' : 'win'}">${Math.max(oppVal, 70)}</strong></span>
  `;
  enhancePlayerPhotos(flash);
  flash.classList.add('show');
}

function getRoundMetric(roundKey) {
  if (roundKey === 'attack') return 'ATK';
  if (roundKey === 'defense') return 'DEF';
  if (roundKey === 'set') return 'SET';
  if (roundKey === 'tactics') return 'IQ';
  return 'PEN';
}

function getRoundValue(player, roundKey) {
  if (roundKey === 'attack') return player.atk;
  if (roundKey === 'defense') return player.def;
  if (roundKey === 'set') return Math.round(player.atk * 0.6 + player.spd * 0.4);
  if (roundKey === 'tactics') return Math.round(player.stat * 0.45 + player.def * 0.25 + player.atk * 0.3);
  return Math.round(player.atk * 0.45 + player.spd * 0.55);
}

function getPreferredPositions(roundKey) {
  if (roundKey === 'attack') return ['НАП', 'ПАП', 'ПП', 'ЛП'];
  if (roundKey === 'defense') return ['ЦЗ', 'ЛБ', 'ПБ', 'ВРТ'];
  if (roundKey === 'set') return ['ЦП', 'ПАП', 'ПП', 'ЛП', 'НАП'];
  if (roundKey === 'tactics') return ['ЦП', 'ЦЗ', 'ЛБ', 'ПБ', 'ВРТ'];
  return ['НАП', 'ПАП', 'ПП', 'ЛП', 'ЦП'];
}

function getRoundPositionWeight(player, roundKey) {
  const pos = player.pos;

  if (roundKey === 'attack') {
    if (['НАП', 'ПАП', 'ПП', 'ЛП'].includes(pos)) return 18;
    if (['ЦП'].includes(pos)) return 8;
    if (['ЛБ', 'ПБ'].includes(pos)) return 2;
    if (pos === 'ВРТ') return -20;
    return 0;
  }

  if (roundKey === 'defense') {
    if (['ЦЗ', 'ЛБ', 'ПБ', 'ВРТ'].includes(pos)) return 18;
    if (['ЦП'].includes(pos)) return 8;
    if (['НАП', 'ПАП', 'ПП', 'ЛП'].includes(pos)) return -6;
    return 0;
  }

  if (roundKey === 'set') {
    if (['ЦП', 'ПАП', 'ПП', 'ЛП', 'НАП'].includes(pos)) return 14;
    if (['ЛБ', 'ПБ'].includes(pos)) return 6;
    if (pos === 'ВРТ') return -18;
    return 0;
  }

  if (roundKey === 'tactics') {
    if (['ЦП', 'ЦЗ', 'ЛБ', 'ПБ'].includes(pos)) return 14;
    if (['НАП', 'ПАП', 'ПП', 'ЛП'].includes(pos)) return 4;
    if (pos === 'ВРТ') return 2;
    return 0;
  }

  if (['НАП', 'ПАП', 'ПП', 'ЛП', 'ЦП'].includes(pos)) return 14;
  if (['ЦЗ', 'ЛБ', 'ПБ'].includes(pos)) return 2;
  if (pos === 'ВРТ') return -16;
  return 0;
}

function getPlayersForRound(team, roundKey) {
  const preferred = new Set(getPreferredPositions(roundKey));
  const ranked = [...team.players]
    .sort((a, b) => {
      const aScore = getRoundValue(a, roundKey) + getRoundPositionWeight(a, roundKey);
      const bScore = getRoundValue(b, roundKey) + getRoundPositionWeight(b, roundKey);
      if (bScore !== aScore) return bScore - aScore;
      return b.stat - a.stat;
    });
  const selected = [];
  const seen = new Set();

  ranked.forEach(player => {
    if (selected.length >= 4) return;
    if (!preferred.has(player.pos)) return;
    selected.push(player);
    seen.add(player.n);
  });

  ranked.forEach(player => {
    if (selected.length >= 4) return;
    if (seen.has(player.n)) return;
    selected.push(player);
    seen.add(player.n);
  });

  return selected;
}

function getOpponentForRound(team, roundKey) {
  const pool = getPlayersForRound(team, roundKey);
  const topSlice = pool.slice(0, Math.min(3, pool.length));
  const source = topSlice.length ? topSlice : pool;
  return source[Math.floor(Math.random() * source.length)] || team.players[0];
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
  return `
    <button class="goat-player-card ${side}" data-goat-player="${escapeHtml(player.id)}">
      <div class="goat-player-rank">${player.stat}</div>
      <div class="goat-player-country">${escapeHtml(player.country || '')}</div>
      ${createWikiFaceMarkup(player, 'goat-player-face')}
      <div class="goat-player-name">${escapeHtml(player.n)}</div>
      <div class="goat-player-tag">${escapeHtml(player.tag)}</div>
      <div class="goat-player-stats">
        <span>ATK ${player.atk}</span>
        <span>DEF ${player.def}</span>
        <span>SPD ${player.spd}</span>
      </div>
    </button>
  `;
}

function renderGoatBracketTrack() {
  const track = document.getElementById('goat-bracket-track');
  const totalStages = goatBracketSize ? Math.log2(goatBracketSize) : 4;
  track.innerHTML = '';

  for (let i = 0; i < totalStages; i++) {
    const pairs = goatRounds[i]?.length || Math.max(1, goatBracketSize / (2 ** (i + 1)));
    const pill = document.createElement('div');
    pill.className = 'goat-stage-pill';
    if (i === goatRoundIndex) pill.classList.add('active');
    if (i < goatRoundIndex) pill.classList.add('done');
    pill.innerHTML = `
      <span class="goat-stage-name">${getGoatStageName(pairs)}</span>
      <span class="goat-stage-count">${pairs} пар</span>
    `;
    track.appendChild(pill);
  }
}

function renderGoatHistory() {
  const list = document.getElementById('goat-history-list');
  if (!goatHistory.length) {
    list.innerHTML = '<div class="goat-history-empty">Перший вибір ще попереду. Сітка чекає на твій вердикт.</div>';
    return;
  }

  list.innerHTML = goatHistory
    .map(item => `
      <div class="goat-history-item">
        <span class="goat-history-stage">${escapeHtml(item.stage)}</span>
        <span class="goat-history-result">${escapeHtml(item.winner.n)} переміг ${escapeHtml(item.loser.n)}</span>
      </div>
    `)
    .join('');
}

function renderGoatRound() {
  const currentPairs = goatRounds[goatRoundIndex] || [];
  const pair = currentPairs[goatPairIndex];
  if (!pair) return;

  const stageName = getGoatStageName(currentPairs.length);
  document.getElementById('goat-screen-title').textContent = currentGoatCategory?.shortName || 'GOAT BRACKET';
  const modeLabel = GOAT_ERA_MODES.find(mode => mode.id === currentGoatEra)?.label || 'GOAT';
  document.getElementById('goat-category-label').textContent = `${currentGoatCategory?.name || 'Категорія'} · ${modeLabel}`;
  document.getElementById('goat-stage-title').textContent = stageName;
  document.getElementById('goat-progress').textContent = `Пара ${goatPairIndex + 1} з ${currentPairs.length}`;
  document.getElementById('goat-round-badge').textContent = `${goatPairIndex + 1}/${currentPairs.length}`;

  renderGoatBracketTrack();
  renderGoatHistory();

  const pairWrap = document.getElementById('goat-pair');
  pairWrap.innerHTML = `
    ${createGoatPlayerCard(pair[0], 'left')}
    <div class="goat-versus">VS</div>
    ${createGoatPlayerCard(pair[1], 'right')}
  `;
  pairWrap.querySelectorAll('[data-goat-player]').forEach(btn => {
    btn.addEventListener('click', () => chooseGoatWinner(btn.dataset.goatPlayer));
  });
  enhancePlayerPhotos(pairWrap);
}

function advanceGoatBracket() {
  goatPairIndex++;

  const currentPairs = goatRounds[goatRoundIndex];
  if (goatPairIndex < currentPairs.length) {
    renderGoatRound();
    return;
  }

  if (goatRoundWinners.length === 1) {
    showGoatResult(goatRoundWinners[0]);
    return;
  }

  const nextRound = [];
  for (let i = 0; i < goatRoundWinners.length; i += 2) {
    nextRound.push([goatRoundWinners[i], goatRoundWinners[i + 1]]);
  }

  goatRounds.push(nextRound);
  goatRoundIndex++;
  goatPairIndex = 0;
  goatRoundWinners = [];
  renderGoatRound();
}

function chooseGoatWinner(playerId) {
  const currentPairs = goatRounds[goatRoundIndex] || [];
  const pair = currentPairs[goatPairIndex];
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

  goatRoundWinners.push(winner);
  goatHistory.push({
    stage: getGoatStageName(currentPairs.length),
    winner,
    loser,
  });
  renderGoatHistory();

  setTimeout(() => {
    advanceGoatBracket();
  }, 260);
}

function showGoatResult(winner) {
  const overlay = document.getElementById('goat-result-overlay');
  document.getElementById('goat-res-headline').textContent = `ТВІЙ GOAT: ${winner.n.toUpperCase()}`;
  document.getElementById('goat-res-subline').textContent = `${winner.n} виграв сітку в категорії «${currentGoatCategory.name}».`;
  document.getElementById('goat-res-trophy').textContent = winner.avatar || '👑';
  document.getElementById('goat-result-card').innerHTML = `
    <div class="goat-result-winner">
      ${createWikiFaceMarkup(winner, 'goat-result-face')}
      <div class="goat-result-name">${escapeHtml(winner.n)}</div>
      <div class="goat-result-meta">${escapeHtml(winner.country || '')} · ${escapeHtml(winner.tag || '')}</div>
    </div>
  `;
  document.getElementById('goat-result-path').innerHTML = goatHistory
    .map(item => `<div class="goat-result-step"><span>${escapeHtml(item.stage)}</span><strong>${escapeHtml(item.winner.n)}</strong> vs ${escapeHtml(item.loser.n)}</div>`)
    .join('');
  enhancePlayerPhotos(overlay);
  overlay.classList.add('show');
}

export async function shareGoatResult() {
  const winner = goatHistory[goatHistory.length - 1]?.winner;
  if (!winner || !currentGoatCategory) return;

  const modeLabel = GOAT_ERA_MODES.find(mode => mode.id === currentGoatEra)?.label || 'GOAT';
  const text = `Мій GOAT у режимі ${modeLabel}: ${winner.n} (${currentGoatCategory.name})`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Football Legends GOAT Bracket',
        text,
      });
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

// ── Navigation ──
export function goTo(screenId) {
  const current = document.querySelector('.screen.active');
  const next = document.getElementById('screen-' + screenId);
  if (!next || current === next) return;

  current.classList.add('exit');
  setTimeout(() => current.classList.remove('active', 'exit'), 250);
  next.classList.add('active');
  currentScreen = screenId;

  // Show/hide global nav
  const nav = document.getElementById('bottom-nav');
  if (screenId === 'match' || screenId === 'era' || screenId === 'goat-cats' || screenId === 'goat') {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
    updateNavActive(screenId);
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
  const indicator = document.getElementById('nav-indicator');
  if (!nav || !indicator || !activeBtn) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = activeBtn.getBoundingClientRect();
  const left = btnRect.left - navRect.left + 1;
  const width = btnRect.width - 2;
  indicator.style.left = left + 'px';
  indicator.style.width = width + 'px';
}

export function goToEra() {
  selectedTeamId = null;
  document.getElementById('confirm-bar').classList.remove('show');
  renderTeams(TEAMS);
  goTo('era');
}

export function goToGoatCategories() {
  document.getElementById('goat-result-overlay').classList.remove('show');
  renderGoatCategories();
  renderGoatEraTabs();
  goTo('goat-cats');
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

function renderGoatCategories() {
  const list = document.getElementById('goat-categories');
  if (currentGoatEra === 'categories') {
    list.innerHTML = GOAT_CATEGORIES.map(createGoatCategoryCard).join('');
    return;
  }

  const special = GOAT_SPECIAL_BRACKETS.find(item => item.id === currentGoatEra);
  list.innerHTML = special ? createGoatSpecialCard(special, 0) : '';
}

function renderGoatEraTabs() {
  const tabs = document.getElementById('goat-era-tabs');
  tabs.innerHTML = GOAT_ERA_MODES
    .map(mode => `<button class="filter-tab${mode.id === currentGoatEra ? ' active' : ''}" data-goat-era="${mode.id}">${mode.label}</button>`)
    .join('');
}

export function startGoatBracket(categoryId) {
  const category = currentGoatEra === 'categories'
    ? GOAT_CATEGORIES.find(item => item.id === categoryId)
    : GOAT_SPECIAL_BRACKETS.find(item => item.id === currentGoatEra);
  if (!category) return;

  currentGoatCategoryId = categoryId;
  currentGoatCategory = {
    ...category,
    players: category.players.map(player => ({ ...player })),
  };
  goatRounds = [seedGoatPairs(currentGoatCategory.players)];
  goatRoundIndex = 0;
  goatPairIndex = 0;
  goatRoundWinners = [];
  goatHistory = [];
  goatBracketSize = currentGoatCategory.players.length;
  document.getElementById('goat-result-overlay').classList.remove('show');
  goTo('goat');
  renderGoatRound();
}

export function playGoatAgain() {
  document.getElementById('goat-result-overlay').classList.remove('show');
  if (currentGoatCategoryId) startGoatBracket(currentGoatCategoryId);
}

export function goToGoatCategoriesFromResult() {
  document.getElementById('goat-result-overlay').classList.remove('show');
  goToGoatCategories();
}

export function setGoatEraMode(eraId) {
  if (!GOAT_ERA_MODES.find(mode => mode.id === eraId)) return;
  currentGoatEra = eraId;
  renderGoatEraTabs();
  renderGoatCategories();
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
      ${createTeamBadge(team)}
      <div class="team-row-info">
        <div class="team-row-name">${getTeamDisplayName(team)}</div>
        <div class="team-row-year">${getTeamSeasonLabel(team)} · Зірка: ${team.star}</div>
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
  document.getElementById('confirm-bar-btn').textContent = `Грати за ${getTeamDisplayName(team)}`;
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
  pendingRoundAdvance = false;

  document.getElementById('sb-my-crest').src = myT.crest;
  document.getElementById('sb-opp-crest').src = oppT.crest;
  document.getElementById('sb-my-name').innerHTML = `
    <span class="sb-club-name">${escapeHtml(getTeamDisplayName(myT))}</span>
    <span class="sb-club-year">${escapeHtml(getTeamSeasonLabel(myT))}</span>
  `;
  document.getElementById('sb-opp-name').innerHTML = `
    <span class="sb-club-name">${escapeHtml(getTeamDisplayName(oppT))}</span>
    <span class="sb-club-year">${escapeHtml(getTeamSeasonLabel(oppT))}</span>
  `;
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
  list.className = 'player-pick-grid';
  list.innerHTML = '';
  getPlayersForRound(currentTeam, r.key).forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'player-pick';
    div.innerHTML = createPlayerCard(currentTeam, p, i);
    div.addEventListener('click', () => pickPlayer(div, p));
    list.appendChild(div);
  });
  enhancePlayerPhotos(list);
}

export function pickPlayer(el, p) {
  document.querySelectorAll('.player-pick').forEach(d => {
    d.classList.remove('chosen');
    d.querySelector('.player-card')?.classList.remove('chosen');
  });
  el.classList.add('chosen');
  el.querySelector('.player-card')?.classList.add('chosen');
  chosenPlayer = { ...p };
  document.getElementById('fight-btn').disabled = false;
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

export function useBooster() {
  if (!chosenPlayer || boosterCount <= 0) return;
  boosterCount--;
  chosenPlayer.stat = Math.min(99, chosenPlayer.stat + 12);
  chosenPlayer.atk = Math.min(99, chosenPlayer.atk + 6);
  chosenPlayer.def = Math.min(99, chosenPlayer.def + 6);
  chosenPlayer.spd = Math.min(99, chosenPlayer.spd + 6);
  document.getElementById('booster-count').textContent = boosterCount;
  if (boosterCount === 0) document.getElementById('booster-btn').disabled = true;

  document.querySelectorAll('.player-pick.chosen .player-card').forEach(el => {
    el.classList.add('boosted');
    const rating = el.querySelector('.card-rating');
    if (rating) rating.textContent = chosenPlayer.stat;
  });
  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
}

export function resolveRound() {
  if (!chosenPlayer) return;

  const round = ROUNDS[currentRound];
  const myVal = getRoundValue(chosenPlayer, round.key);
  const oppPlayer = getOpponentForRound(oppTeam, round.key);
  const oppBase = getRoundValue(oppPlayer, round.key);
  const oppVal = oppBase + Math.floor(Math.random() * 10) - 3;
  const won = myVal >= oppVal;

  roundResults.push(won);
  if (won) myScore++; else oppScore++;

  document.getElementById('sb-my-score').textContent = myScore;
  document.getElementById('sb-opp-score').textContent = oppScore;

  renderBattleOverlay(chosenPlayer, oppPlayer, myVal, oppVal, won);
  pendingRoundAdvance = true;

  const tg = window.Telegram?.WebApp;
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(won ? 'success' : 'error');

  document.getElementById('fight-btn').disabled = true;
}

export function acknowledgeBattle() {
  if (!pendingRoundAdvance) return;
  pendingRoundAdvance = false;
  document.getElementById('round-flash').classList.remove('show');
  currentRound++;
  if (currentRound >= 5) {
    setTimeout(showResult, 180);
  } else {
    renderRound();
  }
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

export function confirmLeave(target = 'era') {
  if (confirm('Вийти з матчу? Прогрес буде втрачено.')) {
    pendingRoundAdvance = false;
    document.getElementById('round-flash').classList.remove('show');
    goTo(target);
  }
}
