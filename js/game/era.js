import { TEAMS, ROUNDS, getTier, getPlayerAvatar, getTeamDisplayName, getTeamSeasonLabel } from '../data.js';
import { escapeHtml } from './utils.js';
import { enhancePlayerPhotos, createFaceMarkup, createTeamBadge, createTeamStarBadge } from './media.js';
import { recordMatchProfile } from './profile.js';

const TEAM_SPOTLIGHTS = {
  psg25: 'Перша по-справжньому цілісна версія PSG: не лише зірки, а структура, пресинг і глибина.',
  mancity23: 'Тріплет Гвардіоли, де контроль м’яча став зброєю, а не просто стилем.',
  barca11: 'Один із найчистіших піків позиційного футболу в історії гри.',
  inter10: 'Команда, яка вибила Барсу й закрила тріплет через дисципліну, вертикаль і холод.',
  chelsea12: 'Аутсайдерський чемпіонський похід у ЛЧ, який тримався на характері й великих сейвах.',
  real17: 'Перша команда ери ЛЧ, що захистила титул і зробила це з шаленою глибиною складу.',
  bayern20: 'Флік довів Баварію до тріплету на максимальному темпі й тотальному пресингу.',
  liverpool19: 'Пік енергії Клоппа: темп, пресинг і великі вечори в Європі.',
  barca06: 'Ранній великий Барселонський цикл, де магія Роналдіньйо задала тон цілій епосі.',
  barca09: 'Секступл Гвардіоли, який перезібрав уявлення про домінування.',
  milan03: 'Мілан, де інтелект, баланс і досвід були сильнішими за хаос.',
  real02: 'Галактікос у їхньому романтичному піку: стиль, вага і великі особистості.',
  juventus03: 'Машина Ліппі, що душила темп і змушувала суперника грати за її правилами.',
  porto04: 'Один із найвідоміших андердог-тріумфів Ліги чемпіонів.',
  liverpool05: 'Команда, яку назавжди пам’ятають через Стамбул і неможливе повернення.',
  arsenal04: 'Непереможні Венгера: сезон Прем’єр-ліги без жодної поразки.',
  manutd08: 'Пік пізнього Фергюсона: темп, глибина і баланс навколо Роналду.',
  spain08: 'Покоління, яке запустило золоту еру збірної Іспанії.',
  manutd99: 'Тріплет Фергюсона й один із найзнаковіших камбеків у фіналі ЛЧ.',
  spain10: 'Чемпіони світу, які зробили контроль м’яча мовою великого турніру.',
  france18: 'Збірна, яка виграла ЧС завдяки темпу, вертикалі і холоднокровності в плей-оф.',
  germany14: 'Німеччина Льова на піку структури, глибини й турнірної зрілості.',
  france98: 'Перше чемпіонство світу для Франції й народження команди епохи Зідана.',
  france00: 'Рідкісний випадок, коли чемпіон світу одразу забрав і Євро.',
  italy06: 'Оборонна майстерність, турнірна холодність і великий Buffon-Cannavaro run.',
  brazil02: 'Остання чемпіонська Бразилія з тріо Ronaldo, Rivaldo і Ronaldinho.',
  argentina22: 'Найемоційніша збірна турніру, яка довела історію Мессі до титулу.',
  real22: 'Команда серії ремонтад, яка зламала одразу кілька грандів на шляху до кубка.',
  chelsea21: 'Тухель за кілька місяців зібрав із Челсі одну з найщільніших оборон Європи.',
  bayern13: 'Тріплет, де Роббен і Рібері стали обличчям домінації Баварії.',
};

