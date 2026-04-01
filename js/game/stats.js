import { TEAMS, STATS_LEADERBOARDS, STATS_CATEGORY_LOGOS, STATS_ENTITY_MEDIA, getTeamDisplayName, getTeamSeasonLabel } from '../data.js';
import { escapeHtml, normalizeEntityName, getInitials } from './utils.js';
import { statsPlayerLookup, statsTeamLookup, enhancePlayerPhotos, createTeamBadge } from './media.js';

export function createStatsController(state) {
  function getStatsScopeData(scope = state.currentStatsScope) {
    return STATS_LEADERBOARDS[scope] || STATS_LEADERBOARDS.players;
  }

  function getStatsActiveCategory(scope = state.currentStatsScope) {
    const scopeData = getStatsScopeData(scope);
    const fallback = scopeData.categories[0]?.id;
    const activeId = state.currentStatsCategory[scope];
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
      .map(item => `<button class="filter-tab${item.id === state.currentStatsScope ? ' active' : ''}" type="button" data-stats-scope="${item.id}">${item.label}</button>`)
      .join('');
  }

  function renderStatsCategoryTabs() {
    const tabs = document.getElementById('stats-category-tabs');
    if (!tabs) return;
    const scopeData = getStatsScopeData();
    tabs.innerHTML = scopeData.categories
      .map(category => `<button class="filter-tab stats-filter-tab${category.id === getStatsActiveCategory()?.id ? ' active' : ''}" type="button" data-stats-category="${category.id}"><span>${category.label}</span></button>`)
      .join('');
  }

  function renderStatsContent() {
    const scopeData = getStatsScopeData();
    const activeCategory = getStatsActiveCategory();
    if (!scopeData || !activeCategory) return;
    const board = document.getElementById('stats-leaderboard');
    if (!board) return;
    board.innerHTML = `
      <div class="stats-leaderboard-card">
        <div class="stats-leaderboard-head">
          <div>
            <div class="stats-leaderboard-label">${escapeHtml(activeCategory.label)}</div>
            <div class="stats-leaderboard-title">Топ-5</div>
          </div>
          <div class="stats-leaderboard-mark">${createStatsCompetitionBadge(activeCategory)}</div>
        </div>
        <div class="stats-record-list stats-record-list-divided">
          ${activeCategory.rows.map(row => createStatsRow(state.currentStatsScope, activeCategory, row)).join('')}
        </div>
      </div>
    `;
    enhancePlayerPhotos(board);
  }

  function getStatsEntitySummary(scope, entityName) {
    const scopeData = getStatsScopeData(scope);
    const normalizedName = normalizeEntityName(entityName);
    return scopeData.categories
      .map(category => {
        const row = category.rows.find(item => normalizeEntityName(item.name) === normalizedName);
        return row ? { category, row } : null;
      })
      .filter(Boolean);
  }

  function getEntityAppearances(scope, entityName) {
    const normalizedName = normalizeEntityName(entityName);
    if (scope === 'players') {
      return TEAMS.filter(team => team.players.some(player => normalizeEntityName(player.n) === normalizedName)).slice(0, 4);
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

  function openStatsProfile(entityName, scope = state.currentStatsScope) {
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
        <div class="stats-profile-stats">${summary.map(createProfileStatRow).join('')}</div>
      </div>
      ${appearances.length ? `
        <div class="stats-profile-section">
          <div class="stats-profile-section-title">${scope === 'players' ? 'Є в режимі Епохи' : 'Доступно в підбірці команд'}</div>
          <div class="stats-profile-appearances">${appearances.map(createAppearanceCard).join('')}</div>
        </div>
      ` : ''}
    `;
    enhancePlayerPhotos(head);
    overlay.classList.add('show');
  }

  function closeStatsProfile() {
    document.getElementById('stats-profile-overlay')?.classList.remove('show');
  }

  function renderStatsScreen() {
    renderStatsScopeTabs();
    renderStatsCategoryTabs();
    renderStatsContent();
    closeStatsProfile();
  }

  function setStatsScope(scope) {
    if (!STATS_LEADERBOARDS[scope]) return;
    state.currentStatsScope = scope;
    renderStatsScreen();
  }

  function setStatsCategory(categoryId) {
    const scopeData = getStatsScopeData();
    if (!scopeData.categories.some(category => category.id === categoryId)) return;
    state.currentStatsCategory[state.currentStatsScope] = categoryId;
    renderStatsScreen();
  }

  return { openStatsProfile, closeStatsProfile, renderStatsScreen, setStatsScope, setStatsCategory };
}
