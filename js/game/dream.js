import { DREAM_XI_TEAMS } from '../data.js';
import { escapeHtml, getInitials } from './utils.js';
import { enhancePlayerPhotos, createWikiFaceMarkup } from './media.js';
import { recordDreamProfile } from './profile.js';

const DREAM_POSITION_LAYOUT = {
  gk: { x: 50, y: 88 }, rb: { x: 82, y: 71 }, cb1: { x: 61, y: 74 }, cb2: { x: 39, y: 74 }, lb: { x: 18, y: 71 },
  cm1: { x: 50, y: 57 }, cm2: { x: 32, y: 49 }, cm3: { x: 68, y: 49 }, rw: { x: 80, y: 27 }, lw: { x: 20, y: 27 }, st: { x: 50, y: 16 },
};

const DREAM_PLAYER_HONORS = {
  'Lionel Messi': '8 «Золотих м’ячів»', 'Luis Suárez': '2 «Золоті бутси»', 'Ronaldinho': '«Золотий м’яч» 2005', 'Neymar': 'Олімпійське золото',
  'Hristo Stoichkov': '«Золотий м’яч» 1994', 'Thierry Henry': 'Легенда «Непереможних»', 'Víctor Valdés': '3 перемоги в ЛЧ',
  'Marc-André ter Stegen': 'Воротар ери тріумфів', 'Andoni Zubizarreta': 'Голкіпер Dream Team', 'Claudio Bravo': 'Ла Ліга + Кубок',
  'Dani Alves': 'Один із найтитулованіших', 'Sergi Roberto': 'Універсал La Masia', 'Jules Koundé': 'Сучасний стопер',
  'Albert Ferrer': 'Переможець Кубка чемпіонів', 'Carles Puyol': 'Капітан епохи', 'Gerard Piqué': 'Опора треблу',
  'Ronald Koeman': 'Герой «Вемблі»', 'Rafael Márquez': 'Пасуючий центрбек', 'Javier Mascherano': 'Захисник великих матчів',
  'Jordi Alba': 'Євро + Ліга чемпіонів', 'Eric Abidal': 'Тріумфальне повернення в ЛЧ', 'Sergi Barjuán': 'Чемпіон Іспанії',
  'Joan Capdevila': 'Чемпіон світу', 'Sergio Busquets': 'ЧС + Євро', 'Pep Guardiola': 'Капітан 1992', 'Yaya Touré': 'Мотор треблу',
  'Deco': 'Плеймейкер ЛЧ', 'Xavi': 'ЧС + 2 Євро', 'Andrés Iniesta': 'Гол у фіналі ЧС', 'Ivan Rakitić': 'Мозок треблу',
  'Johan Neeskens': 'Ікона тотального футболу', 'Pedri': 'Golden Boy', 'Lamine Yamal': 'Юний герой Євро', 'Luis Figo': '«Золотий м’яч» 2000',
  'Pedro': 'Герой секступлу', 'Samuel Eto’o': '2 фінали ЛЧ з трофеєм', 'Ronaldo': '2 «Золоті м’ячі»', 'Patrick Kluivert': 'Наймолодший бомбардир фіналу ЛЧ',
  'Iker Casillas': '3 перемоги в ЛЧ', 'Thibaut Courtois': 'Герой фіналу 2022', 'Keylor Navas': '3 перемоги в ЛЧ', 'Paco Buyo': 'Легенда Ла Ліги',
  'Michel Salgado': 'Боєць ери Галактікос', 'Chendo': 'Шість титулів Ла Ліги', 'Sergio Ramos': 'Капітан 4 титулів ЛЧ',
  'Fernando Hierro': 'Легенда клубу', 'Pepe': '3 перемоги в ЛЧ', 'Raphaël Varane': '4 перемоги в ЛЧ', 'Marcelo': '5 перемог у ЛЧ',
  'Roberto Carlos': 'ЧС + Ліга чемпіонів', 'Ferland Mendy': 'Переможець ЛЧ 2022', 'José Antonio Camacho': 'Багаторічний капітан',
  'Casemiro': '5 перемог у ЛЧ', 'Claude Makélélé': 'Еталон опорника', 'Xabi Alonso': 'ЧС + Ліга чемпіонів', 'Fernando Redondo': 'Маестро ЛЧ',
  'Luka Modrić': '«Золотий м’яч» 2018', 'Zinedine Zidane': 'Легендарний гол у фіналі ЛЧ', 'Toni Kroos': '5 перемог у ЛЧ', 'Guti': 'Культовий пасувальник',
  'Cristiano Ronaldo': '5 «Золотих м’ячів»', 'Gareth Bale': 'Спеціаліст по фіналах', 'Amancio': 'Легенда флангу', 'Vinícius Júnior': 'Гол у фіналі ЛЧ 2022',
  'Raúl': 'Символ клубу', 'Francisco Gento': '6 Кубків чемпіонів', 'Alfredo Di Stéfano': '5 Кубків чемпіонів', 'Karim Benzema': '«Золотий м’яч» 2022',
  'Peter Schmeichel': 'Стіна треблу', 'Edwin van der Sar': 'Переможець ЛЧ 2008', 'David de Gea': 'Найкращий воротар АПЛ', 'Fabien Barthez': 'Чемпіон світу',
};

