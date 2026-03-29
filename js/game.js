import {
  TEAMS,
  ROUNDS,
  STATS_LEADERBOARDS,
  STATS_CATEGORY_LOGOS,
  STATS_ENTITY_MEDIA,
  GOAT_CATEGORIES,
  GOAT_SPECIAL_BRACKETS,
  PLAYER_WIKI_TITLES,
  getTier,
  TIER_LABELS,
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
let pendingLeaveTarget = 'era';
let currentStatsScope = 'players';
const currentStatsCategory = {
  players: 'ballon-dor',
  clubs: 'ucl-clubs',
  national: 'world-cup-national',
};
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
const GOAT_UI_LABEL = 'GOAT-СІТКА';
const PLAYER_NAME_ALIASES = {
  'Lionel Messi': 'Messi',
  'Cristiano Ronaldo': 'Cristiano',
  'Luka Modrić': 'Modrić',
  'Toni Kroos': 'Kroos',
  'Andrés Iniesta': 'Iniesta',
  'Iker Casillas': 'Casillas',
  'Fernando Torres': 'Torres',
  'Cesc Fàbregas': 'Fàbregas',
  'Marco van Basten': 'Van Basten',
  'Michel Platini': 'Platini',
  'Johan Cruyff': 'Cruyff',
  'Gerd Müller': 'G. Müller',
  'Pelé': 'Pelé',
};
const TEAM_NAME_ALIASES = {
  liverpool: ['Liverpool', 'Liverpool FC'],
  'real madrid': ['Real Madrid'],
  'fc barcelona': ['FC Barcelona', 'Barcelona'],
  'bayern munich': ['Bayern Munich', 'Bayern'],
  'manchester united': ['Manchester United', 'Man United'],
  'іспанія': ['Іспанія'],
  'франція': ['Франція'],
  'германія': ['Германія', 'Німеччина'],
  'аргентина': ['Аргентина'],
  'бразилія': ['Бразилія'],
  'італія': ['Італія'],
};

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function normalizeEntityName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`".]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function getInitials(label) {
  return String(label || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

function buildPlayerLookup() {
  const map = new Map();
  const allPools = [
    ...GOAT_CATEGORIES.map(category => category.players),
    ...GOAT_SPECIAL_BRACKETS.map(category => category.players),
  ];

  allPools.flat().forEach(player => {
    const key = normalizeEntityName(player.n);
    if (!map.has(key)) map.set(key, player);
  });

  Object.entries(STATS_ENTITY_MEDIA.players).forEach(([name, media]) => {
    const key = normalizeEntityName(name);
    const base = map.get(key) || {};
    map.set(key, { ...base, n: name, ...media });
  });

  Object.entries(PLAYER_NAME_ALIASES).forEach(([fullName, alias]) => {
    const aliasKey = normalizeEntityName(alias);
    const fullKey = normalizeEntityName(fullName);
    if (map.has(aliasKey) && !map.has(fullKey)) map.set(fullKey, map.get(aliasKey));
    if (map.has(fullKey) && !map.has(aliasKey)) map.set(aliasKey, map.get(fullKey));
  });

  return map;
}

function buildTeamLookup() {
  const map = new Map();
  TEAMS.forEach(team => {
    const variants = new Set([
      normalizeEntityName(team.name),
      normalizeEntityName(getTeamDisplayName(team)),
      normalizeEntityName(team.shortName || ''),
    ]);
    const aliasEntry = TEAM_NAME_ALIASES[normalizeEntityName(team.name)] || [];
    aliasEntry.forEach(alias => variants.add(normalizeEntityName(alias)));
    variants.forEach(variant => {
      if (variant && !map.has(variant)) map.set(variant, team);
    });
  });
  return map;
}

const statsPlayerLookup = buildPlayerLookup();
const statsTeamLookup = buildTeamLookup();

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
  label.className = `battle-topline popup-kicker ${won ? 'win' : 'lose'}`;
  box.className = `flash-box battle-box popup-shell popup-shell-center popup-surface popup-surface-battle ${won ? 'win' : 'lose'}`;

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
  const tier = getTier(player.stat);
  return `
    <button class="goat-player-card ${side} ${tier}" data-goat-player="${escapeHtml(player.id)}">
      <div class="goat-player-tier">${escapeHtml(TIER_LABELS[tier])}</div>
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
  document.getElementById('goat-screen-title').textContent = currentGoatCategory?.shortName || GOAT_UI_LABEL;
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
        title: `Football Legends ${GOAT_UI_LABEL}`,
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

export function goToPlay() {
  document.getElementById('result-overlay').classList.remove('show');
  document.getElementById('goat-result-overlay').classList.remove('show');
  document.getElementById('round-flash').classList.remove('show');
  selectedTeamId = null;
  pendingRoundAdvance = false;
  document.getElementById('confirm-bar').classList.remove('show');
  goTo('play');
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

function getStatsScopeData(scope = currentStatsScope) {
  return STATS_LEADERBOARDS[scope] || STATS_LEADERBOARDS.players;
}

function getStatsActiveCategory(scope = currentStatsScope) {
  const scopeData = getStatsScopeData(scope);
  const fallback = scopeData.categories[0]?.id;
  const activeId = currentStatsCategory[scope];
  const exists = scopeData.categories.some(category => category.id === activeId);
  return scopeData.categories.find(category => category.id === (exists ? activeId : fallback)) || scopeData.categories[0];
}

function getStatsEntityMedia(scope, name) {
  const normalizedName = normalizeEntityName(name);
  const scopedMedia = STATS_ENTITY_MEDIA[scope]?.[name];

  if (scope === 'players') {
    const player = statsPlayerLookup.get(normalizedName) || scopedMedia;
    return {
      type: 'player',
      label: player?.avatar || scopedMedia?.avatar || getInitials(name),
      wikiTitle: player?.wikiTitle || scopedMedia?.wikiTitle || '',
      accent: player?.accent || scopedMedia?.accent || 'rgba(255,255,255,0.08)',
    };
  }

  const team = statsTeamLookup.get(normalizedName);
  const media = scopedMedia || {};
  return {
    type: 'team',
    label: media.short || team?.emoji || getInitials(name),
    crest: media.crest || team?.crest || '',
    accent: media.accent || team?.bg || 'rgba(255,255,255,0.08)',
  };
}

function createStatsEntityArt(scope, row) {
  const media = getStatsEntityMedia(scope, row.name);
  if (media.type === 'player') {
    const wikiTitleAttr = media.wikiTitle ? ` data-wiki-title="${escapeHtml(media.wikiTitle)}"` : '';
    return `
      <div class="stats-record-art stats-record-art-player" style="--stats-accent:${media.accent}" data-player-name="${escapeHtml(row.name)}"${wikiTitleAttr}>
        <span>${escapeHtml(media.label)}</span>
      </div>
    `;
  }

  if (media.crest) {
    return `
      <div class="stats-record-art stats-record-art-team" style="--stats-accent:${media.accent}">
        <img src="${media.crest}" alt="${escapeHtml(row.name)} logo" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <span>${escapeHtml(media.label)}</span>
      </div>
    `;
  }

  return `
    <div class="stats-record-art stats-record-art-team" style="--stats-accent:${media.accent}">
      <span>${escapeHtml(media.label)}</span>
    </div>
  `;
}

function createStatsCompetitionBadge(category) {
  const logo = STATS_CATEGORY_LOGOS[category.id] || { src: '' };
  return `
    <div class="stats-competition-badge">
      ${logo.src ? `<img class="stats-competition-logo" src="${logo.src}" alt="${escapeHtml(category.label)}" loading="lazy" onerror="this.style.display='none';">` : ''}
    </div>
  `;
}

function createStatsRow(scope, category, row) {
  return `
    <button class="stats-record-row" type="button" data-stats-entity="${escapeHtml(row.name)}" data-stats-scope="${escapeHtml(scope)}">
      <div class="stats-record-rank-wrap">
        <div class="stats-record-rank">${row.rank}</div>
      </div>
      ${createStatsEntityArt(scope, row)}
      <div class="stats-record-copy">
        <div class="stats-record-name">${escapeHtml(row.name)}</div>
        <div class="stats-record-meta">${escapeHtml(row.meta)}</div>
      </div>
      <div class="stats-record-value">${escapeHtml(row.value)}</div>
    </button>
  `;
}

function renderStatsScopeTabs() {
  const tabs = document.getElementById('stats-scope-tabs');
  if (!tabs) return;

  const items = [
    { id: 'players', label: 'Гравці' },
    { id: 'clubs', label: 'Клуби' },
    { id: 'national', label: 'Збірні' },
  ];

  tabs.innerHTML = items
    .map(item => `<button class="filter-tab${item.id === currentStatsScope ? ' active' : ''}" type="button" data-stats-scope="${item.id}">${item.label}</button>`)
    .join('');
}

function renderStatsCategoryTabs() {
  const tabs = document.getElementById('stats-category-tabs');
  if (!tabs) return;

  const scopeData = getStatsScopeData();
  tabs.innerHTML = scopeData.categories
    .map(category => {
      return `<button class="filter-tab stats-filter-tab${category.id === getStatsActiveCategory()?.id ? ' active' : ''}" type="button" data-stats-category="${category.id}"><span>${category.label}</span></button>`;
    })
    .join('');
}

function renderStatsContent() {
  const scopeData = getStatsScopeData();
  const activeCategory = getStatsActiveCategory();
  if (!scopeData || !activeCategory) return;
  const board = document.getElementById('stats-leaderboard');

  if (board) {
    board.innerHTML = `
      <div class="stats-leaderboard-card">
        <div class="stats-leaderboard-head">
          <div>
            <div class="stats-leaderboard-label">${escapeHtml(activeCategory.label)}</div>
            <div class="stats-leaderboard-title">Топ-5</div>
          </div>
          <div class="stats-leaderboard-mark">
            ${createStatsCompetitionBadge(activeCategory)}
          </div>
        </div>
        <div class="stats-record-list stats-record-list-divided">
          ${activeCategory.rows.map(row => createStatsRow(currentStatsScope, activeCategory, row)).join('')}
        </div>
      </div>
    `;
    enhancePlayerPhotos(board);
  }
}

function getStatsEntitySummary(scope, entityName) {
  const scopeData = getStatsScopeData(scope);
  const normalizedName = normalizeEntityName(entityName);
  return scopeData.categories
    .map(category => {
      const row = category.rows.find(item => normalizeEntityName(item.name) === normalizedName);
      if (!row) return null;
      return {
        category,
        row,
      };
    })
    .filter(Boolean);
}

function getEntityAppearances(scope, entityName) {
  const normalizedName = normalizeEntityName(entityName);
  if (scope === 'players') {
    return TEAMS
      .filter(team => team.players.some(player => normalizeEntityName(player.n) === normalizedName))
      .slice(0, 4);
  }

  const matchedTeam = statsTeamLookup.get(normalizedName);
  const matchedName = matchedTeam ? normalizeEntityName(matchedTeam.name) : normalizedName;
  const matchedDisplayName = matchedTeam ? normalizeEntityName(getTeamDisplayName(matchedTeam)) : normalizedName;
  return TEAMS
    .filter(team => normalizeEntityName(team.name) === matchedName || normalizeEntityName(getTeamDisplayName(team)) === matchedDisplayName)
    .slice(0, 4);
}

function createProfileStatRow(item) {
  return `
    <div class="stats-profile-stat">
      ${createStatsCompetitionBadge(item.category)}
      <div class="stats-profile-stat-copy">
        <div class="stats-profile-stat-name">${escapeHtml(item.category.label)}</div>
        <div class="stats-profile-stat-meta">${escapeHtml(item.row.meta)}</div>
      </div>
      <div class="stats-profile-stat-value">${escapeHtml(item.row.value)}</div>
    </div>
  `;
}

function createAppearanceCard(team) {
  return `
    <div class="stats-profile-appearance">
      ${createTeamBadge(team)}
      <div class="stats-profile-appearance-copy">
        <div class="stats-profile-appearance-name">${escapeHtml(getTeamDisplayName(team))}</div>
        <div class="stats-profile-appearance-meta">${escapeHtml(getTeamSeasonLabel(team))}</div>
      </div>
    </div>
  `;
}

export function openStatsProfile(entityName, scope = currentStatsScope) {
  const summary = getStatsEntitySummary(scope, entityName);
  if (!summary.length) return;

  const overlay = document.getElementById('stats-profile-overlay');
  const head = document.getElementById('stats-profile-head');
  const body = document.getElementById('stats-profile-body');
  const primary = summary[0];
  const appearances = getEntityAppearances(scope, entityName);
  const art = createStatsEntityArt(scope, primary.row);

  head.innerHTML = `
    <div class="stats-profile-media">${art}</div>
    <div class="stats-profile-copy">
      <div class="stats-profile-kicker">${scope === 'players' ? 'Профіль гравця' : scope === 'clubs' ? 'Профіль клубу' : 'Профіль збірної'}</div>
      <div class="stats-profile-title">${escapeHtml(primary.row.name)}</div>
      <div class="stats-profile-meta">${escapeHtml(primary.row.meta)}</div>
    </div>
  `;

  body.innerHTML = `
    <div class="stats-profile-section">
      <div class="stats-profile-section-title">Головні рекорди</div>
      <div class="stats-profile-stats">
        ${summary.map(createProfileStatRow).join('')}
      </div>
    </div>
    ${appearances.length ? `
      <div class="stats-profile-section">
        <div class="stats-profile-section-title">${scope === 'players' ? 'Є в режимі Епохи' : 'Доступно в підбірці команд'}</div>
        <div class="stats-profile-appearances">
          ${appearances.map(createAppearanceCard).join('')}
        </div>
      </div>
    ` : ''}
  `;

  enhancePlayerPhotos(head);
  overlay.classList.add('show');
}

export function closeStatsProfile() {
  document.getElementById('stats-profile-overlay')?.classList.remove('show');
}

export function renderStatsScreen() {
  renderStatsScopeTabs();
  renderStatsCategoryTabs();
  renderStatsContent();
  closeStatsProfile();
}

export function setStatsScope(scope) {
  if (!STATS_LEADERBOARDS[scope]) return;
  currentStatsScope = scope;
  renderStatsScreen();
}

export function setStatsCategory(categoryId) {
  const scopeData = getStatsScopeData();
  if (!scopeData.categories.some(category => category.id === categoryId)) return;
  currentStatsCategory[currentStatsScope] = categoryId;
  renderStatsScreen();
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
    const statVals = el.querySelectorAll('.card-stat-val');
    if (rating) rating.textContent = chosenPlayer.stat;
    if (statVals[0]) statVals[0].textContent = chosenPlayer.atk;
    if (statVals[1]) statVals[1].textContent = chosenPlayer.def;
    if (statVals[2]) statVals[2].textContent = chosenPlayer.spd;
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
  headline.className = 'result-headline popup-title ' + (win ? 'win' : 'lose');
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
  pendingLeaveTarget = target;
  const dialog = document.getElementById('leave-match-dialog');
  if (typeof dialog.showModal === 'function') {
    if (dialog.open) return;
    dialog.showModal();
    return;
  }

  pendingRoundAdvance = false;
  document.getElementById('round-flash').classList.remove('show');
  goTo(target);
}

export function cancelLeave() {
  const dialog = document.getElementById('leave-match-dialog');
  if (dialog?.open) dialog.close('cancel');
}

export function proceedLeave() {
  const dialog = document.getElementById('leave-match-dialog');
  if (dialog?.open) dialog.close('confirm');
  pendingRoundAdvance = false;
  document.getElementById('round-flash').classList.remove('show');
  goTo(pendingLeaveTarget);
}
