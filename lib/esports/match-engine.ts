/* ── Esports Match Types & Simulation Engine ─────────────────────────── */

export interface GameConfig {
  label: string;
  color: string;
  type: 'rounds' | 'games';
  target: number;
  htRounds?: number;
  roundSec?: number;
  gMin?: number;
}

export const GAMES: Record<string, GameConfig> = {
  CS2: { label: 'CS2', color: '#FFE642', type: 'rounds', target: 13, htRounds: 12, roundSec: 115 },
  VAL: { label: 'VAL', color: '#2BD96E', type: 'rounds', target: 13, htRounds: 12, roundSec: 100 },
  LoL: { label: 'LoL', color: '#29C5F6', type: 'games', target: 2, gMin: 31 },
  DOTA2: { label: 'DOTA2', color: '#FF7900', type: 'games', target: 2, gMin: 37 },
};

export type MatchState = 'PRE' | 'LIVE' | 'HT' | 'DONE';

export interface EsportsMatch {
  id: number;
  game: string;
  league: string;
  a: string;
  b: string;
  colorA: string;
  colorB: string;
  state: MatchState;
  half?: number;
  round?: number;
  clock?: number;
  sA?: number;
  sB?: number;
  gNum?: number;
  gMin?: number;
  ga?: number;
  gb?: number;
  mid: number;
  str?: number;
  pool: number;
  mOpen: number;
  mNow: number;
  featured?: boolean;
  map?: number;
  winner?: string;
  pre?: number;
  mp?: boolean;
  secondHalf?: boolean;
  winOpen?: boolean;
  decay: number;
  makerCap: number;
  est1k: number;
  spread: number;
  edge: number;
  grade: string;
  hist: number[];
  prevMid?: number;
  psA?: number;
  psB?: number;
  pMid?: number;
  doneT?: number;
  htT?: number;
}

export interface FeedEvent {
  t: string;
  tag: string;
  mid: number;
  txt: string;
}

export function winProbR(m: EsportsMatch): number {
  const x = 0.45 * ((m.sA ?? 0) - (m.sB ?? 0));
  return clamp(1 / (1 + Math.exp(-x)), 0.03, 0.97);
}

export function winProbG(m: EsportsMatch): number {
  return clamp(0.5 + (m.str ?? 0) + 0.28 * ((m.ga ?? 0) - (m.gb ?? 0)), 0.05, 0.95);
}

export function isMatchPoint(m: EsportsMatch): boolean {
  const g = GAMES[m.game];
  if (!g || g.type !== 'rounds' || m.state !== 'LIVE') return false;
  return (m.sA ?? 0) === g.target - 1 || (m.sB ?? 0) === g.target - 1;
}

export function derive(m: EsportsMatch): void {
  const g = GAMES[m.game];
  if (!g) return;
  m.decay = 1 - m.mNow / m.mOpen;
  m.makerCap = m.mNow * 300;
  m.est1k = m.pool * (1000 / (m.makerCap + 1000));
  m.spread = +(2.2 + 6 * m.decay + (isMatchPoint(m) ? 2.5 : 0)).toFixed(1);
  m.secondHalf = g.type === 'rounds' ? m.half === 2 : (m.gNum ?? 0) >= 2;
  m.winOpen =
    m.state === 'HT' ||
    (m.state === 'LIVE' && ((m.secondHalf && m.decay > 0.45) || isMatchPoint(m)));
  const y = Math.min(m.est1k / 40, 1);
  const w = m.winOpen ? 1 : m.state === 'PRE' ? 0.15 : 0.3;
  m.edge = Math.round(100 * (0.4 * y + 0.3 * m.decay + 0.15 * Math.min(m.spread / 8, 1) + 0.15 * w));
  m.grade = m.edge >= 78 ? 'S' : m.edge >= 64 ? 'A' : m.edge >= 50 ? 'B' : m.edge >= 36 ? 'C' : 'D';
}

export function backfill(m: EsportsMatch): void {
  const h: number[] = [];
  let v = m.mOpen;
  for (let i = 0; i < 22; i++) {
    v += (m.mNow - v) * (i > 16 ? 0.5 : 0.08) + (Math.random() - 0.5) * 1.6;
    h.push(Math.max(3, Math.round(v)));
  }
  h[21] = m.mNow;
  m.hist = h;
}