const DREAM_PLAYER_YEARS = {
  'dream-barcelona:Víctor Valdés': '2002–2014','dream-barcelona:Marc-André ter Stegen': '2014–дотепер','dream-barcelona:Andoni Zubizarreta': '1986–1994','dream-barcelona:Claudio Bravo': '2014–2016',
  'dream-barcelona:Dani Alves': '2008–2016','dream-barcelona:Sergi Roberto': '2010–2024','dream-barcelona:Jules Koundé': '2022–дотепер','dream-barcelona:Albert Ferrer': '1990–1998',
  'dream-barcelona:Carles Puyol': '1999–2014','dream-barcelona:Gerard Piqué': '2008–2022','dream-barcelona:Ronald Koeman': '1989–1995','dream-barcelona:Rafael Márquez': '2003–2010',
  'dream-barcelona:Javier Mascherano': '2010–2018','dream-barcelona:Jordi Alba': '2012–2023','dream-barcelona:Eric Abidal': '2007–2013','dream-barcelona:Sergi Barjuán': '1993–2002',
  'dream-barcelona:Joan Capdevila': '1999–2007','dream-barcelona:Sergio Busquets': '2008–2023','dream-barcelona:Pep Guardiola': '1990–2001','dream-barcelona:Yaya Touré': '2007–2010',
  'dream-barcelona:Deco': '2004–2008','dream-barcelona:Xavi': '1998–2015','dream-barcelona:Andrés Iniesta': '2002–2018','dream-barcelona:Ivan Rakitić': '2014–2020',
};

