import { getTeamDisplayName } from '../data.js';
import { escapeHtml, getInitials } from './utils.js';

let achievementToastTimer = null;
const PROFILE_STORAGE_KEY = 'football-legends-profile-v1';
let profileState = loadProfileState();

function createDefaultProfileState() {
  return {
    matchesPlayed: 0,
    matchesWon: 0,
    bestWinStreak: 0,
    currentWinStreak: 0,
    quizSets: 0,
    quizCorrect: 0,
    quizQuestions: 0,
    quizBestScore: 0,
    dreamBuilds: 0,
    dreamBestAverage: 0,
    goatRuns: 0,
    modeCounts: {
      era: 0,
      goat: 0,
      dream: 0,
      quiz: 0,
    },
    teamCounts: {},
    goatWinnerCounts: {},
    recent: [],
  };
}

function loadProfileState() {
  const base = createDefaultProfileState();
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      modeCounts: { ...base.modeCounts, ...(parsed.modeCounts || {}) },
      teamCounts: { ...(parsed.teamCounts || {}) },
      goatWinnerCounts: { ...(parsed.goatWinnerCounts || {}) },
      recent: Array.isArray(parsed.recent) ? parsed.recent.slice(0, 6) : [],
    };
  } catch {
    return base;
  }
}

function saveProfileState() {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileState));
  } catch {}
}

function touchProfileRender(currentScreen) {
  saveProfileState();
  if (currentScreen === 'profile') renderProfileScreen();
}

function incrementProfileCounter(bucket, key) {
  bucket[key] = (bucket[key] || 0) + 1;
}

function pushProfileActivity(entry) {
  profileState.recent.unshift({
    ...entry,
    timestamp: Date.now(),
  });
  profileState.recent = profileState.recent.slice(0, 6);
}

function getTopEntry(bucket) {
  const entries = Object.entries(bucket || {});
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
}

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.round(hours / 24);
  return `${days} дн тому`;
}

function getProfileLevel(points) {
  return Math.max(1, Math.floor(points / 40) + 1);
}

function getProfileTitle(level) {
  if (level >= 10) return 'Icon Tier';
  if (level >= 7) return 'Captain Run';
  if (level >= 4) return 'First Team';
  return 'Rookie Season';
}

function recordModeUsage(mode) {
  profileState.modeCounts[mode] = (profileState.modeCounts[mode] || 0) + 1;
}

function getProfileAchievements(quizAccuracy, winRate) {
  return [
    {
      id: 'first-match',
      rarity: 'core',
      icon: '🏟️',
      title: 'Перший свисток',
      copy: 'Заверши свій перший матч у режимі Епохи.',
      unlocked: profileState.matchesPlayed >= 1,
    },
    {
      id: 'streak-3',
      rarity: 'rare',
      icon: '🔥',
      title: 'On Fire',
      copy: 'Збери серію з 3 перемог у матчах епох.',
      unlocked: profileState.bestWinStreak >= 3,
    },
    {
      id: 'quiz-master',
      rarity: 'rare',
      icon: '🧠',
      title: 'Quiz Master',
      copy: 'Досягни 80% середньої точності в квізах.',
      unlocked: profileState.quizSets >= 1 && quizAccuracy >= 80,
    },
    {
      id: 'goat-crown',
      rarity: 'epic',
      icon: '👑',
      title: 'Crown Picker',
      copy: 'Заверши хоча б одну GOAT-сітку до фіналу.',
      unlocked: profileState.goatRuns >= 1,
    },
    {
      id: 'dream-architect',
      rarity: 'core',
      icon: '🧩',
      title: 'Dream Architect',
      copy: 'Збери перший повний Dream XI.',
      unlocked: profileState.dreamBuilds >= 1,
    },
    {
      id: 'centurion',
      rarity: 'epic',
      icon: '💯',
      title: 'Centurion',
      copy: 'Набери 100 XP points у профілі.',
      unlocked: (profileState.matchesWon * 12 + profileState.quizCorrect * 2 + profileState.goatRuns * 10 + profileState.dreamBuilds * 8) >= 100,
    },
    {
      id: 'veteran',
      rarity: 'rare',
      icon: '🎖️',
      title: 'Veteran Run',
      copy: 'Проведи 10 сесій у будь-яких режимах.',
      unlocked: (profileState.matchesPlayed + profileState.quizSets + profileState.dreamBuilds + profileState.goatRuns) >= 10,
    },
    {
      id: 'ice-cold',
      rarity: 'legendary',
      icon: '🥶',
      title: 'Ice Cold',
      copy: 'Тримай вінрейт 70%+ після 5 матчів.',
      unlocked: profileState.matchesPlayed >= 5 && winRate >= 70,
    },
  ];
}

