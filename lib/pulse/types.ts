/**
 * Prediction Pulse — type definitions.
 *
 * Covers Polymarket Data API responses, internal whale detection models,
 * and UI component props.
 */

/* ── Polymarket Data API responses ─────────────────────────── */

export interface LeaderboardEntry {
  rank: string;
  proxyWallet: string;
  userName: string;
  pseudonym?: string;
  bio?: string;
  xUsername: string;
  verifiedBadge: boolean;
  vol: number;
  pnl: number;
  profileImage: string;
}

export interface Trade {
  proxyWallet: string;
  side: 'BUY' | 'SELL';
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  name: string;
  pseudonym: string;
  bio: string;
  profileImage: string;
  profileImageOptimized: string;
  transactionHash: string;
}

export interface Holder {
  proxyWallet: string;
  bio: string;
  asset: string;
  pseudonym: string;
  amount: number;
  displayUsernamePublic: boolean;
  outcomeIndex: number;
  name: string;
  profileImage: string;
  profileImageOptimized: string;
  verified: boolean;
}

export interface MarketHolders {
  token: string;
  holders: Holder[];
}

export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string;
  outcomePrices: string;
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  startDate: string;
  bestBid: number;
  bestAsk: number;
  lastTradePrice: number;
  spread: number;
  clobTokenIds: string;
  image: string;
  groupItemTitle: string;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  volume: number;
  volume24hr: number;
  liquidity: number;
  openInterest: number;
  category: string;
  markets: GammaMarket[];
  tags: { label: string }[];
}

export interface WalletProfile {
  proxyWallet: string;
  username: string;
  bio: string;
  profileImage: string;
  xUsername: string;
}

/* ── Internal models ───────────────────────────────────────── */

export interface WhaleWallet {
  address: string;
  username: string;
  bio: string;
  profileImage: string;
  xUsername: string;
  rank: number;
  pnl: number;
  volume: number;
  winRate: number;
  tradeCount: number;
  isSmart: boolean;
  skillScore: number;
}

export interface WhaleTrade {
  id: string;
  walletAddress: string;
  walletUsername: string;
  walletProfileImage: string;
  conditionId: string;
  marketTitle: string;
  marketSlug: string;
  eventSlug: string;
  side: 'BUY' | 'SELL';
  outcome: string;
  size: number;
  price: number;
  usdcSize: number;
  txHash: string;
  isWhale: boolean;
  anomalyScore: number;
  detectedAt: string;
}

export interface MarketWhaleStats {
  conditionId: string;
  marketTitle: string;
  marketSlug: string;
  eventSlug: string;
  category: string;
  volume24hr: number;
  liquidity: number;
  whaleVolume: number;
  whaleBuyCount: number;
  whaleSellCount: number;
  whaleUnique: number;
  topHolders: Holder[];
}

export interface WhaleFeedItem {
  walletAddress: string;
  walletUsername: string;
  walletProfileImage: string;
  side: 'BUY' | 'SELL';
  outcome: string;
  size: number;
  price: number;
  usdcSize: number;
  marketTitle: string;
  marketSlug: string;
  eventSlug: string;
  conditionId: string;
  timestamp: number;
  txHash: string;
  anomalyScore: number;
  convictionScore?: number;
  convictionParts?: {
    sizeZ: number;
    walletSkill: number;
    categoryExpertise: number;
    liquidityFactor: number;
    recencyDecay: number;
    confidence: number;
    compositeScore: number;
    riskFlags: string[];
  };
  riskFlags?: string[];
  /** True if buy price > 95% — position close, not directional signal */
  isParking?: boolean;
  /** Edge room in percentage points (1 - price) * 100 */
  edgeRoom?: number;
}

/** Aggregated card: same wallet + same market = one card */
export interface AggregatedWhaleCard {
  walletAddress: string;
  walletUsername: string;
  walletProfileImage: string;
  marketTitle: string;
  marketSlug: string;
  eventSlug: string;
  conditionId: string;
  side: 'BUY' | 'SELL';
  tradeCount: number;
  totalUsdcSize: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  firstTimestamp: number;
  lastTimestamp: number;
  avgConviction: number;
  isParking: boolean;
  edgeRoom: number;
  /** Whether this is a rapid-repeat pattern (3+ trades in 20 min) */
  isRapidRepeat: boolean;
  trades: WhaleFeedItem[];
}

export interface PulseStats {
  totalWhales: number;
  activeWhales24h: number;
  totalVolume24h: number;
  whaleVolume24h: number;
  topMarket: string;
  avgWhaleSize: number;
}

/* ── Filter / sort types ───────────────────────────────────── */

export type PulseCategory = 'ALL' | 'POLITICS' | 'CRYPTO' | 'SPORTS' | 'ECONOMICS' | 'TECH' | 'CULTURE';

export type PulseSort = 'newest' | 'largest' | 'most-active' | 'highest-conviction';

export interface PulseFilters {
  category: PulseCategory;
  sort: PulseSort;
  search: string;
  minSize: number;
}
