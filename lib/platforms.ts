/**
 * Platform review & comparison data — the single source of truth for the
 * /platforms hub, /platforms/[slug] review pages, and /go/[slug] outbound links.
 *
 * Affiliate links are NOT stored here. The /go/[slug] redirect route checks
 * the env var AFFILIATE_URL_{SLUG} (e.g. AFFILIATE_URL_POLYMARKET) and falls
 * back to `websiteUrl`. To activate an affiliate program later, just set the
 * env var in Vercel — no code change needed.
 */

export interface PlatformRatings {
  liquidity: number;
  fees: number;
  marketVariety: number;
  ux: number;
  trust: number;
}

export interface Platform {
  slug: string;
  name: string;
  tagline: string;
  type: 'Crypto exchange' | 'Regulated US exchange' | 'Play-money market' | 'Forecasting platform';
  websiteUrl: string;
  brandColor: string;
  founded: number;
  overallRating: number; // 0–5, one decimal
  ratings: PlatformRatings;
  fees: string;
  minDeposit: string;
  payments: string;
  regions: string;
  bestFor: string;
  pros: string[];
  cons: string[];
  verdict: string;
  review: { heading: string; body: string }[];
}

export const PLATFORMS: Platform[] = [
  {
    slug: 'polymarket',
    name: 'Polymarket',
    tagline: 'The deepest liquidity in prediction markets — zero trading fees, settled in USDC.',
    type: 'Crypto exchange',
    websiteUrl: 'https://polymarket.com',
    brandColor: '#4845F0',
    founded: 2020,
    overallRating: 4.7,
    ratings: { liquidity: 5, fees: 5, marketVariety: 4.5, ux: 4, trust: 4 },
    fees: 'No trading fees (network gas costs only)',
    minDeposit: 'No minimum (~$1 practical floor)',
    payments: 'USDC on Polygon; cards via on-ramp partners',
    regions: 'Most countries — check local availability before depositing',
    bestFor: 'Serious traders who want maximum depth and zero fees',
    pros: [
      'Deepest liquidity of any prediction market — billions in volume on major events',
      'Zero trading fees, so edges aren\u2019t eaten by commissions',
      'Huge market variety: politics, crypto, sports, pop culture, science',
      'On-chain settlement makes positions and resolution transparent',
    ],
    cons: [
      'Crypto-native onboarding (USDC + Polygon) adds friction for fiat-first users',
      'Availability varies by jurisdiction and has shifted over time',
      'Resolution disputes are rare but contentious when they happen',
      'No native tax documentation — you track your own P&L',
    ],
    verdict:
      'Polymarket is the benchmark real-money prediction market. If you can handle the crypto onboarding and it\u2019s available where you live, the combination of zero fees and unmatched liquidity is very hard to beat.',
    review: [
      {
        heading: 'Liquidity and pricing',
        body: 'Polymarket\u2019s headline markets routinely carry order books deep enough to move five-figure positions without meaningful slippage — something no other prediction market can claim. Prices on major political and macro events are widely cited as probability benchmarks by journalists and researchers, which tells you how seriously the market is taken. Long-tail markets are thinner, but the central limit order book still gives you transparent depth before you commit.',
      },
      {
        heading: 'Fees and costs',
        body: 'There are no trading fees and no withdrawal fees from Polymarket itself — your only costs are blockchain gas (negligible on Polygon) and whatever your on-ramp charges to convert fiat to USDC. For active traders this is the single biggest structural advantage over fee-charging competitors: a strategy that breaks even elsewhere can be profitable here.',
      },
      {
        heading: 'Usability',
        body: 'The web app is polished and fast, with embedded order books, charts, and comment threads per market. The main friction is the first deposit: you need USDC on Polygon, which means either a crypto exchange transfer or a card on-ramp. Once funded, trading feels like a modern exchange rather than a betting site.',
      },
      {
        heading: 'Trust and regulation',
        body: 'Polymarket settled with the CFTC in 2022 over registration issues and has since worked to bring its access into compliance, including moves toward regulated US market access. On-chain settlement means funds and positions are verifiable, but you should always confirm the platform\u2019s current status in your jurisdiction before depositing.',
      },
    ],
  },
  {
    slug: 'kalshi',
    name: 'Kalshi',
    tagline: 'The CFTC-regulated US event exchange — trade in dollars, fully above board.',
    type: 'Regulated US exchange',
    websiteUrl: 'https://kalshi.com',
    brandColor: '#2BD96E',
    founded: 2018,
    overallRating: 4.5,
    ratings: { liquidity: 4, fees: 4, marketVariety: 4, ux: 4.5, trust: 5 },
    fees: 'Trading fee per contract (~0.07 \u00d7 price \u00d7 (1 \u2212 price)); ACH deposits free',
    minDeposit: 'No minimum',
    payments: 'USD — bank transfer (ACH), debit card, wire',
    regions: 'United States (all 50 states); expanding internationally',
    bestFor: 'US traders who want a regulated, fiat-native experience',
    pros: [
      'CFTC-regulated designated contract market — the legal way to trade events in the US',
      'Native USD deposits and withdrawals, no crypto required',
      'Clean, beginner-friendly interface with limit and market orders',
      'Provides 1099 tax forms — taxes are dramatically simpler',
    ],
    cons: [
      'Trading fees eat into thin edges compared with Polymarket\u2019s zero-fee model',
      'Liquidity is solid on headline markets but thin on the long tail',
      'Market lineup constrained by what regulators approve',
    ],
    verdict:
      'Kalshi is the obvious choice for US-based traders: regulated, dollar-denominated, and easy to use. You pay for that comfort through trading fees and somewhat thinner books, but for most people the trade-off is worth it.',
    review: [
      {
        heading: 'Regulation first',
        body: 'Kalshi is a CFTC-designated contract market, which makes it the most clearly regulated way for Americans to trade event contracts. Funds sit in segregated accounts, disputes follow exchange rules, and you get real tax documentation. After winning its court fight over election markets in 2024, its lineup has expanded substantially — including economics, weather, politics, and sports-adjacent events.',
      },
      {
        heading: 'Fees and costs',
        body: 'Kalshi charges a trading fee that scales with how uncertain the contract is — roughly 0.07 \u00d7 price \u00d7 (1 \u2212 price) per contract, so a 50\u00a2 contract costs about 1.75\u00a2 in fees while contracts near 1\u00a2 or 99\u00a2 cost almost nothing. ACH deposits and withdrawals are free. It\u2019s fair pricing, but active traders should model fees into any strategy.',
      },
      {
        heading: 'Liquidity and markets',
        body: 'Headline markets (Fed decisions, CPI prints, elections) have respectable depth, helped by institutional market makers. Niche markets can be thin, with wider spreads than Polymarket equivalents. The flip side: Kalshi lists rigorous, well-defined contracts on economic data that few other venues touch.',
      },
      {
        heading: 'Usability',
        body: 'The onboarding flow feels like a modern brokerage: KYC, link a bank, fund in dollars, trade. The interface explains contracts in plain English, making it the easiest real-money platform for newcomers in our testing.',
      },
    ],
  },
  {
    slug: 'predictit',
    name: 'PredictIt',
    tagline: 'The veteran US political market — beloved community, painful fee structure.',
    type: 'Regulated US exchange',
    websiteUrl: 'https://www.predictit.org',
    brandColor: '#FF6B00',
    founded: 2014,
    overallRating: 3.6,
    ratings: { liquidity: 3, fees: 2, marketVariety: 3, ux: 3, trust: 4 },
    fees: '10% fee on profits + 5% withdrawal fee',
    minDeposit: 'No minimum; $850 cap per contract per question',
    payments: 'USD — card or bank transfer',
    regions: 'United States',
    bestFor: 'Political junkies who value the community over raw economics',
    pros: [
      'Longest track record of any US political market — operating since 2014',
      'Active comment-section community with genuine political insight',
      'Simple yes/no contract structure that\u2019s easy to understand',
      'Operates under academic no-action framework with real-money stakes',
    ],
    cons: [
      'Brutal fees: 10% on profits plus 5% to withdraw',
      '$850 position cap per contract limits serious bankrolls',
      'Politics-only lineup; dated interface',
      'Fee structure causes persistent mispricings vs other venues',
    ],
    verdict:
      'PredictIt survives on community and nostalgia more than economics. The 10%-plus-5% fee stack and $850 cap make it hard to recommend for profit-focused traders, but its political markets and comment threads remain genuinely fun.',
    review: [
      {
        heading: 'The fee problem',
        body: 'PredictIt keeps 10% of your winnings on each trade and another 5% of anything you withdraw. Combined, a strategy needs roughly a 12% edge just to break even — which is why PredictIt prices often diverge from Polymarket and Kalshi on identical events. Treat those divergences as a fee artifact, not free money: the cost of arbitraging them away is exactly what created them.',
      },
      {
        heading: 'Position caps',
        body: 'The $850-per-contract-per-question cap, a condition of its original academic no-action letter, keeps stakes small. It democratizes the market but also caps the incentive for sharp money to correct prices, so long-shot bias is more visible here than anywhere else.',
      },
      {
        heading: 'Community and longevity',
        body: 'What PredictIt does have is history and people. It has operated through multiple election cycles, survived a CFTC withdrawal attempt that was resolved in court, and maintains comment sections that are arguably the best free source of granular US political handicapping anywhere.',
      },
    ],
  },
  {
    slug: 'manifold',
    name: 'Manifold',
    tagline: 'Play-money markets anyone can create — the sandbox of the forecasting world.',
    type: 'Play-money market',
    websiteUrl: 'https://manifold.markets',
    brandColor: '#9D5CFF',
    founded: 2021,
    overallRating: 4.0,
    ratings: { liquidity: 3, fees: 5, marketVariety: 5, ux: 4.5, trust: 4 },
    fees: 'Free — play-money currency (mana)',
    minDeposit: 'None (free mana on signup)',
    payments: 'Optional mana purchases; no real-money payouts',
    regions: 'Worldwide',
    bestFor: 'Learning to trade, testing ideas, and markets on literally anything',
    pros: [
      'Completely free to play, available everywhere',
      'Anyone can create a market on anything in seconds',
      'Surprisingly well-calibrated forecasts despite play money',
      'Friendly, experimentation-driven community',
    ],
    cons: [
      'No real-money profits — mana stays in the ecosystem',
      'Market quality varies wildly since anyone can create (and resolve) them',
      'Creator-resolved markets carry inherent resolution risk',
    ],
    verdict:
      'Manifold is the best free on-ramp to prediction markets. You won\u2019t make real money, but you will learn how markets move, test strategies risk-free, and find markets on questions no regulated venue would ever list.',
    review: [
      {
        heading: 'User-created everything',
        body: 'Manifold\u2019s core innovation is letting any user spin up a market instantly — from \u201cWill this paper replicate?\u201d to deeply personal questions. The result is the widest question variety in the space, including niche science, AI, and community topics that real-money venues can\u2019t touch for regulatory or liquidity reasons.',
      },
      {
        heading: 'Does play money work?',
        body: 'Better than you\u2019d expect. Manifold\u2019s own calibration data shows its aggregate forecasts track outcomes reasonably well, because reputation and leaderboard incentives substitute for cash. Still, on questions where Manifold disagrees with Polymarket or Kalshi, trust the real-money price.',
      },
      {
        heading: 'Who it\u2019s for',
        body: 'Treat Manifold as a training ground and idea lab. It\u2019s the best place to practice sizing, learn how AMM pricing behaves, and prototype questions before they appear on real-money venues — all without risking a cent.',
      },
    ],
  },
  {
    slug: 'metaculus',
    name: 'Metaculus',
    tagline: 'Not a market — a rigorous forecasting platform with the best long-range questions.',
    type: 'Forecasting platform',
    websiteUrl: 'https://www.metaculus.com',
    brandColor: '#29C5F6',
    founded: 2015,
    overallRating: 4.2,
    ratings: { liquidity: 2.5, fees: 5, marketVariety: 4.5, ux: 4, trust: 5 },
    fees: 'Free; cash prizes in tournaments',
    minDeposit: 'None',
    payments: 'No deposits — tournament prize payouts only',
    regions: 'Worldwide',
    bestFor: 'Forecasters who care about accuracy, science, and long time horizons',
    pros: [
      'Rigorous question writing and resolution criteria',
      'Best-in-class long-range questions on AI, science, and geopolitics',
      'Track-record scoring builds a verifiable forecasting r\u00e9sum\u00e9',
      'Cash tournaments let strong forecasters earn without betting',
    ],
    cons: [
      'Not a market — you can\u2019t trade against prices or take positions',
      'Feedback loops are slow on long-horizon questions',
      'Community aggregate can be sticky and slow to update vs markets',
    ],
    verdict:
      'Metaculus is where you go to become a better forecaster rather than to trade. Its aggregated community predictions on AI and science are reference-grade, and tournaments offer real prize money for skill instead of capital.',
    review: [
      {
        heading: 'A different model',
        body: 'Metaculus aggregates probabilistic predictions from thousands of forecasters and scores them against outcomes — no order book, no positions. Its strength is question quality: resolution criteria are precise, horizons stretch years out, and topics like AI timelines get treatment no real-money market can sustain.',
      },
      {
        heading: 'Track records and tournaments',
        body: 'Every forecast you log builds a public track record under proper scoring rules — increasingly useful as a credential in research and policy circles. Sponsored tournaments pay real cash to top performers, making Metaculus the rare place where forecasting skill alone (not bankroll) earns money.',
      },
      {
        heading: 'How it complements markets',
        body: 'We treat Metaculus as a second opinion: when its community forecast diverges sharply from Polymarket or Kalshi prices, one side is usually missing something. For long-horizon questions where market liquidity dries up, Metaculus is often the only credible signal available.',
      },
    ],
  },
];

export function getPlatforms(): Platform[] {
  return PLATFORMS;
}

export function getPlatformBySlug(slug: string): Platform | undefined {
  return PLATFORMS.find((p) => p.slug === slug);
}

/** Resolve the outbound destination for a platform: affiliate URL if configured, else the plain website. Server-side only. */
export function getOutboundUrl(platform: Platform): { url: string; isAffiliate: boolean } {
  const envKey = `AFFILIATE_URL_${platform.slug.toUpperCase().replace(/-/g, '_')}`;
  const affiliateUrl = process.env[envKey];
  if (affiliateUrl && /^https?:\/\//.test(affiliateUrl)) {
    return { url: affiliateUrl, isAffiliate: true };
  }
  return { url: platform.websiteUrl, isAffiliate: false };
}
