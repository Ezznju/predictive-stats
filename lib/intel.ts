/**
 * Pure intelligence primitives shared by both scanners.
 *
 * Everything here is dependency-free, deterministic and side-effect free so it
 * can run identically on the server (API routes) or in the browser (client
 * components / Web Workers). No imports from React, Next or network layers.
 */

/* ── Text normalisation & tokenisation ─────────────────────────────── */

// NOTE: Direction / polarity words (above, below, over, under, before, after,
// more, less, not, cut, hike, higher, lower) are INTENTIONALLY excluded from
// STOP_WORDS and tracked separately as polarity anchors so opposite markets
// ("BTC above $100k" vs "BTC below $100k") are hard-vetoed instead of matched.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'is', 'be',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'has', 'have',
  'had', 'do', 'does', 'did', 'are', 'was', 'were', 'been', 'being',
  'this', 'that', 'these', 'those', 'it', 'its', 'or', 'and', 'but',
  'if', 'then', 'than', 'so', 'any', 'all',
  'with', 'from', 'about', 'into', 'between', 'during', 'through',
  'up', 'down', 'out', 'off', 'most', 'least',
  'next', 'new', 'become', 'what', 'who', 'when', 'where',
  'how', 'which', 'their', 'there', 'here', 'very', 'just',
]);

/** Antonym pairs — if text A carries side 0 and text B carries side 1, hard veto. */
const POLARITY_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['above', 'below'],
  ['over', 'under'],
  ['before', 'after'],
  ['more', 'less'],
  ['higher', 'lower'],
  ['cut', 'hike'],
  ['cuts', 'hikes'],
  ['increase', 'decrease'],
  ['rise', 'fall'],
  ['win', 'lose'],
];

const NEGATION_WORDS = new Set(['not', 'never', 'wont', "won't", 'without', 'fail', 'fails']);

const MONTH_CANON: Record<string, string> = {
  jan: 'jan', january: 'jan',
  feb: 'feb', february: 'feb',
  mar: 'mar', march: 'mar',
  apr: 'apr', april: 'apr',
  may: 'may',
  jun: 'jun', june: 'jun',
  jul: 'jul', july: 'jul',
  aug: 'aug', august: 'aug',
  sep: 'sep', sept: 'sep', september: 'sep',
  oct: 'oct', october: 'oct',
  nov: 'nov', november: 'nov',
  dec: 'dec', december: 'dec',
};

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
  federal: 'fed',
  fomc: 'fed',
};

export interface Tokenized {
  /** Alphanumeric tokens, stop-words removed, synonyms collapsed. */
  tokens: string[];
  /** Distinct significant tokens (for set-overlap metrics). */
  set: Set<string>;
  /** 4-digit years (2024, 2025…) — hard date anchors for matching. */
  years: Set<string>;
  /** Canonical calendar months ('jan'..'dec') — prevents cross-month mismatches. */
  months: Set<string>;
  /** First numeric threshold found (normalized: "$100k" -> 100000, "3.5%" -> 3.5). */
  number: number | null;
  /** All normalized numeric thresholds found in the text. */
  thresholds: number[];
  /** Direction/polarity tokens present. */
  polarity: Set<string>;
  /** Whether negation ("not", "never", "won't") appears in the market text. */
  negated: boolean;
}

/** Parse numeric tokens including k/m/b suffixes and decimals ("$100k", "3.5%", "2.4m"). */
function parseScaledNumber(rawToken: string): number | null {
  const cleaned = rawToken.replace(/[,$%]/g, '');
  const m = cleaned.match(/^(\d+(?:\.\d+)?)(k|m|b)?$/i);
  if (!m) return null;
  const base = parseFloat(m[1]);
  if (!Number.isFinite(base)) return null;
  const mult =
    m[2]?.toLowerCase() === 'k'
      ? 1_000
      : m[2]?.toLowerCase() === 'm'
      ? 1_000_000
      : m[2]?.toLowerCase() === 'b'
      ? 1_000_000_000
      : 1;
  return base * mult;
}