export function createEraController(state, { goTo, goToEra }) {
  function getTeamSpotlight(team) {
    return TEAM_SPOTLIGHTS[team.id] || team.abilityDesc || 'Команда з яскравою ідентичністю, великим ядром і власним сценарієм матчу.';
  }

  function getTeamLineupCoords(players) {
    const spreadLine = (linePlayers, y, left = 18, right = 82) => {
      if (!linePlayers.length) return [];
      if (linePlayers.length === 1) return [{ player: linePlayers[0], coords: { x: 50, y } }];
      const step = (right - left) / (linePlayers.length - 1);
      return linePlayers.map((player, index) => ({ player, coords: { x: left + step * index, y } }));
    };

    const gk = players.filter(player => player.pos === 'ВРТ');
    const defenders = players.filter(player => ['ЛБ', 'ЦЗ', 'ПБ'].includes(player.pos));
    const midfielders = players.filter(player => player.pos === 'ЦП');
    const creators = players.filter(player => player.pos === 'ПАП');
    const wingers = players.filter(player => ['ЛП', 'ПП'].includes(player.pos));
    const strikers = players.filter(player => player.pos === 'НАП');
    const placements = new Map();
    [
      ...spreadLine(gk, 86, 50, 50),
      ...spreadLine(defenders, 68, defenders.length >= 5 ? 12 : 18, defenders.length >= 5 ? 88 : 82),
      ...spreadLine(midfielders, 48, 24, 76),
      ...spreadLine(creators, 31, 38, 62),
      ...spreadLine(wingers, 22, 22, 78),
      ...spreadLine(strikers, 14, 38, 62),
    ].forEach(({ player, coords }) => placements.set(player, coords));
    return players.map(player => placements.get(player) || { x: 50, y: 50 });
  }

  function createTeamLineupMarker(team, player, coords, classPrefix) {
    const isStar = player.n === team.star;
    return `
      <div class="${classPrefix}-node${isStar ? ' is-star' : ''}" style="left:${coords.x}%; top:${coords.y}%;">
        <div class="${classPrefix}-face-wrap">
          ${createFaceMarkup(team, player, `${classPrefix}-face`)}
          ${isStar ? `<div class="${classPrefix}-star-badge">★</div>` : ''}
        </div>
        <div class="${classPrefix}-player-name">${escapeHtml(player.n)}</div>
        <div class="${classPrefix}-player-pos">${escapeHtml(player.pos)}</div>
      </div>
    `;
  }

  function getTeamStartingXI(team) {
    return team.lineup || team.players;
  }

  function openTeamLineup(teamId) {
    const team = TEAMS.find(item => item.id === teamId);
    const overlay = document.getElementById('team-lineup-overlay');
    const head = document.getElementById('team-lineup-head');
    const pitch = document.getElementById('team-lineup-pitch');
    if (!team || !overlay || !head || !pitch) return;
    head.innerHTML = `
      <div class="team-lineup-kicker">Склад</div>
      <div class="team-lineup-title">${escapeHtml(getTeamDisplayName(team))}</div>
      <div class="team-lineup-meta">${escapeHtml(getTeamSeasonLabel(team))} · ядро команди</div>
    `;
    const lineup = getTeamStartingXI(team);
    const coords = getTeamLineupCoords(lineup);
    pitch.innerHTML = `
      <div class="team-lineup-pitch-canvas">
        <div class="pitch-penalty pitch-penalty-top"></div>
        <div class="pitch-penalty pitch-penalty-bottom"></div>
        <div class="pitch-six-yard pitch-six-yard-top"></div>
        <div class="pitch-six-yard pitch-six-yard-bottom"></div>
        <div class="pitch-center-circle"></div>
        <div class="pitch-center-spot"></div>
        ${lineup.map((player, index) => createTeamLineupMarker(team, player, coords[index], 'team-lineup')).join('')}
      </div>
    `;
    enhancePlayerPhotos(pitch);
    overlay.classList.add('show');
  }

  function closeTeamLineup() {
    document.getElementById('team-lineup-overlay')?.classList.remove('show');
  }

  function renderEraLineupScreen(team) {
    const hero = document.getElementById('era-lineup-hero');
    const pitch = document.getElementById('era-lineup-pitch');
    const lineup = getTeamStartingXI(team);
    const coords = getTeamLineupCoords(lineup);
    if (!hero || !pitch) return;
    document.getElementById('era-lineup-screen-title').textContent = getTeamDisplayName(team);
    document.getElementById('era-lineup-screen-subtitle').textContent = `${getTeamSeasonLabel(team)} · стартовий склад`;
    document.getElementById('btn-era-lineup-play').textContent = `ГРАТИ ЗА ${getTeamDisplayName(team).toUpperCase()}`;
    hero.innerHTML = `
      <div class="era-lineup-hero-top">
        ${createTeamBadge(team)}
        <div>
          <div class="era-lineup-kicker">Твоя команда</div>
          <div class="era-lineup-title">${escapeHtml(getTeamDisplayName(team))}</div>
          <div class="era-lineup-meta">${escapeHtml(getTeamSeasonLabel(team))} · рейтинг ${team.rating} · зірка ${escapeHtml(team.star)}</div>
        </div>
      </div>
    `;
    pitch.innerHTML = `
      <div class="era-lineup-pitch-canvas">
        <div class="pitch-penalty pitch-penalty-top"></div>
        <div class="pitch-penalty pitch-penalty-bottom"></div>
        <div class="pitch-six-yard pitch-six-yard-top"></div>
        <div class="pitch-six-yard pitch-six-yard-bottom"></div>
        <div class="pitch-center-circle"></div>
        <div class="pitch-center-spot"></div>
        ${lineup.map((player, index) => createTeamLineupMarker(team, player, coords[index], 'era-lineup')).join('')}
      </div>
    `;
    enhancePlayerPhotos(pitch);
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
          <div class="card-stat"><span class="card-stat-val">${player.atk}</span><span class="card-stat-lbl">ATK</span></div>
          <div class="card-stat"><span class="card-stat-val">${player.def}</span><span class="card-stat-lbl">DEF</span></div>
          <div class="card-stat"><span class="card-stat-val">${player.spd}</span><span class="card-stat-lbl">SPD</span></div>
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
    const metric = getRoundMetric(ROUNDS[state.currentRound].key);
    meCard.innerHTML = `${createFaceMarkup(state.currentTeam, myPlayer, 'battle-face')}<div class="battle-name">${escapeHtml(myPlayer.n)}</div><div class="battle-team">${escapeHtml(getTeamDisplayName(state.currentTeam))}</div><div class="battle-statline"><div class="battle-stat">${myVal}</div><div class="battle-stat-label">${metric}</div></div>`;
    oppCard.innerHTML = `${createFaceMarkup(state.oppTeam, oppPlayer, 'battle-face')}<div class="battle-name">${escapeHtml(oppPlayer.n)}</div><div class="battle-team">${escapeHtml(getTeamDisplayName(state.oppTeam))}</div><div class="battle-statline"><div class="battle-stat">${Math.max(oppVal, 70)}</div><div class="battle-stat-label">${metric}</div></div>`;
    detail.innerHTML = `<span class="battle-detail-copy">${won ? 'Твій гравець переграв суперника' : 'Суперник забрав дуель'}</span><span class="battle-detail-score">${escapeHtml(myPlayer.n)} <strong class="${won ? 'win' : 'lose'}">${myVal}</strong> vs ${escapeHtml(oppPlayer.n)} <strong class="${won ? 'lose' : 'win'}">${Math.max(oppVal, 70)}</strong></span>`;
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
  function clampRoundStat(value) { return Math.max(60, Math.min(99, value)); }
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
    const ranked = [...team.players].sort((a, b) => {
      const aScore = getRoundValue(a, roundKey) + getRoundPositionWeight(a, roundKey);
      const bScore = getRoundValue(b, roundKey) + getRoundPositionWeight(b, roundKey);
      if (bScore !== aScore) return bScore - aScore;
      return b.stat - a.stat;
    });
    const selected = [];
    const seen = new Set();
    ranked.forEach(player => {
      if (selected.length >= 4 || !preferred.has(player.pos)) return;
      selected.push(player);
      seen.add(player.n);
    });
    ranked.forEach(player => {
      if (selected.length >= 4 || seen.has(player.n)) return;
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

  function filterTeams(filter, btn) {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const filtered = filter === 'all' ? TEAMS : TEAMS.filter(t => t.type === filter || t.era === filter);
    renderTeams(filtered);
  }

  function renderTeams(teams) {
    const list = document.getElementById('teams-list');
    list.innerHTML = '';
    teams.forEach((team, i) => {
      const abilityTitle = team.abilityTitle || team.ability?.split(':')[0] || '';
      const spotlight = getTeamSpotlight(team);
      const div = document.createElement('div');
      div.className = 'team-row anim-in' + (team.id === state.selectedTeamId ? ' selected' : '');
      div.style.animationDelay = (i * 0.06) + 's';
      div.innerHTML = `
        ${createTeamBadge(team)}
        <div class="team-row-body">
          <div class="team-row-top">
            <div class="team-row-name">${getTeamDisplayName(team)}</div>
            <div class="team-row-year">${getTeamSeasonLabel(team)}</div>
          </div>
          <div class="team-row-bottom">
            ${createTeamStarBadge(team)}
          </div>
        </div>
        <div class="team-row-rating">${team.rating}</div>
        <div class="team-row-spotlight">
          <div class="team-row-divider"></div>
          <div class="team-row-ability-title">★ ${escapeHtml(abilityTitle)}</div>
          <div class="team-row-spotlight-copy">${escapeHtml(spotlight)}</div>
        </div>
      `;
      div.addEventListener('click', event => {
        if (event.target.closest('[data-team-preview]')) return;
        selectTeam(team.id, div);
      });
      list.appendChild(div);
    });
    enhancePlayerPhotos(list);
  }

  function selectTeam(id, el) {
    document.querySelectorAll('.team-row').forEach(r => r.classList.remove('selected'));
    el.classList.add('selected');
    state.selectedTeamId = id;
    const team = TEAMS.find(t => t.id === id);
    if (!team) return;
    renderEraLineupScreen(team);
    goTo('era-lineup');
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  }

  function startMatch() {
    const myT = TEAMS.find(t => t.id === state.selectedTeamId);
    if (!myT) return;
    const opponents = TEAMS.filter(t => t.id !== state.selectedTeamId);
    const oppT = opponents[Math.floor(Math.random() * opponents.length)];
    state.currentTeam = myT;
    state.oppTeam = oppT;
    state.currentRound = 0;
    state.myScore = 0;
    state.oppScore = 0;
    state.chosenPlayer = null;
    state.roundResults = [];
    state.pendingRoundAdvance = false;
    document.getElementById('sb-my-crest').src = myT.crest;
    document.getElementById('sb-opp-crest').src = oppT.crest;
    document.getElementById('sb-my-name').innerHTML = `<span class="sb-club-name">${escapeHtml(getTeamDisplayName(myT))}</span><span class="sb-club-year">${escapeHtml(getTeamSeasonLabel(myT))}</span>`;
    document.getElementById('sb-opp-name').innerHTML = `<span class="sb-club-name">${escapeHtml(getTeamDisplayName(oppT))}</span><span class="sb-club-year">${escapeHtml(getTeamSeasonLabel(oppT))}</span>`;
    document.getElementById('sb-my-score').textContent = '0';
    document.getElementById('sb-opp-score').textContent = '0';
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

  function renderRound() {
    const r = ROUNDS[state.currentRound];
    state.chosenPlayer = null;
    document.getElementById('phase-label').textContent = `Раунд ${state.currentRound + 1} з 5`;
    document.getElementById('phase-name').textContent = `${r.emoji} ${r.name}`;
    document.getElementById('phase-hint').textContent = r.hint;
    document.getElementById('match-round-badge').textContent = `${state.currentRound + 1}/5`;
    document.getElementById('fight-btn').disabled = true;
    for (let i = 0; i < 5; i++) {
      const dot = document.getElementById(`rd-${i}`);
      dot.classList.remove('active', 'win', 'lose');
      if (i < state.roundResults.length) dot.classList.add(state.roundResults[i] ? 'win' : 'lose');
      else if (i === state.currentRound) dot.classList.add('active');
    }
    const list = document.getElementById('player-pick-list');
    list.className = 'player-pick-grid';
    list.innerHTML = '';
    getPlayersForRound(state.currentTeam, r.key).forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'player-pick';
      div.innerHTML = createPlayerCard(state.currentTeam, p, i);
      div.addEventListener('click', () => pickPlayer(div, p));
      list.appendChild(div);
    });
    enhancePlayerPhotos(list);
  }

  function pickPlayer(el, p) {
    document.querySelectorAll('.player-pick').forEach(d => {
      d.classList.remove('chosen');
      d.querySelector('.player-card')?.classList.remove('chosen');
    });
    el.classList.add('chosen');
    el.querySelector('.player-card')?.classList.add('chosen');
    state.chosenPlayer = { ...p };
    document.getElementById('fight-btn').disabled = false;
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  }

  function resolveRound() {
    if (!state.chosenPlayer) return;
    const round = ROUNDS[state.currentRound];
    const myBase = getRoundValue(state.chosenPlayer, round.key);
    const oppPlayer = getOpponentForRound(state.oppTeam, round.key);
    const oppBase = getRoundValue(oppPlayer, round.key);
    const myVal = clampRoundStat(myBase + Math.floor(Math.random() * 5) - 2);
    const oppVal = clampRoundStat(oppBase + Math.floor(Math.random() * 5) - 2);
    const won = myVal === oppVal ? myBase >= oppBase : myVal > oppVal;
    state.roundResults.push(won);
    if (won) state.myScore++; else state.oppScore++;
    document.getElementById('sb-my-score').textContent = state.myScore;
    document.getElementById('sb-opp-score').textContent = state.oppScore;
    renderBattleOverlay(state.chosenPlayer, oppPlayer, myVal, oppVal, won);
    state.pendingRoundAdvance = true;
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(won ? 'success' : 'error');
    document.getElementById('fight-btn').disabled = true;
  }

  function acknowledgeBattle() {
    if (!state.pendingRoundAdvance) return;
    state.pendingRoundAdvance = false;
    document.getElementById('round-flash').classList.remove('show');
    state.currentRound++;
    if (state.currentRound >= 5) setTimeout(showResult, 180);
    else renderRound();
  }

  function showResult() {
    const win = state.myScore > state.oppScore;
    document.getElementById('res-trophy').textContent = win ? '🏆' : '😔';
    const headline = document.getElementById('res-headline');
    headline.textContent = win ? 'ПЕРЕМОГА!' : 'ПОРАЗКА';
    headline.className = 'result-headline popup-title ' + (win ? 'win' : 'lose');
    document.getElementById('res-subline').textContent = `${win ? 'Ти виграв' : 'Ти програв'} ${state.myScore}:${state.oppScore} по раундах`;
    const rr = document.getElementById('res-rounds');
    rr.innerHTML = '';
    state.roundResults.forEach(w => {
      const div = document.createElement('div');
      div.className = 'res-rd ' + (w ? 'w' : 'l');
      div.textContent = w ? '✓' : '✗';
      rr.appendChild(div);
    });
    document.getElementById('result-overlay').classList.add('show');
    recordMatchProfile({ win, currentTeam: state.currentTeam, myScore: state.myScore, oppScore: state.oppScore, currentScreen: state.currentScreen });
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(win ? 'success' : 'error');
  }

  function playAgain() {
    document.getElementById('result-overlay').classList.remove('show');
    goToEra();
  }

  function confirmLeave(target = 'era') {
    state.pendingLeaveTarget = target;
    const dialog = document.getElementById('leave-match-dialog');
    if (typeof dialog.showModal === 'function') {
      if (dialog.open) return;
      dialog.showModal();
      return;
    }
    state.pendingRoundAdvance = false;
    document.getElementById('round-flash').classList.remove('show');
    goTo(target);
  }
  function cancelLeave() {
    const dialog = document.getElementById('leave-match-dialog');
    if (dialog?.open) dialog.close('cancel');
  }
  function proceedLeave() {
    const dialog = document.getElementById('leave-match-dialog');
    if (dialog?.open) dialog.close('confirm');
    state.pendingRoundAdvance = false;
    document.getElementById('round-flash').classList.remove('show');
    goTo(state.pendingLeaveTarget);
  }

  return {
    filterTeams,
    renderTeams,
    selectTeam,
    openTeamLineup,
    closeTeamLineup,
    startMatch,
    renderRound,
    pickPlayer,
    resolveRound,
    acknowledgeBattle,
    playAgain,
    confirmLeave,
    cancelLeave,
    proceedLeave,
    renderEraLineupScreen,
  };
}
