import {
  TEAMS,
  STATS_ENTITY_MEDIA,
  GOAT_CATEGORIES,
  GOAT_SPECIAL_BRACKETS,
  PLAYER_WIKI_TITLES,
  getPlayerAvatar,
  getTeamDisplayName,
} from '../data.js';
import { escapeHtml, normalizeEntityName } from './utils.js';

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

const playerPhotoCache = new Map();

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

export const statsPlayerLookup = buildPlayerLookup();
export const statsTeamLookup = buildTeamLookup();

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

export function enhancePlayerPhotos(root = document) {
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

export function createFaceMarkup(team, player, className = '') {
  return `
    <div class="${className}" data-team-id="${escapeHtml(team.id)}" data-player-name="${escapeHtml(player.n)}">
      <span>${escapeHtml(getPlayerAvatar(player))}</span>
    </div>
  `;
}

export function createWikiFaceMarkup(player, className = '') {
  return `
    <div class="${className}" data-player-name="${escapeHtml(player.n)}" data-wiki-title="${escapeHtml(player.wikiTitle)}">
      <span>${escapeHtml(getPlayerAvatar(player))}</span>
    </div>
  `;
}

export function createTeamBadge(team) {
  const fallback = escapeHtml(team.emoji || team.name[0]);
  return `
    <div class="team-crest" style="background:${team.bg}">
      <img class="team-crest-img" src="${team.crest}" alt="${escapeHtml(team.name)} logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <span class="team-crest-fallback">${fallback}</span>
    </div>
  `;
}

export function createTeamStarBadge(team) {
  const starPlayer = team.players.find(player => player.n === team.star) || { n: team.star, avatar: '⭐' };
  return `
    <div class="team-row-star">
      ${createFaceMarkup(team, starPlayer, 'team-row-star-face')}
      <div class="team-row-star-name">${escapeHtml(team.star)}</div>
    </div>
  `;
}