export function tokenize(text: string): Tokenized {
  // Keep dots & commas inside numbers ("$100,000", "3.5%", "$2.5m") before stripping punctuation.
  const pre = (text || '')
    .toLowerCase()
    .replace(/(\d),(\d)/g, '$1$2')
    .replace(/[^a-z0-9.\s'%-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const raw = pre ? pre.split(' ') : [];
  const tokens: string[] = [];
  const years = new Set<string>();
  const months = new Set<string>();
  const thresholds: number[] = [];
  const polarity = new Set<string>();
  let negated = false;

  for (let w of raw) {
    w = w.replace(/^\.+|\.+$/g, '');
    if (!w) continue;

    if (NEGATION_WORDS.has(w)) {
      negated = true;
      continue;
    }

    if (/^\d{4}$/.test(w) && +w >= 1900 && +w <= 2100) {
      years.add(w);
      continue;
    }

    const num = parseScaledNumber(w);
    if (num !== null) {
      thresholds.push(num);
      continue;
    }

    const canonMonth = MONTH_CANON[w];
    if (canonMonth) {
      months.add(canonMonth);
      tokens.push(canonMonth);
      continue;
    }

    for (const [a, b] of POLARITY_PAIRS) {
      if (w === a || w === b) {
        polarity.add(w);
        break;
      }
    }

    w = SYNONYMS[w] ?? w;
    if (w.length > 1 && !STOP_WORDS.has(w)) tokens.push(w);
  }

  return {
    tokens,
    set: new Set(tokens),
    years,
    months,
    number: thresholds.length > 0 ? thresholds[0] : null,
    thresholds,
    polarity,
    negated,
  };
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
  /** True when a hard date/number/polarity conflict proves these are NOT the same. */
  conflict: boolean;
}

/**
 * Score how likely two event titles describe the same underlying event.
 *
 * Combines fuzzy token overlap and bigram similarity, then applies hard
 * polarity, negation, calendar-month, year, and numeric-threshold anchors
 * that either boost confidence or hard-veto false matches.
 */
export function eventSimilarity(aText: string, bText: string): MatchResult {
  const a = tokenize(aText);
  const b = tokenize(bText);

  const token = jaccard(a.set, b.set);
  const bigram = diceBigram(a.tokens.join(' '), b.tokens.join(' '));

  let dateBonus = 0;
  let numberBonus = 0;
  let conflict = false;

  // 1. Negation mismatch ("Will X happen?" vs "Will X NOT happen?")
  if (a.negated !== b.negated) {
    conflict = true;
  }

  // 2. Polarity / antonym conflict ("above" vs "below", "before" vs "after", "cut" vs "hike")
  if (!conflict && a.polarity.size > 0 && b.polarity.size > 0) {
    for (const [left, right] of POLARITY_PAIRS) {
      const aHasLeft = a.polarity.has(left);
      const aHasRight = a.polarity.has(right);
      const bHasLeft = b.polarity.has(left);
      const bHasRight = b.polarity.has(right);
      if ((aHasLeft && !aHasRight && bHasRight && !bHasLeft) || (aHasRight && !aHasLeft && bHasLeft && !bHasRight)) {
        conflict = true;
        break;
      }
    }
  }

  // 3. Year anchors: disjoint years = different cycles entirely.
  if (!conflict && a.years.size > 0 && b.years.size > 0) {
    let shared = 0;
    a.years.forEach((y) => {
      if (b.years.has(y)) shared++;
    });
    if (shared > 0) dateBonus += 0.15;
    else conflict = true;
  }

  // 4. Calendar month anchors: "July FOMC" vs "September FOMC" = hard conflict.
  if (!conflict && a.months.size > 0 && b.months.size > 0) {
    let sharedMonth = 0;
    a.months.forEach((m) => {
      if (b.months.has(m)) sharedMonth++;
    });
    if (sharedMonth > 0) dateBonus += 0.08;
    else conflict = true;
  }

  // 5. Numeric thresholds: "$100k" vs "$150k" or "3.0%" vs "3.5%" = hard veto.
  if (!conflict && a.thresholds.length > 0 && b.thresholds.length > 0) {
    let anyExactMatch = false;
    for (const na of a.thresholds) {
      for (const nb of b.thresholds) {
        const denom = Math.max(Math.abs(na), Math.abs(nb), 1);
        if (Math.abs(na - nb) / denom <= 0.01) {
          anyExactMatch = true;
          break;
        }
      }
      if (anyExactMatch) break;
    }
    if (anyExactMatch) {
      numberBonus = 0.12;
    } else {
      conflict = true;
    }
  }

  const score = conflict
    ? 0
    : clamp(token * 0.55 + bigram * 0.35 + dateBonus + numberBonus, 0, 1);

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
 * @param price  effective cost per share incl. fees (0..1); payout is 1 on win, 0 on loss.
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