export function tick(matches: EsportsMatch[], feed: (m: EsportsMatch, txt: string) => void): void {
  matches.forEach((m) => {
    const g = GAMES[m.game];
    if (!g) return;

    if (m.state === 'PRE') {
      m.pre = (m.pre ?? 0) - 30;
      if (m.pre <= 0) {
        m.state = 'LIVE';
        if (g.type === 'rounds') {
          m.round = 1;
          m.clock = g.roundSec;
          m.sA = 0;
          m.sB = 0;
          m.half = 1;
        } else {
          m.gNum = 1;
          m.gMin = 0;
          m.ga = 0;
          m.gb = 0;
        }
        feed(m, 'LIVE — opening book: ' + m.mOpen + ' makers, pool $' + m.pool + '/day');
      }
      return;
    }

    if (m.state === 'DONE') {
      if (m.featured) {
        m.doneT = (m.doneT ?? 0) + 1;
        if (m.doneT >= 5) {
          m.doneT = 0;
          m.map = (m.map ?? 1) + 1;
          m.state = 'LIVE';
          m.half = 1;
          m.round = 1;
          m.clock = g.roundSec;
          m.sA = 0;
          m.sB = 0;
          m.mid = clamp(0.5 + (Math.random() - 0.5) * 0.16, 0.2, 0.8);
          m.mNow = Math.round(m.mOpen * 0.85);
          m.mp = false;
          feed(m, 'MAP ' + m.map + ' — book rebuilding at ' + m.mNow + ' makers. Capital recycled.');
        }
      }
      return;
    }

    if (m.state === 'HT') {
      m.htT = (m.htT ?? 0) + 1;
      if (m.htT >= 3) {
        m.htT = 0;
        m.state = 'LIVE';
        if (g.type === 'rounds') {
          m.half = 2;
          m.round = (g.htRounds ?? 12) + 1;
          m.clock = g.roundSec;
        } else {
          m.gNum = (m.gNum ?? 1) + 1;
          m.gMin = 0;
        }
        feed(m, 'Second half underway — book down to ' + m.mNow + ' makers');
      }
      return;
    }

    // LIVE
    if (g.type === 'rounds') {
      m.clock = (m.clock ?? 0) - 16;
      if (m.clock <= 0) {
        const p = winProbR(m);
        const aW = Math.random() < p;
        const old = m.mid;
        if (aW) m.sA = (m.sA ?? 0) + 1;
        else m.sB = (m.sB ?? 0) + 1;
        m.round = (m.sA ?? 0) + (m.sB ?? 0) + 1;
        m.clock = g.roundSec;
        m.mid = winProbR(m);
        const swing = Math.abs(m.mid - old);
        let pulls = Math.random() < 0.3 + swing * 3 ? 1 + Math.round(Math.random() * 2) : 0;
        if (Math.random() < 0.22) pulls++;
        if (pulls) m.mNow = Math.max(3, m.mNow - pulls);
        feed(
          m,
          'R' + ((m.round ?? 1) - 1) + ' → ' + (aW ? m.a : m.b) + ' · mid ' + (old * 100).toFixed(1) + '→' + (m.mid * 100).toFixed(1) + '¢' + (pulls ? ' · ' + pulls + ' maker' + (pulls > 1 ? 's' : '') + ' pull' : '')
        );
        if (m.half === 1 && (m.sA ?? 0) + (m.sB ?? 0) === (g.htRounds ?? 12)) {
          m.state = 'HT';
          m.mNow = Math.max(3, Math.round(m.mNow * 0.7));
          feed(m, 'HALFTIME ' + m.sA + '–' + m.sB + ' — book thins to ' + m.mNow + ' makers');
        } else if ((m.sA ?? 0) === g.target || (m.sB ?? 0) === g.target) {
          m.state = 'DONE';
          m.winner = (m.sA ?? 0) > (m.sB ?? 0) ? m.a : m.b;
          feed(m, 'SETTLED ' + m.sA + '–' + m.sB + ' · ' + m.winner + ' — capital recycling');
        } else if (!m.mp && isMatchPoint(m)) {
          m.mp = true;
          feed(m, 'MATCH POINT ' + ((m.sA ?? 0) > (m.sB ?? 0) ? m.a : m.b) + ' — spread widening, books thinning');
        }
      }
    } else {
      m.gMin = (m.gMin ?? 0) + 2;
      m.mid = clamp(m.mid + (Math.random() - 0.5) * 0.02, 0.05, 0.95);
      if (m.gMin >= (g.gMin ?? 31) + Math.random() * 8) {
        const aW = Math.random() < winProbG(m);
        if (aW) m.ga = (m.ga ?? 0) + 1;
        else m.gb = (m.gb ?? 0) + 1;
        m.mid = winProbG(m);
        m.mNow = Math.max(3, m.mNow - Math.round(2 + Math.random() * 3));
        feed(m, 'GAME ' + m.gNum + ' → ' + (aW ? m.a : m.b) + ' · series ' + m.ga + '–' + m.gb + ' · makers now ' + m.mNow);
        if ((m.ga ?? 0) === g.target || (m.gb ?? 0) === g.target) {
          m.state = 'DONE';
          m.winner = (m.ga ?? 0) > (m.gb ?? 0) ? m.a : m.b;
          feed(m, 'SERIES SETTLED ' + m.ga + '–' + m.gb + ' · ' + m.winner);
        } else {
          m.state = 'HT';
          m.gMin = 0;
          feed(m, 'Between games — book at ' + m.mNow + ' makers');
        }
      }
    }

    if (Math.random() < 0.18) m.mNow = Math.max(3, m.mNow - 1);
    m.hist.push(m.mNow);
    if (m.hist.length > 40) m.hist.shift();
  });

  matches.forEach(derive);
}

