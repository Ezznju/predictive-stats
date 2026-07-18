/**
 * Pure intelligence primitives shared by both scanners.
 *
 * Everything here is dependency-free, deterministic and side-effect free so it
 * can run identically on the server (API routes) or in the browser (client
 * components / Web Workers). No imports from React, Next or network layers.
 */

/* ── Text normalisation & tokenisation ─────────────────────────────── */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'is', 'be',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'has', 'have',
  'had', 'do', 'does', 'did', 'are', 'was', 'were', 'been', 'being',
  'this', 'that', 'these', 'those', 'it', 'its', 'or', 'and', 'but',
  'if', 'then', 'than', 'so', 'not', 'no', 'yes', 'any', 'all',
  'with', 'from', 'about', 'into', 'over', 'after', 'before',
  'between', 'under', 'during', 'through', 'above', 'below',
  'up', 'down', 'out', 'off', 'more', 'less', 'most', 'least',
  'win', 'next', 'new', 'become', 'what', 'who', 'when', 'where',
  'how', 'which', 'their', 'there', 'here', 'very', 'just',
]);

/** Collapse common synonyms so cross-platform titles align. */
const SYNONYMS: Record<string, string> = {
  president: 'potus',
  presidential: 'potus',
  bitcoin: 'btc',
  ethereum: 'eth',
  democrat: 'dem',
  democratic: 'dem',
  republican: 'gop',
  nominee: 'nomination',
  elected: 'win',
  election: 'elect',
  championship: 'title',
  champion: 'title',
  vs: 'v',
  versus: 'v',
};

export interface Tokenized {
  /** Alphanumeric tokens, stop-words removed, synonyms collapsed. */
  tokens: string[];
  /** Distinct significant tokens (for set-overlap metrics). */
  set: Set<string>;
  /** 4-digit years (2024, 2025…) — hard date anchors for matching. */
  years: Set<string>;
  /** First integer found (e.g. "250 electoral votes" → 250). */
  number: number | null;
}

export function tokenize(text: string): Tokenized {
  const clean = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const raw = clean ? clean.split(' ') : [];
  const tokens: string[] = [];
  const years = new Set<string>();
  let number: number | null = null;

  for (let w of raw) {
    if (!w) continue;
    if (/^\d{4}$/.test(w) && +w >= 1900 && +w <= 2100) {
      years.add(w);
      continue; // keep years out of the fuzzy token set — they're matched separately
    }
    if (number === null && /^\d+$/.test(w)) {
      number = parseInt(w, 10);
      continue;
    }
    w = SYNONYMS[w] ?? w;
    if (w.length > 1 && !STOP_WORDS.has(w)) tokens.push(w);
  }

  return { tokens, set: new Set(tokens), years, number };
}

/* ── Similarity metrics ────────────────────────────────────────────── */

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  a.forEach((t) => {
    if (b.has(t)) inter++;
  });
  const union = a.size + b.size - inter;
  return union > 0 ? inter / union : 0;
}

/** Dice coefficient over bigrams of two strings — tolerant to word order. */
export function diceBigram(a: string, b: string): number {
  const grams = (s: string): Map<string, number> => {
    const m = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const g = s.slice(i, i + 2);
      m.set(g, (m.get(g) ?? 0) + 1);
    }
    return m;
  };
  const A = grams(a);
  const B = grams(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach((count, g) => {
    const bc = B.get(g);
    if (bc) inter += Math.min(count, bc);
  });
  return (2 * inter) / (A.size + B.size);
}

/* ── Composite event match score ───────────────────────────────────── */

export interface MatchResult {
  /** 0..1 blended confidence that two texts refer to the same event. */
  score: number;
  /** Individual signal contributions (for transparency / debugging). */
  signals: { token: number; bigram: number; dateBonus: number; numberBonus: number };
  /** True when a hard date/number conflict proves these are NOT the same. */
  conflict: boolean;
}

/**
 * Score how likely two event titles describe the same underlying event.
 *
 * Combines fuzzy token overlap and bigram similarity, then applies hard
 * date/number anchors that either boost confidence or veto a false match.
 */
export function eventSimilarity(aText: string, bText: string): MatchResult {
  const a = tokenize(aText);
  const b = tokenize(bText);

  const token = jaccard(a.set, b.set);
  const bigram = diceBigram(a.tokens.join(' '), b.tokens.join(' '));

  // Date logic: shared year = strong boost; disjoint years (when both have
  // them) = hard conflict (different cycles entirely).
  let dateBonus = 0;
  let conflict = false;
  if (a.years.size > 0 && b.years.size > 0) {
    let shared = 0;
    a.years.forEach((y) => {
      if (b.years.has(y)) shared++;
    });
    if (shared > 0) dateBonus = 0.15;
    else conflict = true;
  }

  // Number logic: matching numeric thresholds boost, mismatching large
  // numbers penalise (e.g. "250k" vs "500k" are different markets).
  let numberBonus = 0;
  if (a.number !== null && b.number !== null) {
    if (a.number === b.number) numberBonus = 0.1;
    else if (Math.abs(a.number - b.number) / Math.max(a.number, b.number) > 0.25)
      numberBonus = -0.1;
  }

  const score = conflict
    ? 0
    : Math.min(1, token * 0.55 + bigram * 0.35 + dateBonus + numberBonus);

  return { score, signals: { token, bigram, dateBonus, numberBonus }, conflict };
}

/* ── Kelly criterion & risk sizing ─────────────────────────────────── */

export interface KellyResult {
  /** Full-Kelly optimal fraction of bankroll (can be negative = don't bet). */
  full: number;
  /** Half-Kelly (recommended for correlated/real-world risk). */
  half: number;
  /** Quarter-Kelly (conservative). */
  quarter: number;
}

/**
 * Kelly criterion for a binary bet.
 * @param p  estimated win probability (0..1)
 * @param price  price paid per share (0..1); payout is 1 on win, 0 on loss.
 */
export function kellyCriterion(p: number, price: number): KellyResult {
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  p = clamp01(p);
  price = clamp01(price);
  if (price <= 0 || price >= 1 || p <= 0) {
    return { full: 0, half: 0, quarter: 0 };
  }
  const b = (1 - price) / price; // net odds received on the wager
  const q = 1 - p;
  const full = Math.max(0, (b * p - q) / b);
  return { full, half: full / 2, quarter: full / 4 };
}

/* ── Misc math helpers ─────────────────────────────────────────────── */

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Logistic squashing to 0..1 — used for smooth probability-style scores. */
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Safe division returning 0 instead of NaN/Infinity. */
export function safeDiv(a: number, b: number): number {
  const r = a / b;
  return Number.isFinite(r) ? r : 0;
}

/** Round to N decimals, guarding against NaN. */
export function round(n: number, decimals = 2): number {
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