function getAchievementRarityLabel(rarity) {
  return {
    core: 'Core',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  }[rarity] || 'Core';
}

function getAchievementProgress(achievement, quizAccuracy, winRate) {
  switch (achievement.id) {
    case 'first-match':
      return { current: Math.min(profileState.matchesPlayed, 1), target: 1, label: `${profileState.matchesPlayed}/1 матч` };
    case 'streak-3':
      return { current: Math.min(profileState.bestWinStreak, 3), target: 3, label: `${profileState.bestWinStreak}/3 win streak` };
    case 'quiz-master':
      return { current: Math.min(quizAccuracy, 80), target: 80, label: `${quizAccuracy}% / 80% accuracy` };
    case 'goat-crown':
      return { current: Math.min(profileState.goatRuns, 1), target: 1, label: `${profileState.goatRuns}/1 GOAT run` };
    case 'dream-architect':
      return { current: Math.min(profileState.dreamBuilds, 1), target: 1, label: `${profileState.dreamBuilds}/1 Dream XI` };
    case 'centurion': {
      const points = profileState.matchesWon * 12 + profileState.quizCorrect * 2 + profileState.goatRuns * 10 + profileState.dreamBuilds * 8;
      return { current: Math.min(points, 100), target: 100, label: `${points}/100 XP` };
    }
    case 'veteran': {
      const totalRuns = profileState.matchesPlayed + profileState.quizSets + profileState.dreamBuilds + profileState.goatRuns;
      return { current: Math.min(totalRuns, 10), target: 10, label: `${totalRuns}/10 сесій` };
    }
    case 'ice-cold':
      return {
        current: profileState.matchesPlayed >= 5 ? Math.min(winRate, 70) : profileState.matchesPlayed,
        target: profileState.matchesPlayed >= 5 ? 70 : 5,
        label: profileState.matchesPlayed >= 5 ? `${winRate}% / 70% winrate` : `${profileState.matchesPlayed}/5 матчів`,
      };
    default:
      return { current: 0, target: 1, label: 'Locked' };
  }
}

function getUnlockedAchievementIds() {
  const quizAccuracy = profileState.quizQuestions ? Math.round((profileState.quizCorrect / profileState.quizQuestions) * 100) : 0;
  const winRate = profileState.matchesPlayed ? Math.round((profileState.matchesWon / profileState.matchesPlayed) * 100) : 0;
  return new Set(getProfileAchievements(quizAccuracy, winRate).filter(item => item.unlocked).map(item => item.id));
}

function maybeShowNewAchievement(previousUnlocked) {
  const quizAccuracy = profileState.quizQuestions ? Math.round((profileState.quizCorrect / profileState.quizQuestions) * 100) : 0;
  const winRate = profileState.matchesPlayed ? Math.round((profileState.matchesWon / profileState.matchesPlayed) * 100) : 0;
  const latest = getProfileAchievements(quizAccuracy, winRate).find(item => item.unlocked && !previousUnlocked.has(item.id));
  if (latest) showAchievementToast(latest);
}