export function createInitialMatches(): EsportsMatch[] {
  const raw: Partial<EsportsMatch>[] = [
    { id: 0, game: 'CS2', league: 'IEM Cologne · Semifinal', a: 'NAVI', b: 'FaZe', colorA: '#FFE642', colorB: '#FF4757', state: 'LIVE', half: 2, round: 22, sA: 11, sB: 10, clock: 67, mid: 0.61, pool: 120, mOpen: 34, mNow: 9, map: 1, featured: true },
    { id: 1, game: 'CS2', league: 'IEM Cologne · Semifinal', a: 'Vitality', b: 'G2', colorA: '#FF7900', colorB: '#C8D2E0', state: 'LIVE', half: 2, round: 15, sA: 8, sB: 6, clock: 92, mid: 0.71, pool: 95, mOpen: 28, mNow: 16 },
    { id: 2, game: 'LoL', league: 'LCK Summer', a: 'T1', b: 'GenG', colorA: '#EC4899', colorB: '#AA8A58', state: 'LIVE', gNum: 2, gMin: 24, ga: 1, gb: 0, mid: 0.78, str: 0.28, pool: 140, mOpen: 41, mNow: 23 },
    { id: 3, game: 'LoL', league: 'LEC Summer', a: 'Fnatic', b: 'G2 Esports', colorA: '#FF7900', colorB: '#C8D2E0', state: 'LIVE', gNum: 1, gMin: 18, ga: 0, gb: 0, mid: 0.46, str: -0.04, pool: 85, mOpen: 26, mNow: 22 },
    { id: 4, game: 'DOTA2', league: 'Riyadh Masters', a: 'Spirit', b: 'Falcons', colorA: '#D1A539', colorB: '#2BD96E', state: 'LIVE', gNum: 2, gMin: 31, ga: 1, gb: 0, mid: 0.78, str: 0.2, pool: 110, mOpen: 31, mNow: 14 },
    { id: 5, game: 'VAL', league: 'VCT Americas', a: 'Sentinels', b: 'LOUD', colorA: '#FF4757', colorB: '#FFE642', state: 'PRE', pre: 42 * 60, mid: 0.52, pool: 75, mOpen: 19, mNow: 19 },
    { id: 6, game: 'CS2', league: 'BLAST Premier', a: 'Liquid', b: 'Complexity', colorA: '#4A6CF7', colorB: '#E8E8E8', state: 'PRE', pre: 78 * 60, mid: 0.55, pool: 60, mOpen: 15, mNow: 15 },
    { id: 7, game: 'DOTA2', league: 'Riyadh Masters', a: 'OG', b: 'Tundra', colorA: '#9D5CFF', colorB: '#29C5F6', state: 'LIVE', gNum: 3, gMin: 35, ga: 1, gb: 1, mid: 0.51, str: 0.01, pool: 130, mOpen: 36, mNow: 8 },
    { id: 8, game: 'LoL', league: 'LCS Summer', a: '100 Thieves', b: 'Cloud9', colorA: '#EC4899', colorB: '#4A6CF7', state: 'HT', gNum: 1, gMin: 0, ga: 1, gb: 0, mid: 0.78, str: 0.28, pool: 70, mOpen: 22, mNow: 13 },
    { id: 9, game: 'VAL', league: 'VCT Pacific', a: 'PRX', b: 'DRX', colorA: '#FF7900', colorB: '#29C5F6', state: 'LIVE', half: 2, round: 17, sA: 9, sB: 7, clock: 44, mid: 0.71, pool: 90, mOpen: 24, mNow: 12 },
  ];

  return raw.map((m) => ({
    ...m,
    half: m.half ?? 0,
    round: m.round ?? 0,
    clock: m.clock ?? 0,
    sA: m.sA ?? 0,
    sB: m.sB ?? 0,
    gNum: m.gNum ?? 0,
    gMin: m.gMin ?? 0,
    ga: m.ga ?? 0,
    gb: m.gb ?? 0,
    str: m.str ?? 0,
    pre: m.pre ?? 0,
    decay: 0,
    makerCap: 0,
    est1k: 0,
    spread: 0,
    edge: 0,
    grade: 'D',
    hist: [],
  })) as EsportsMatch[];
}

function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v));
}