export function createDreamController(state, { goTo }) {
  function getDreamTeam() {
    return DREAM_XI_TEAMS.find(team => team.id === state.currentDreamTeamId) || state.currentDreamTeam;
  }
  function getDreamPosition() {
    return getDreamTeam()?.positions[state.currentDreamStep] || null;
  }
  function getDreamAverageRating() {
    const selected = Object.values(state.currentDreamSelections);
    if (!selected.length) return 0;
    return Math.round(selected.reduce((sum, player) => sum + (player.stat || 0), 0) / selected.length);
  }
  function createDreamPlayerArt(player, className = 'dream-player-face') {
    return createWikiFaceMarkup({ n: player.n, wikiTitle: player.wikiTitle, avatar: player.avatar || '⚽' }, className);
  }
  function createDreamTeamCard(team, index) {
    return `
      <button class="dream-team-card anim-in" style="animation-delay:${index * 0.05}s" type="button" data-dream-team="${escapeHtml(team.id)}">
        <div class="dream-team-card-crest" style="--dream-team-theme:${team.theme}">
          <img src="${team.crest}" alt="${escapeHtml(team.name)} logo" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <span>${escapeHtml(getInitials(team.shortName || team.name))}</span>
        </div>
        <div class="dream-team-card-name">${escapeHtml(team.shortName || team.name)}</div>
        <div class="dream-team-card-meta">${escapeHtml(team.formation)}</div>
        <div class="dream-team-card-desc">${escapeHtml(team.subtitle)}</div>
      </button>
    `;
  }
  function createDreamSlotMarker(position, selectedPlayer) {
    const coords = DREAM_POSITION_LAYOUT[position.id] || { x: 50, y: 50 };
    return `
      <div class="dream-slot${selectedPlayer ? ' filled' : ''}" style="left:${coords.x}%; top:${coords.y}%;">
        ${selectedPlayer ? `
          <div class="dream-slot-photo" data-player-name="${escapeHtml(selectedPlayer.n)}" data-wiki-title="${escapeHtml(selectedPlayer.wikiTitle || '')}">
            <span>${escapeHtml(selectedPlayer.avatar || '⚽')}</span>
          </div>
          <div class="dream-slot-name">${escapeHtml(selectedPlayer.n)}</div>
        ` : `<div class="dream-slot-empty">${escapeHtml(position.short)}</div>`}
      </div>
    `;
  }
  function createDreamCandidateCard(position, player, index) {
    const honor = DREAM_PLAYER_HONORS[player.n] || player.tag;
    const years = DREAM_PLAYER_YEARS[`${state.currentDreamTeamId}:${player.n}`] || '';
    return `
      <button class="dream-candidate-card anim-in" style="animation-delay:${index * 0.05}s" type="button" data-dream-player="${escapeHtml(player.n)}">
        <div class="dream-candidate-top"><div><div class="dream-candidate-rating">${player.stat}</div><div class="dream-candidate-role">${escapeHtml(position.short)}</div></div></div>
        ${createDreamPlayerArt(player)}
        <div class="dream-candidate-name">${escapeHtml(player.n)}</div>
        <div class="dream-candidate-copy">
          <div class="dream-candidate-honor">${escapeHtml(honor)}</div>
          ${years ? `<div class="dream-candidate-meta">${escapeHtml(years)}</div>` : ''}
        </div>
      </button>
    `;
  }
  function renderDreamCandidates() {
    const team = getDreamTeam();
    const position = getDreamPosition();
    const grid = document.getElementById('dream-candidate-grid');
    if (!team || !position || !grid) return;
    document.getElementById('dream-screen-title').textContent = `DREAM XI · ${team.shortName}`;
    document.getElementById('dream-screen-subtitle').textContent = 'Драфт по позиціях';
    document.getElementById('dream-progress-badge').textContent = `${state.currentDreamStep + 1}/${team.positions.length}`;
    document.getElementById('dream-summary-label').textContent = `${team.shortName} · ${team.formation}`;
    document.getElementById('dream-position-title').textContent = position.label;
    document.getElementById('dream-summary-step').textContent = `Крок ${state.currentDreamStep + 1} з ${team.positions.length}`;
    document.getElementById('dream-summary-desc').textContent = `Обери гравця на позицію «${position.label.toLowerCase()}».`;
    const selectedNames = new Set(Object.entries(state.currentDreamSelections).filter(([slotId]) => slotId !== position.id).map(([, player]) => player.n));
    const availableCandidates = position.candidates.filter(player => !selectedNames.has(player.n));
    grid.innerHTML = availableCandidates.map((player, index) => createDreamCandidateCard(position, player, index)).join('');
    enhancePlayerPhotos(grid);
  }
  function renderDreamResult() {
    const team = getDreamTeam();
    const pitch = document.getElementById('dream-pitch');
    const hero = document.getElementById('dream-result-hero');
    if (!team || !pitch || !hero) return;
    hero.innerHTML = `
      <div class="dream-result-kicker">Фінальний склад</div>
      <div class="dream-result-title">${escapeHtml(team.shortName)} Dream XI</div>
      <div class="dream-result-meta">${escapeHtml(team.formation)} · середній рейтинг ${getDreamAverageRating()}</div>
    `;
    pitch.innerHTML = `<div class="dream-pitch-canvas">${team.positions.map(position => createDreamSlotMarker(position, state.currentDreamSelections[position.id])).join('')}</div>`;
    enhancePlayerPhotos(pitch);
  }
  function goToDreamTeams() {
    const grid = document.getElementById('dream-team-grid');
    grid.innerHTML = DREAM_XI_TEAMS.map((team, index) => createDreamTeamCard(team, index)).join('');
    goTo('dream-teams');
  }
  function startDreamDraft(teamId) {
    const team = DREAM_XI_TEAMS.find(item => item.id === teamId);
    if (!team) return;
    state.currentDreamTeamId = teamId;
    state.currentDreamTeam = team;
    state.currentDreamStep = 0;
    state.currentDreamSelections = {};
    goTo('dream');
    renderDreamCandidates();
  }
  function selectDreamPlayer(playerName) {
    const team = getDreamTeam();
    const position = getDreamPosition();
    if (!team || !position) return;
    const candidate = position.candidates.find(player => player.n === playerName);
    if (!candidate) return;
    state.currentDreamSelections[position.id] = { ...candidate };
    state.currentDreamStep += 1;
    if (state.currentDreamStep >= team.positions.length) {
      recordDreamProfile({ team: getDreamTeam(), average: getDreamAverageRating(), currentScreen: state.currentScreen });
      goTo('dream-result');
      renderDreamResult();
      return;
    }
    renderDreamCandidates();
  }
  function goBackFromDreamDraft() {
    if (state.currentDreamStep > 0) {
      state.currentDreamStep -= 1;
      const team = getDreamTeam();
      const previousPosition = team?.positions[state.currentDreamStep];
      if (previousPosition) delete state.currentDreamSelections[previousPosition.id];
      renderDreamCandidates();
      return;
    }
    goToDreamTeams();
  }
  function replayDreamDraft() {
    if (state.currentDreamTeamId) startDreamDraft(state.currentDreamTeamId);
  }
  return { goToDreamTeams, startDreamDraft, selectDreamPlayer, goBackFromDreamDraft, replayDreamDraft, renderDreamResult };
}