function showAchievementToast(achievement) {
  const toast = document.getElementById('achievement-toast');
  const icon = document.getElementById('achievement-toast-icon');
  const title = document.getElementById('achievement-toast-title');
  const kicker = toast?.querySelector('.achievement-toast-kicker');
  if (!toast || !icon || !title || !kicker) return;

  toast.dataset.rarity = achievement.rarity || 'core';
  icon.textContent = achievement.icon || '🏆';
  title.textContent = achievement.title;
  kicker.textContent = `${getAchievementRarityLabel(achievement.rarity || 'core')} badge unlocked`;
  toast.classList.remove('hide');
  void toast.offsetWidth;
  toast.classList.add('show');

  if (achievementToastTimer) clearTimeout(achievementToastTimer);
  achievementToastTimer = setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hide');
    achievementToastTimer = null;
  }, 2600);
}

export function recordMatchProfile({ win, currentTeam, myScore, oppScore, currentScreen }) {
  const previousUnlocked = getUnlockedAchievementIds();
  profileState.matchesPlayed += 1;
  profileState.matchesWon += win ? 1 : 0;
  profileState.currentWinStreak = win ? profileState.currentWinStreak + 1 : 0;
  profileState.bestWinStreak = Math.max(profileState.bestWinStreak, profileState.currentWinStreak);
  recordModeUsage('era');
  if (currentTeam) incrementProfileCounter(profileState.teamCounts, currentTeam.shortName || currentTeam.name);
  pushProfileActivity({
    mode: 'Епохи',
    icon: '🏟️',
    title: win ? 'Перемога в матчі епох' : 'Матч епох завершено',
    copy: `${getTeamDisplayName(currentTeam)} · рахунок ${myScore}:${oppScore}`,
    accent: win ? 'win' : 'loss',
  });
  maybeShowNewAchievement(previousUnlocked);
  touchProfileRender(currentScreen);
}

export function recordQuizProfile({ currentQuizPack, currentQuizScore, currentScreen }) {
  if (!currentQuizPack) return;
  const previousUnlocked = getUnlockedAchievementIds();
  const total = currentQuizPack.questions.length;
  const percent = total ? Math.round((currentQuizScore / total) * 100) : 0;
  profileState.quizSets += 1;
  profileState.quizCorrect += currentQuizScore;
  profileState.quizQuestions += total;
  profileState.quizBestScore = Math.max(profileState.quizBestScore, percent);
  recordModeUsage('quiz');
  pushProfileActivity({
    mode: 'Quiz',
    icon: '🧠',
    title: `${currentQuizPack.title} · ${currentQuizScore}/${total}`,
    copy: `${percent}% правильних відповідей у сеті`,
    accent: percent >= 80 ? 'win' : 'neutral',
  });
  maybeShowNewAchievement(previousUnlocked);
  touchProfileRender(currentScreen);
}

export function recordDreamProfile({ team, average, currentScreen }) {
  const previousUnlocked = getUnlockedAchievementIds();
  profileState.dreamBuilds += 1;
  profileState.dreamBestAverage = Math.max(profileState.dreamBestAverage, average);
  recordModeUsage('dream');
  if (team) incrementProfileCounter(profileState.teamCounts, team.shortName || team.name);
  pushProfileActivity({
    mode: 'Dream XI',
    icon: '🧩',
    title: `${team?.shortName || 'Dream XI'} завершено`,
    copy: `Середній рейтинг складу ${average}`,
    accent: average >= 90 ? 'win' : 'neutral',
  });
  maybeShowNewAchievement(previousUnlocked);
  touchProfileRender(currentScreen);
}

export function recordGoatProfile({ winner, currentGoatCategory, currentScreen }) {
  if (!winner) return;
  const previousUnlocked = getUnlockedAchievementIds();
  profileState.goatRuns += 1;
  recordModeUsage('goat');
  incrementProfileCounter(profileState.goatWinnerCounts, winner.n);
  pushProfileActivity({
    mode: 'GOAT',
    icon: '👑',
    title: `${winner.n} виграв сітку`,
    copy: currentGoatCategory ? `Категорія: ${currentGoatCategory.name}` : 'GOAT-Сітка завершена',
    accent: 'win',
  });
  maybeShowNewAchievement(previousUnlocked);
  touchProfileRender(currentScreen);
}

