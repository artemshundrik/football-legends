import {
  TEAMS,
  ROUNDS,
  STATS_LEADERBOARDS,
  STATS_CATEGORY_LOGOS,
  STATS_ENTITY_MEDIA,
  GOAT_CATEGORIES,
  GOAT_SPECIAL_BRACKETS,
  DREAM_XI_TEAMS,
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
let currentDreamTeamId = null;
let currentDreamTeam = null;
let currentDreamStep = 0;
let currentDreamSelections = {};
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
const DREAM_POSITION_LAYOUT = {
  gk: { x: 50, y: 88 },
  rb: { x: 82, y: 71 },
  cb1: { x: 61, y: 74 },
  cb2: { x: 39, y: 74 },
  lb: { x: 18, y: 71 },
  cm1: { x: 50, y: 57 },
  cm2: { x: 32, y: 49 },
  cm3: { x: 68, y: 49 },
  rw: { x: 80, y: 27 },
  lw: { x: 20, y: 27 },
  st: { x: 50, y: 16 },
};
const DREAM_PLAYER_HONORS = {
  'Lionel Messi': '8 «Золотих м’ячів»',
  'Luis Suárez': '2 «Золоті бутси»',
  'Ronaldinho': '«Золотий м’яч» 2005',
  'Neymar': 'Олімпійське золото',
  'Hristo Stoichkov': '«Золотий м’яч» 1994',
  'Thierry Henry': 'Легенда «Непереможних»',
  'Víctor Valdés': '3 перемоги в ЛЧ',
  'Marc-André ter Stegen': 'Воротар ери тріумфів',
  'Andoni Zubizarreta': 'Голкіпер Dream Team',
  'Claudio Bravo': 'Ла Ліга + Кубок',
  'Dani Alves': 'Один із найтитулованіших',
  'Sergi Roberto': 'Універсал La Masia',
  'Jules Koundé': 'Сучасний стопер',
  'Albert Ferrer': 'Переможець Кубка чемпіонів',
  'Carles Puyol': 'Капітан епохи',
  'Gerard Piqué': 'Опора треблу',
  'Ronald Koeman': 'Герой «Вемблі»',
  'Rafael Márquez': 'Пасуючий центрбек',
  'Javier Mascherano': 'Захисник великих матчів',
  'Jordi Alba': 'Євро + Ліга чемпіонів',
  'Eric Abidal': 'Тріумфальне повернення в ЛЧ',
  'Sergi Barjuán': 'Чемпіон Іспанії',
  'Joan Capdevila': 'Чемпіон світу',
  'Sergio Busquets': 'ЧС + Євро',
  'Pep Guardiola': 'Капітан 1992',
  'Yaya Touré': 'Мотор треблу',
  'Deco': 'Плеймейкер ЛЧ',
  'Xavi': 'ЧС + 2 Євро',
  'Andrés Iniesta': 'Гол у фіналі ЧС',
  'Ivan Rakitić': 'Мозок треблу',
  'Johan Neeskens': 'Ікона тотального футболу',
  'Pedri': 'Golden Boy',
  'Lamine Yamal': 'Юний герой Євро',
  'Luis Figo': '«Золотий м’яч» 2000',
  'Pedro': 'Герой секступлу',
  'Samuel Eto’o': '2 фінали ЛЧ з трофеєм',
  'Ronaldo': '2 «Золоті м’ячі»',
  'Patrick Kluivert': 'Наймолодший бомбардир фіналу ЛЧ',
  'Iker Casillas': '3 перемоги в ЛЧ',
  'Thibaut Courtois': 'Герой фіналу 2022',
  'Keylor Navas': '3 перемоги в ЛЧ',
  'Paco Buyo': 'Легенда Ла Ліги',
  'Michel Salgado': 'Боєць ери Галактікос',
  'Chendo': 'Шість титулів Ла Ліги',
  'Sergio Ramos': 'Капітан 4 титулів ЛЧ',
  'Fernando Hierro': 'Легенда клубу',
  'Pepe': '3 перемоги в ЛЧ',
  'Raphaël Varane': '4 перемоги в ЛЧ',
  'Marcelo': '5 перемог у ЛЧ',
  'Roberto Carlos': 'ЧС + Ліга чемпіонів',
  'Ferland Mendy': 'Переможець ЛЧ 2022',
  'José Antonio Camacho': 'Багаторічний капітан',
  'Casemiro': '5 перемог у ЛЧ',
  'Claude Makélélé': 'Еталон опорника',
  'Xabi Alonso': 'ЧС + Ліга чемпіонів',
  'Fernando Redondo': 'Маестро ЛЧ',
  'Luka Modrić': '«Золотий м’яч» 2018',
  'Zinedine Zidane': 'Легендарний гол у фіналі ЛЧ',
  'Toni Kroos': '5 перемог у ЛЧ',
  'Guti': 'Культовий пасувальник',
  'Cristiano Ronaldo': '5 «Золотих м’ячів»',
  'Gareth Bale': 'Спеціаліст по фіналах',
  'Amancio': 'Легенда флангу',
  'Vinícius Júnior': 'Гол у фіналі ЛЧ 2022',
  'Raúl': 'Символ клубу',
  'Francisco Gento': '6 Кубків чемпіонів',
  'Alfredo Di Stéfano': '5 Кубків чемпіонів',
  'Karim Benzema': '«Золотий м’яч» 2022',
  'Peter Schmeichel': 'Стіна треблу',
  'Edwin van der Sar': 'Переможець ЛЧ 2008',
  'David de Gea': 'Найкращий воротар АПЛ',
  'Fabien Barthez': 'Чемпіон світу',
  'Gary Neville': '8 титулів АПЛ',
  'Antonio Valencia': 'Капітан своєї ери',
  'Aaron Wan-Bissaka': 'Майстер 1-в-1',
  'Wes Brown': 'Фіналіст і переможець ЛЧ',
  'Rio Ferdinand': 'Ікона гри з м’ячем',
  'Nemanja Vidić': '5 титулів АПЛ',
  'Jaap Stam': 'Центрбек команди треблу',
  'Steve Bruce': 'Лідер оборони',
  'Gary Pallister': 'Класичний стопер',
  'Patrice Evra': 'Лідер покоління',
  'Denis Irwin': 'Еталон надійності',
  'Luke Shaw': 'Фіналіст Євро',
  'Mikaël Silvestre': 'Універсальний захисник',
  'Roy Keane': 'Капітан треблу',
  'Michael Carrick': 'Майстер контролю',
  'Paul Ince': 'Мотор центру поля',
  'Paul Scholes': 'Геній півзахисту',
  'Bryan Robson': 'Captain Marvel',
  'David Beckham': 'Творець треблу',
  'Bruno Fernandes': 'Машина результативності',
  'Ryan Giggs': '13 титулів АПЛ',
  'George Best': '«Золотий м’яч» 1968',
  'Marcus Rashford': 'Сучасний символ клубу',
  'Wayne Rooney': 'Найкращий бомбардир клубу',
  'Eric Cantona': 'Король 90-х',
  'Ruud van Nistelrooy': 'Хижак штрафного',
  'Robin van Persie': 'Форвард чемпіонського сезону',
  'Cláudio Taffarel': 'Чемпіон світу 1994',
  'Alisson Becker': 'Найкращий воротар FIFA',
  'Marcos': 'Чемпіон світу 2002',
  'Dida': 'Спеціаліст великих матчів ЛЧ',
  'Cafu': 'Дворазовий чемпіон світу',
  'Carlos Alberto': 'Капітан Бразилії-1970',
  'Maicon': 'Фулбек ери треблу',
  'Lucio': 'Лідер оборони 2002',
  'Thiago Silva': 'Сучасна ікона захисту',
  'Aldair': 'Чемпіон світу 1994',
  'Marquinhos': 'Капітан сучасної Бразилії',
  'Branco': 'Ліва нога 1994',
  'Junior': 'Легенда класичної Бразилії',
  'Dunga': 'Капітан чемпіонів світу',
  'Falcão': 'Мозок півзахисту',
  'Gilberto Silva': 'Невидимий щит',
  'Zico': 'Білий Пеле',
  'Rivaldo': '«Золотий м’яч» 1999',
  'Kaká': '«Золотий м’яч» 2007',
  'Sócrates': 'Доктор футболу',
  'Garrincha': 'Ікона 1962',
  'Jairzinho': 'Голи в кожному матчі ЧС-1970',
  'Raphinha': 'Лідер сучасного флангу',
  'Pelé': '3 чемпіонати світу',
  'Romário': 'Чемпіон світу 1994',
  'Adriano': 'Пікова сила «Імператора»',
};
const DREAM_PLAYER_YEARS = {
  'dream-barcelona:Víctor Valdés': '2002–2014',
  'dream-barcelona:Marc-André ter Stegen': '2014–дотепер',
  'dream-barcelona:Andoni Zubizarreta': '1986–1994',
  'dream-barcelona:Claudio Bravo': '2014–2016',
  'dream-barcelona:Dani Alves': '2008–2016',
  'dream-barcelona:Sergi Roberto': '2010–2024',
  'dream-barcelona:Jules Koundé': '2022–дотепер',
  'dream-barcelona:Albert Ferrer': '1990–1998',
  'dream-barcelona:Carles Puyol': '1999–2014',
  'dream-barcelona:Gerard Piqué': '2008–2022',
  'dream-barcelona:Ronald Koeman': '1989–1995',
  'dream-barcelona:Rafael Márquez': '2003–2010',
  'dream-barcelona:Javier Mascherano': '2010–2018',
  'dream-barcelona:Jordi Alba': '2012–2023',
  'dream-barcelona:Eric Abidal': '2007–2013',
  'dream-barcelona:Sergi Barjuán': '1993–2002',
  'dream-barcelona:Joan Capdevila': '1999–2007',
  'dream-barcelona:Sergio Busquets': '2008–2023',
  'dream-barcelona:Pep Guardiola': '1990–2001',
  'dream-barcelona:Yaya Touré': '2007–2010',
  'dream-barcelona:Deco': '2004–2008',
  'dream-barcelona:Xavi': '1998–2015',
  'dream-barcelona:Andrés Iniesta': '2002–2018',
  'dream-barcelona:Ivan Rakitić': '2014–2020',
  'dream-barcelona:Johan Neeskens': '1974–1979',
  'dream-barcelona:Pedri': '2020–дотепер',
  'dream-barcelona:Lionel Messi': '2004–2021',
  'dream-barcelona:Lamine Yamal': '2023–дотепер',
  'dream-barcelona:Luis Figo': '1995–2000',
  'dream-barcelona:Pedro': '2008–2015',
  'dream-barcelona:Ronaldinho': '2003–2008',
  'dream-barcelona:Neymar': '2013–2017',
  'dream-barcelona:Hristo Stoichkov': '1990–1995',
  'dream-barcelona:Thierry Henry': '2007–2010',
  'dream-barcelona:Luis Suárez': '2014–2020',
  'dream-barcelona:Samuel Eto’o': '2004–2009',
  'dream-barcelona:Ronaldo': '1996–1997',
  'dream-barcelona:Patrick Kluivert': '1998–2004',
  'dream-real:Iker Casillas': '1999–2015',
  'dream-real:Thibaut Courtois': '2018–дотепер',
  'dream-real:Keylor Navas': '2014–2019',
  'dream-real:Paco Buyo': '1986–1997',
  'dream-real:Dani Carvajal': '2013–дотепер',
  'dream-real:Michel Salgado': '1999–2009',
  'dream-real:Chendo': '1982–1998',
  'dream-real:Sergio Ramos': '2005–2021',
  'dream-real:Fernando Hierro': '1989–2003',
  'dream-real:Pepe': '2007–2017',
  'dream-real:Raphaël Varane': '2011–2021',
  'dream-real:Marcelo': '2007–2022',
  'dream-real:Roberto Carlos': '1996–2007',
  'dream-real:Ferland Mendy': '2019–дотепер',
  'dream-real:José Antonio Camacho': '1973–1989',
  'dream-real:Casemiro': '2013–2022',
  'dream-real:Claude Makélélé': '2000–2003',
  'dream-real:Xabi Alonso': '2009–2014',
  'dream-real:Fernando Redondo': '1994–2000',
  'dream-real:Luka Modrić': '2012–дотепер',
  'dream-real:Zinedine Zidane': '2001–2006',
  'dream-real:Toni Kroos': '2014–2024',
  'dream-real:Guti': '1995–2010',
  'dream-real:Cristiano Ronaldo': '2009–2018',
  'dream-real:Gareth Bale': '2013–2022',
  'dream-real:Amancio': '1962–1976',
  'dream-real:Vinícius Júnior': '2018–дотепер',
  'dream-real:Raúl': '1994–2010',
  'dream-real:Francisco Gento': '1953–1971',
  'dream-real:Alfredo Di Stéfano': '1953–1964',
  'dream-real:Karim Benzema': '2009–2023',
  'dream-united:Peter Schmeichel': '1991–1999',
  'dream-united:Edwin van der Sar': '2005–2011',
  'dream-united:David de Gea': '2011–2023',
  'dream-united:Fabien Barthez': '2000–2004',
  'dream-united:Gary Neville': '1992–2011',
  'dream-united:Antonio Valencia': '2009–2019',
  'dream-united:Aaron Wan-Bissaka': '2019–2024',
  'dream-united:Wes Brown': '1996–2011',
  'dream-united:Rio Ferdinand': '2002–2014',
  'dream-united:Nemanja Vidić': '2006–2014',
  'dream-united:Jaap Stam': '1998–2001',
  'dream-united:Steve Bruce': '1987–1996',
  'dream-united:Gary Pallister': '1989–1998',
  'dream-united:Patrice Evra': '2006–2014',
  'dream-united:Denis Irwin': '1990–2002',
  'dream-united:Luke Shaw': '2014–дотепер',
  'dream-united:Mikaël Silvestre': '1999–2008',
  'dream-united:Roy Keane': '1993–2005',
  'dream-united:Michael Carrick': '2006–2018',
  'dream-united:Paul Ince': '1989–1995',
  'dream-united:Casemiro': '2022–дотепер',
  'dream-united:Paul Scholes': '1993–2013',
  'dream-united:Bryan Robson': '1981–1994',
  'dream-united:David Beckham': '1992–2003',
  'dream-united:Bruno Fernandes': '2020–дотепер',
  'dream-united:Ryan Giggs': '1990–2014',
  'dream-united:Cristiano Ronaldo': '2003–2009',
  'dream-united:George Best': '1963–1974',
  'dream-united:Marcus Rashford': '2015–дотепер',
  'dream-united:Wayne Rooney': '2004–2017',
  'dream-united:Eric Cantona': '1992–1997',
  'dream-united:Ruud van Nistelrooy': '2001–2006',
  'dream-united:Robin van Persie': '2012–2015',
  'dream-brazil:Cláudio Taffarel': '1988–1998',
  'dream-brazil:Alisson Becker': '2015–дотепер',
  'dream-brazil:Marcos': '1999–2005',
  'dream-brazil:Dida': '1995–2006',
  'dream-brazil:Cafu': '1990–2006',
  'dream-brazil:Carlos Alberto': '1964–1977',
  'dream-brazil:Dani Alves': '2006–2022',
  'dream-brazil:Maicon': '2003–2014',
  'dream-brazil:Lucio': '2000–2011',
  'dream-brazil:Thiago Silva': '2008–2022',
  'dream-brazil:Aldair': '1989–2000',
  'dream-brazil:Marquinhos': '2013–дотепер',
  'dream-brazil:Juan': '2001–2012',
  'dream-brazil:Roberto Carlos': '1992–2006',
  'dream-brazil:Marcelo': '2006–2018',
  'dream-brazil:Branco': '1985–1995',
  'dream-brazil:Junior': '1979–1992',
  'dream-brazil:Dunga': '1987–1998',
  'dream-brazil:Casemiro': '2011–дотепер',
  'dream-brazil:Falcão': '1976–1986',
  'dream-brazil:Gilberto Silva': '2001–2010',
  'dream-brazil:Zico': '1976–1989',
  'dream-brazil:Rivaldo': '1993–2003',
  'dream-brazil:Kaká': '2002–2016',
  'dream-brazil:Sócrates': '1979–1986',
  'dream-brazil:Ronaldinho': '1999–2013',
  'dream-brazil:Garrincha': '1955–1966',
  'dream-brazil:Jairzinho': '1964–1982',
  'dream-brazil:Raphinha': '2021–дотепер',
  'dream-brazil:Neymar': '2010–дотепер',
  'dream-brazil:Vinícius Júnior': '2019–дотепер',
  'dream-brazil:Pelé': '1957–1971',
  'dream-brazil:Ronaldo': '1994–2011',
  'dream-brazil:Romário': '1987–2005',
  'dream-brazil:Adriano': '2000–2010',
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

function createTeamStarBadge(team) {
  const starPlayer = team.players.find(player => player.n === team.star) || { n: team.star, avatar: '⭐' };
  return `
    <div class="team-row-star">
      ${createFaceMarkup(team, starPlayer, 'team-row-star-face')}
      <div class="team-row-star-name">${escapeHtml(team.star)}</div>
    </div>
  `;
}

function getTeamLineupCoords(players) {
  const spreadLine = (linePlayers, y, left = 18, right = 82) => {
    if (!linePlayers.length) return [];
    if (linePlayers.length === 1) return [{ player: linePlayers[0], coords: { x: 50, y } }];
    const step = (right - left) / (linePlayers.length - 1);
    return linePlayers.map((player, index) => ({
      player,
      coords: { x: left + step * index, y },
    }));
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

function createTeamLineupMarker(team, player, coords) {
  const isStar = player.n === team.star;
  return `
    <div class="team-lineup-node${isStar ? ' is-star' : ''}" style="left:${coords.x}%; top:${coords.y}%;">
      <div class="team-lineup-face-wrap">
        ${createFaceMarkup(team, player, 'team-lineup-face')}
        ${isStar ? '<div class="team-lineup-star-badge">★</div>' : ''}
      </div>
      <div class="team-lineup-player-name">${escapeHtml(player.n)}</div>
      <div class="team-lineup-player-pos">${escapeHtml(player.pos)}</div>
    </div>
  `;
}

function getTeamStartingXI(team) {
  return team.lineup || team.players;
}

export function openTeamLineup(teamId) {
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
      ${lineup.map((player, index) => createTeamLineupMarker(team, player, coords[index])).join('')}
    </div>
  `;
  enhancePlayerPhotos(pitch);
  overlay.classList.add('show');
}

export function closeTeamLineup() {
  document.getElementById('team-lineup-overlay')?.classList.remove('show');
}

function createEraLineupMarker(team, player, coords) {
  const isStar = player.n === team.star;
  return `
    <div class="era-lineup-node${isStar ? ' is-star' : ''}" style="left:${coords.x}%; top:${coords.y}%;">
      <div class="era-lineup-face-wrap">
        ${createFaceMarkup(team, player, 'era-lineup-face')}
        ${isStar ? '<div class="era-lineup-star-badge">★</div>' : ''}
      </div>
      <div class="era-lineup-player-name">${escapeHtml(player.n)}</div>
      <div class="era-lineup-player-pos">${escapeHtml(player.pos)}</div>
    </div>
  `;
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
      ${lineup.map((player, index) => createEraLineupMarker(team, player, coords[index])).join('')}
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

function clampRoundStat(value) {
  return Math.max(60, Math.min(99, value));
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
    <div class="goat-result-winner goat-result-winner-celebration">
      <div class="goat-result-spark goat-result-spark-a"></div>
      <div class="goat-result-spark goat-result-spark-b"></div>
      <div class="goat-result-spark goat-result-spark-c"></div>
      <div class="goat-result-photo-ring">
        ${createWikiFaceMarkup(winner, 'goat-result-face')}
      </div>
      <div class="goat-result-name">${escapeHtml(winner.n)}</div>
      <div class="goat-result-meta">${escapeHtml(winner.country || '')} · ${escapeHtml(winner.tag || '')}</div>
      <div class="goat-result-caption">Чемпіон сітки · святкує перемогу</div>
    </div>
  `;
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
  if (screenId === 'match' || screenId === 'era' || screenId === 'era-lineup' || screenId === 'goat-cats' || screenId === 'goat' || screenId === 'dream-teams' || screenId === 'dream' || screenId === 'dream-result') {
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
  currentDreamTeamId = null;
  currentDreamTeam = null;
  currentDreamStep = 0;
  currentDreamSelections = {};
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

export function goToDreamResult() {
  goTo('dream-result');
  renderDreamResult();
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

function getDreamTeam() {
  return DREAM_XI_TEAMS.find(team => team.id === currentDreamTeamId) || currentDreamTeam;
}

function getDreamPosition() {
  return getDreamTeam()?.positions[currentDreamStep] || null;
}

function getDreamAverageRating() {
  const selected = Object.values(currentDreamSelections);
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
      ` : `
        <div class="dream-slot-empty">${escapeHtml(position.short)}</div>
      `}
    </div>
  `;
}

function createDreamCandidateCard(position, player, index) {
  const honor = DREAM_PLAYER_HONORS[player.n] || player.tag;
  const years = DREAM_PLAYER_YEARS[`${currentDreamTeamId}:${player.n}`] || '';
  return `
    <button class="dream-candidate-card anim-in" style="animation-delay:${index * 0.05}s" type="button" data-dream-player="${escapeHtml(player.n)}">
      <div class="dream-candidate-top">
        <div>
          <div class="dream-candidate-rating">${player.stat}</div>
          <div class="dream-candidate-role">${escapeHtml(position.short)}</div>
        </div>
      </div>
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
  document.getElementById('dream-progress-badge').textContent = `${currentDreamStep + 1}/${team.positions.length}`;
  document.getElementById('dream-summary-label').textContent = `${team.shortName} · ${team.formation}`;
  document.getElementById('dream-position-title').textContent = position.label;
  document.getElementById('dream-summary-step').textContent = `Крок ${currentDreamStep + 1} з ${team.positions.length}`;
  document.getElementById('dream-summary-desc').textContent = `Обери гравця на позицію «${position.label.toLowerCase()}».`;

  const selectedNames = new Set(
    Object.entries(currentDreamSelections)
      .filter(([slotId]) => slotId !== position.id)
      .map(([, player]) => player.n)
  );
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

  pitch.innerHTML = `
    <div class="dream-pitch-canvas">
      ${team.positions.map(position => createDreamSlotMarker(position, currentDreamSelections[position.id])).join('')}
    </div>
  `;
  enhancePlayerPhotos(pitch);
}

export function goToDreamTeams() {
  const grid = document.getElementById('dream-team-grid');
  grid.innerHTML = DREAM_XI_TEAMS.map((team, index) => createDreamTeamCard(team, index)).join('');
  goTo('dream-teams');
}

export function startDreamDraft(teamId) {
  const team = DREAM_XI_TEAMS.find(item => item.id === teamId);
  if (!team) return;
  currentDreamTeamId = teamId;
  currentDreamTeam = team;
  currentDreamStep = 0;
  currentDreamSelections = {};
  goTo('dream');
  renderDreamCandidates();
}

export function selectDreamPlayer(playerName) {
  const team = getDreamTeam();
  const position = getDreamPosition();
  if (!team || !position) return;

  const candidate = position.candidates.find(player => player.n === playerName);
  if (!candidate) return;
  currentDreamSelections[position.id] = { ...candidate };
  currentDreamStep += 1;

  if (currentDreamStep >= team.positions.length) {
    goTo('dream-result');
    renderDreamResult();
    return;
  }

  renderDreamCandidates();
}

export function goBackFromDreamDraft() {
  if (currentDreamStep > 0) {
    currentDreamStep -= 1;
    const team = getDreamTeam();
    const previousPosition = team?.positions[currentDreamStep];
    if (previousPosition) delete currentDreamSelections[previousPosition.id];
    renderDreamCandidates();
    return;
  }
  goToDreamTeams();
}

export function replayDreamDraft() {
  if (!currentDreamTeamId) return;
  startDreamDraft(currentDreamTeamId);
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
    const abilityTitle = team.abilityTitle || team.ability?.split(':')[0] || '';
    const div = document.createElement('div');
    div.className = 'team-row anim-in' + (team.id === selectedTeamId ? ' selected' : '');
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
          <div class="team-row-ability-tag">★ ${escapeHtml(abilityTitle)}</div>
        </div>
      </div>
      <div class="team-row-rating">${team.rating}</div>
    `;
    div.addEventListener('click', event => {
      if (event.target.closest('[data-team-preview]')) return;
      selectTeam(team.id, div);
    });
    list.appendChild(div);
  });
  enhancePlayerPhotos(list);
}

export function selectTeam(id, el) {
  document.querySelectorAll('.team-row').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  selectedTeamId = id;
  const team = TEAMS.find(t => t.id === id);
  if (!team) return;
  renderEraLineupScreen(team);
  goTo('era-lineup');
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

export function resolveRound() {
  if (!chosenPlayer) return;

  const round = ROUNDS[currentRound];
  const myBase = getRoundValue(chosenPlayer, round.key);
  const oppPlayer = getOpponentForRound(oppTeam, round.key);
  const oppBase = getRoundValue(oppPlayer, round.key);
  const myVal = clampRoundStat(myBase + Math.floor(Math.random() * 5) - 2);
  const oppVal = clampRoundStat(oppBase + Math.floor(Math.random() * 5) - 2);
  const won = myVal === oppVal ? myBase >= oppBase : myVal > oppVal;

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