export function renderProfileScreen() {
  const hero = document.getElementById('profile-hero-card');
  const kpis = document.getElementById('profile-kpi-grid');
  const achievements = document.getElementById('profile-achievement-grid');
  const focus = document.getElementById('profile-focus-card');
  const modes = document.getElementById('profile-mode-grid');
  const activity = document.getElementById('profile-activity-list');
  if (!hero || !kpis || !achievements || !focus || !modes || !activity) return;

  const totalSessions = profileState.matchesPlayed + profileState.quizSets + profileState.dreamBuilds + profileState.goatRuns;
  const quizAccuracy = profileState.quizQuestions ? Math.round((profileState.quizCorrect / profileState.quizQuestions) * 100) : 0;
  const winRate = profileState.matchesPlayed ? Math.round((profileState.matchesWon / profileState.matchesPlayed) * 100) : 0;
  const points = profileState.matchesWon * 12 + profileState.quizCorrect * 2 + profileState.goatRuns * 10 + profileState.dreamBuilds * 8;
  const level = getProfileLevel(points);
  const favoriteMode = getTopEntry(profileState.modeCounts)?.[0] || 'era';
  const favoriteModeLabel = {
    era: 'Епохи',
    goat: 'GOAT-Сітка',
    dream: 'Dream XI',
    quiz: 'Quiz',
  }[favoriteMode] || 'Епохи';
  const favoriteTeam = getTopEntry(profileState.teamCounts)?.[0] || 'Ще не визначено';
  const topGoat = getTopEntry(profileState.goatWinnerCounts)?.[0] || 'Ще без чемпіона';
  const achievementItems = getProfileAchievements(quizAccuracy, winRate);

  hero.innerHTML = `
    <div class="profile-avatar">${escapeHtml(getInitials('Football Legends') || 'FL')}</div>
    <div class="profile-hero-copy">
      <div class="profile-kicker">Player Identity</div>
      <div class="profile-name-row">
        <div class="profile-name">Гравець FL</div>
        <div class="profile-level-chip">Level ${level}</div>
      </div>
      <div class="profile-sub">${escapeHtml(getProfileTitle(level))} · ${totalSessions ? `зіграно ${totalSessions} сесій` : 'Почни з першого режиму і профіль оживе автоматично.'}</div>
    </div>
    <div class="profile-hero-stats">
      <div class="profile-hero-stat">
        <strong>${escapeHtml(points)}</strong>
        <span>XP points</span>
      </div>
      <div class="profile-hero-stat">
        <strong>${escapeHtml(favoriteModeLabel)}</strong>
        <span>Main mode</span>
      </div>
      <div class="profile-hero-stat">
        <strong>${escapeHtml(winRate)}%</strong>
        <span>Match winrate</span>
      </div>
    </div>
  `;

  kpis.innerHTML = [
    { label: 'Матчі', value: profileState.matchesPlayed, desc: `${profileState.matchesWon} перемог · ${winRate}% вінрейт` },
    { label: 'Quiz Accuracy', value: `${quizAccuracy}%`, desc: `${profileState.quizCorrect}/${profileState.quizQuestions || 0} правильних відповідей` },
    { label: 'Best Streak', value: profileState.bestWinStreak || 0, desc: 'Найкраща серія перемог у матчах епох' },
    { label: 'Dream XI', value: profileState.dreamBuilds, desc: `Найкращий середній рейтинг ${profileState.dreamBestAverage || 0}` },
  ].map(item => `
    <div class="profile-kpi-card">
      <div class="profile-kpi-label">${escapeHtml(item.label)}</div>
      <div class="profile-kpi-value">${escapeHtml(item.value)}</div>
      <div class="profile-kpi-desc">${escapeHtml(item.desc)}</div>
    </div>
  `).join('');

  achievements.innerHTML = achievementItems.map(item => {
    const progress = getAchievementProgress(item, quizAccuracy, winRate);
    const progressPct = Math.max(0, Math.min(100, Math.round((progress.current / Math.max(progress.target, 1)) * 100)));
    const rarityLabel = getAchievementRarityLabel(item.rarity || 'core');
    return `
      <div class="profile-achievement-card ${item.unlocked ? 'unlocked' : 'locked'}" data-rarity="${escapeHtml(item.rarity || 'core')}">
        <div class="profile-achievement-topline">
          <div class="profile-achievement-tier">${escapeHtml(rarityLabel)}</div>
          <div class="profile-achievement-state">${item.unlocked ? 'Unlocked' : 'In progress'}</div>
        </div>
        <div class="profile-achievement-icon">${escapeHtml(item.icon)}</div>
        <div class="profile-achievement-title">${escapeHtml(item.title)}</div>
        <div class="profile-achievement-copy">${escapeHtml(item.copy)}</div>
        <div class="profile-achievement-progress">
          <div class="profile-achievement-progress-bar">
            <span style="width:${progressPct}%"></span>
          </div>
          <div class="profile-achievement-progress-copy">${item.unlocked ? `${escapeHtml(rarityLabel)} unlocked` : escapeHtml(progress.label)}</div>
        </div>
        <div class="profile-achievement-status">${item.unlocked ? String(item.rarity || 'core').toUpperCase() : 'Locked'}</div>
      </div>
    `;
  }).join('');

  focus.innerHTML = `
    <div class="profile-section-head">
      <div>
        <div class="profile-section-kicker">Play Style</div>
        <div class="profile-section-title">Твій стиль гри</div>
      </div>
    </div>
    <div class="profile-focus-grid">
      <div class="profile-focus-block">
        <div class="profile-focus-title">${escapeHtml(favoriteModeLabel)}</div>
        <div class="profile-focus-copy">Найчастіше ти повертаєшся саме сюди. Це твій головний режим і центр прогресу.</div>
        <div class="profile-pill-row">
          <div class="profile-pill">Улюблена команда: ${escapeHtml(favoriteTeam)}</div>
          <div class="profile-pill">Твій GOAT: ${escapeHtml(topGoat)}</div>
        </div>
      </div>
      <div class="profile-focus-stats">
        <div class="profile-focus-stat">
          <strong>${escapeHtml(profileState.goatRuns)}</strong>
          <span>завершених GOAT-сіток</span>
        </div>
        <div class="profile-focus-stat">
          <strong>${escapeHtml(totalSessions)}</strong>
          <span>усього сесій у грі</span>
        </div>
      </div>
    </div>
  `;

  modes.innerHTML = [
    { accent: 'era', label: 'Епохи', value: profileState.matchesWon, copy: `${profileState.matchesPlayed} матчів · ${winRate}% вінрейт` },
    { accent: 'goat', label: 'GOAT-Сітка', value: profileState.goatRuns, copy: 'Сіток доведено до фінального вибору' },
    { accent: 'dream', label: 'Dream XI', value: profileState.dreamBuilds, copy: `Топ середній рейтинг ${profileState.dreamBestAverage || 0}` },
    { accent: 'quiz', label: 'Football Quiz', value: profileState.quizSets, copy: `${quizAccuracy}% середня точність` },
  ].map(item => `
    <div class="profile-mode-card" data-accent="${escapeHtml(item.accent)}">
      <div class="profile-mode-label">${escapeHtml(item.label)}</div>
      <div class="profile-mode-value">${escapeHtml(item.value)}</div>
      <div class="profile-mode-copy">${escapeHtml(item.copy)}</div>
    </div>
  `).join('');

  activity.innerHTML = profileState.recent.length
    ? profileState.recent.map(item => `
      <div class="profile-activity-item" data-accent="${escapeHtml(item.accent || 'neutral')}">
        <div class="profile-activity-icon">${escapeHtml(item.icon || '⚽')}</div>
        <div>
          <div class="profile-activity-title">${escapeHtml(item.title)}</div>
          <div class="profile-activity-copy">${escapeHtml(item.copy)}</div>
        </div>
        <div class="profile-activity-meta">${escapeHtml(formatRelativeTime(item.timestamp))}</div>
      </div>
    `).join('')
    : `<div class="profile-empty-state">Зіграйте перший матч, квіз або Dream XI. Після цього тут з’являться живі результати та історія проходжень.</div>`;
}
