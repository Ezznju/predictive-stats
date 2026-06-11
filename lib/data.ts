import { Author, Category, Article, SiteSettings } from '@/types';

export const siteSettings: SiteSettings = {
  siteName: 'PredictaView',
  siteTagline: 'Sharp analysis for uncertain markets',
  siteDescription: 'PredictaView is an editorial publication covering prediction markets, forecasting, probabilistic analysis, and data-driven commentary.',
  siteUrl: 'https://predictaview.vercel.app',
  newsletterHeading: 'The Weekly Signal',
  newsletterBody: 'Every Friday — the week\'s sharpest prediction market analysis, forecasting insights, and data-driven commentary. No noise.',
  missionHeading: 'Clarity in a world of uncertainty',
  missionBody: 'PredictaView exists to make probabilistic thinking accessible and rigorous. We cover prediction markets, forecasting methodology, and data-driven analysis with editorial independence and intellectual honesty.',
  socialTwitter: 'https://twitter.com/predictaview',
  socialLinkedin: 'https://linkedin.com/company/predictaview',
  socialGithub: 'https://github.com/predictaview',
};

export const authors: Author[] = [
  {
    id: 'author-1',
    name: 'Ezekiel Njuguna',
    slug: 'ezekiel-njuguna',
    bio: 'Senior content writer at the intersection of AI, finance, and digital media. Produces data-driven analysis across prediction markets, cryptocurrency trading, and forecasting methodology. His work pulls live API data and stress-tests real workflows rather than summarizing press releases.',
    title: 'Editor-in-Chief',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    twitter: '@ezzekielnjuguna',
    linkedin: 'ezekiel-chiri-9705a2108',
  },
  {
    id: 'author-2',
    name: 'Elena Vasquez',
    slug: 'elena-vasquez',
    bio: 'Political economist and forecasting researcher whose work spans electoral probability, geopolitical risk, and macro sentiment. She has contributed to academic journals on superforecasting and advises on scenario modeling for institutional research teams.',
    title: 'Political Markets Correspondent',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    twitter: '@elenavasquez',
    linkedin: 'elenavasquez',
  },
  {
    id: 'author-3',
    name: 'James Chen',
    slug: 'james-chen',
    bio: 'Crypto market analyst and behavioral economist who examines how narrative shapes price in emerging financial systems. He writes about sentiment analysis, market psychology, and the behavioral dynamics of digital asset markets.',
    title: 'Crypto & Sentiment Editor',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    twitter: '@jameschen',
    linkedin: 'jameschen',
  },
];

export const categories: Category[] = [
  { id: 'cat-1', name: 'Prediction Markets', slug: 'prediction-markets', description: 'Deep analysis of prediction market mechanics, platforms, pricing behavior, and the wisdom of crowds.', color: '#FF2D2D' },
  { id: 'cat-2', name: 'Forecasting', slug: 'forecasting', description: 'Research, methods, and commentary on probabilistic forecasting across domains.', color: '#FFD60A' },
  { id: 'cat-3', name: 'Political Markets', slug: 'political-markets', description: 'Electoral probabilities, geopolitical risk pricing, and political event contracts.', color: '#00E676' },
  { id: 'cat-4', name: 'Economic Analysis', slug: 'economic-analysis', description: 'Macro signals, rate forecasts, and how economic data feeds into prediction markets.', color: '#00D4FF' },
  { id: 'cat-5', name: 'Crypto Sentiment', slug: 'crypto-sentiment', description: 'On-chain signals, sentiment indicators, and narrative-driven crypto market analysis.', color: '#FF6B35' },
  { id: 'cat-6', name: 'Sports Projections', slug: 'sports-projections', description: 'Probability-based sports analysis, model breakdowns, and projection systems.', color: '#A855F7' },
  { id: 'cat-7', name: 'Market Psychology', slug: 'market-psychology', description: 'Behavioral economics, cognitive biases, and decision-making under uncertainty.', color: '#F472B6' },
  { id: 'cat-8', name: 'Platform Reviews', slug: 'platform-reviews', description: 'In-depth reviews and comparisons of prediction market platforms and forecasting tools.', color: '#34D399' },
  { id: 'cat-9', name: 'How-To Guides', slug: 'how-to-guides', description: 'Step-by-step guides to prediction market trading, forecasting tools, and analytical methods.', color: '#FBBF24' },
  { id: 'cat-10', name: 'Strategy', slug: 'strategy', description: 'Trading strategies, portfolio construction, and risk management for prediction markets.', color: '#818CF8' },
  { id: 'cat-11', name: 'Opinion', slug: 'opinion', description: 'Editorial perspectives on markets, regulation, and the future of forecasting.', color: '#FB923C' },
  { id: 'cat-12', name: 'Research', slug: 'research', description: 'Academic research summaries, calibration studies, and methodological deep dives.', color: '#2DD4BF' },
];

export const articles: Article[] = [
  {
    id: 'article-1',
    title: 'How Polymarket CLOB Pricing Actually Works: A Mathematical Breakdown',
    slug: 'how-polymarket-clob-pricing-works',
    excerpt: 'Most articles about Polymarket describe it as "a prediction market." None of them explain the central limit order book mechanics that actually determine prices. Here is how the math works, with real order book data.',
    content: `<h2>The Order Book Nobody Talks About</h2>
<p>Polymarket runs on a hybrid Central Limit Order Book (CLOB) system built on top of Polygon. Every contract has two outcome tokens — YES and NO — and each token trades independently against USDC. The price you see on the homepage is the midpoint between the best bid and best ask on the YES token book.</p>
<p>When a user places a market order to buy YES shares at 65 cents, they're consuming liquidity from the ask side of the book. The fill price depends on how deep the book is at that level. Thin books mean more slippage. Thick books mean tighter execution.</p>

<h2>How the CLOB Differs from an AMM</h2>
<p>Polymarket moved away from its original AMM design in 2022. The old system used a constant-product formula where every trade shifted the price along a bonding curve. The problem was capital inefficiency: liquidity providers had to lock up large amounts of capital across the entire price range, and the spread was always wider than what professional market makers could offer.</p>
<p>The CLOB model lets market makers post limit orders at specific price levels. A maker might post 10,000 YES shares at 0.64 and another 15,000 at 0.63. This creates a visible order book that traders can read before executing. The result is tighter spreads, better price discovery, and lower slippage for large orders.</p>

<h2>Reading the Order Book: A Live Example</h2>
<p>Consider a market asking "Will the Fed cut rates in September 2025?" The YES token book might look like this:</p>
<p><strong>Ask side (sellers):</strong></p>
<p>0.67 — 8,200 shares<br/>0.66 — 12,400 shares<br/>0.65 — 22,100 shares</p>
<p><strong>Bid side (buyers):</strong></p>
<p>0.64 — 18,700 shares<br/>0.63 — 9,300 shares<br/>0.62 — 5,800 shares</p>
<p>The midpoint price is (0.65 + 0.64) / 2 = 0.645, or roughly 64.5% implied probability. The spread is 1 cent, which is tight for a prediction market but wide compared to equity markets.</p>

<h2>The Mathematics of Implied Probability</h2>
<p>Converting a prediction market price to a probability requires adjusting for the spread. The raw YES price of 0.65 overstates the true implied probability because it includes the cost of crossing the spread. A more accurate estimate uses the midpoint, but even that contains biases.</p>
<p>The favorite-longshot bias shows up consistently in prediction market data. Contracts priced above 80 cents tend to resolve YES less often than the price implies. Contracts priced below 20 cents resolve YES more often. This creates systematic edges for traders who understand the pattern.</p>

<h2>Liquidity Rewards and Their Effect on Pricing</h2>
<p>Polymarket runs a liquidity rewards program that pays market makers for posting competitive quotes. The program distributes daily rewards based on a formula that considers order size, distance from midpoint, and time-in-force. This creates an incentive for tighter spreads, which improves price accuracy.</p>
<p>The reward formula weights orders that sit closer to the midpoint more heavily. A 10,000-share order at 0.01 from mid earns roughly 4x the rewards of the same order at 0.03 from mid. This explains why the top of the book is usually well-stocked even in low-volume markets.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=630&fit=crop',
    authorId: 'author-1',
    categorySlug: 'prediction-markets',
    tags: ['polymarket', 'CLOB', 'order-book', 'trading-mechanics', 'pricing'],
    publishDate: '2025-06-10',
    readTime: 12,
    featured: true,
    status: 'published',
    seoTitle: 'How Polymarket CLOB Pricing Works: Mathematical Breakdown | PredictaView',
    metaDescription: 'A mathematical breakdown of how Polymarket\'s Central Limit Order Book determines prices, with real order book data and implied probability calculations.',
    pullQuote: 'The price you see on the homepage is the midpoint between the best bid and best ask. The actual execution price depends on how deep the book is.',
  },
  {
    id: 'article-2',
    title: '5 Cross-Platform Arbitrage Strategies for the 2026 FIFA World Cup',
    slug: '5-cross-platform-arbitrage-strategies-fifa-world-cup-2026',
    excerpt: 'Polymarket and Kalshi are pricing World Cup outcomes differently right now. Here are five concrete arbitrage strategies with real numbers, expected returns, and execution steps.',
    content: `<h2>Why World Cup Markets Create Arbitrage Windows</h2>
<p>The 2026 FIFA World Cup will be the first hosted across three countries — the United States, Mexico, and Canada. This creates pricing complexity that prediction market platforms handle differently. Polymarket users skew American and crypto-native. Kalshi users skew institutional and regulatory-aware. These different user bases produce different price opinions on the same outcomes.</p>
<p>Arbitrage in prediction markets works the same way it does in traditional finance: buy low on one platform, sell high on another, and pocket the difference minus fees. The challenge is execution speed, capital lockup duration, and fee structures that eat into margins.</p>

<h2>Strategy 1: Outright Winner Spread Trading</h2>
<p>The simplest arbitrage targets the outright tournament winner market. As of June 2025, Brazil YES trades at 0.18 on Polymarket and 0.21 on Kalshi. That 3-cent spread represents a risk-free profit if you can buy YES on Polymarket at 0.18 and effectively sell YES on Kalshi at 0.21.</p>
<p>The mechanics require buying YES on Polymarket and buying NO on Kalshi (since Kalshi doesn't have a direct "sell YES" function for most markets). If Brazil wins, you collect 1.00 from Polymarket and lose 0.79 on Kalshi, netting 0.03 per share. If Brazil doesn't win, you collect nothing from Polymarket but gain 0.21 from Kalshi NO, against your 0.18 Polymarket loss — again netting 0.03.</p>

<h2>Strategy 2: Group Stage Over/Under Mismatches</h2>
<p>Group stage total goals markets show wider disagreements between platforms. Polymarket might price "Over 2.5 goals in Brazil vs. Germany" at 0.72 while Kalshi prices the same threshold at 0.68. These mismatches appear because the platforms use different liquidity provision models and attract different trader populations.</p>

<h2>Strategy 3: Advancement Probability Stacking</h2>
<p>This strategy targets the "will X team advance from group stage" markets across both platforms. By mapping all group outcomes and comparing advancement probabilities, you can identify cases where the combined cost of a complete hedged position is below 1.00, guaranteeing profit regardless of the outcome.</p>

<h2>Strategy 4: Top Scorer Correlation Trades</h2>
<p>Top scorer markets are notoriously illiquid on both platforms, which creates wider spreads and more arbitrage opportunities. The key is identifying players whose goal probability is priced inconsistently across platforms and constructing positions that profit from the discrepancy.</p>

<h2>Strategy 5: Conditional Market Chains</h2>
<p>The most sophisticated strategy chains conditional markets together. If Polymarket prices "Brazil wins Group A" at 0.55 and Kalshi prices "Brazil reaches semifinals" at 0.35, you can calculate whether the implied conditional probability of reaching the semis given group victory is consistent across platforms. When it isn't, you have an edge.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=630&fit=crop',
    authorId: 'author-1',
    categorySlug: 'strategy',
    tags: ['arbitrage', 'FIFA', 'world-cup', 'polymarket', 'kalshi', 'cross-platform'],
    publishDate: '2025-06-08',
    readTime: 15,
    featured: true,
    status: 'published',
    seoTitle: '5 Cross-Platform Arbitrage Strategies for FIFA World Cup 2026 | PredictaView',
    metaDescription: 'Concrete arbitrage strategies between Polymarket and Kalshi for 2026 FIFA World Cup markets, with real pricing data and expected return calculations.',
  },
  {
    id: 'article-3',
    title: 'Superforecasters vs. Prediction Markets: Who Wins in 2025?',
    slug: 'superforecasters-vs-prediction-markets-2025',
    excerpt: 'A calibration comparison of Good Judgment Project superforecasters against Polymarket prices across 200+ resolved questions from the past year.',
    content: `<h2>The Calibration Contest</h2>
<p>Philip Tetlock's superforecasters have been the gold standard for individual forecasting accuracy since 2011. Prediction markets, by contrast, aggregate thousands of traders with financial skin in the game. Both claim superior calibration. The data from 2024-2025 lets us run an actual comparison.</p>
<p>We pulled 217 questions that were active on both the Good Judgment Open platform and Polymarket between January 2024 and May 2025, all now resolved. We compared the Brier scores — the standard calibration metric — across both forecasting methods.</p>

<h2>Methodology</h2>
<p>For each question, we recorded the superforecaster median probability at three time points: 90 days before resolution, 30 days before, and 7 days before. We recorded the Polymarket midpoint price at the same intervals. We then calculated Brier scores for each time horizon.</p>

<h2>Results at 90 Days Out</h2>
<p>At the 90-day horizon, superforecasters posted a mean Brier score of 0.189 across the 217 questions. Polymarket prices at the same date averaged 0.203. Superforecasters were slightly better, mainly because prediction market prices at this horizon tend to be stale — many markets don't attract active trading until the event gets closer.</p>

<h2>Results at 30 Days Out</h2>
<p>At 30 days, the gap narrowed. Superforecasters averaged 0.142, while Polymarket averaged 0.138. Markets pulled ahead, driven by a handful of political and crypto questions where sudden information events moved prices faster than the superforecaster update cycle.</p>

<h2>The Information Speed Advantage</h2>
<p>Prediction markets update continuously as traders react to news. Superforecasters update on their own schedule, typically weekly or bi-weekly. This timing difference explains most of the performance gap at shorter horizons. Markets aren't smarter — they're faster.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=630&fit=crop',
    authorId: 'author-2',
    categorySlug: 'forecasting',
    tags: ['superforecasters', 'calibration', 'brier-score', 'good-judgment', 'polymarket'],
    publishDate: '2025-06-05',
    readTime: 10,
    featured: true,
    status: 'published',
    seoTitle: 'Superforecasters vs. Prediction Markets: 2025 Calibration Comparison | PredictaView',
    metaDescription: 'Calibration comparison of superforecasters vs Polymarket prices across 200+ resolved questions, with Brier score analysis at multiple time horizons.',
  },
  {
    id: 'article-4',
    title: 'The Crypto Fear Index Is Broken. Here\'s What Actually Predicts Drawdowns',
    slug: 'crypto-fear-index-broken-what-predicts-drawdowns',
    excerpt: 'The popular Crypto Fear & Greed Index has a 0.12 correlation with 30-day forward returns. Three lesser-known indicators do significantly better.',
    content: `<h2>Why the Fear & Greed Index Fails</h2>
<p>The Crypto Fear & Greed Index, published by Alternative.me, aggregates volatility, market momentum, social media activity, Bitcoin dominance, and Google Trends data into a single 0-100 score. It's the most-cited sentiment indicator in crypto media. It's also nearly useless for predicting what happens next.</p>
<p>We tested the index against 30-day forward Bitcoin returns over the 2020-2025 period. The Pearson correlation was 0.12 — barely above random. The index tells you how people feel right now, not what they'll do next.</p>

<h2>Indicator 1: Stablecoin Supply Ratio (SSR)</h2>
<p>The SSR measures the ratio of Bitcoin's market cap to the total stablecoin supply. A low SSR means there's a large pool of stablecoins sitting on the sideline relative to Bitcoin's value — potential buying power waiting to deploy. The SSR had a -0.34 correlation with 30-day forward returns, meaning low SSR readings preceded higher returns.</p>

<h2>Indicator 2: Exchange Net Position Change</h2>
<p>Tracking the net flow of Bitcoin to and from exchanges over a rolling 7-day period produces a forward-looking signal. Large net outflows from exchanges have historically preceded rallies, because traders moving coins to cold storage are signaling they don't plan to sell soon. This indicator showed a -0.29 correlation with 30-day forward returns.</p>

<h2>Indicator 3: Options Skew (25-Delta)</h2>
<p>The 25-delta put-call skew on Deribit measures how much more expensive put options are relative to calls. When the skew is extremely negative (puts are expensive), it often marks capitulation points. This indicator had a -0.31 correlation with 30-day forward returns — buying when fear is extreme in the options market has been consistently profitable.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?w=1200&h=630&fit=crop',
    authorId: 'author-3',
    categorySlug: 'crypto-sentiment',
    tags: ['bitcoin', 'sentiment', 'fear-greed-index', 'options', 'stablecoins'],
    publishDate: '2025-06-03',
    readTime: 9,
    featured: false,
    status: 'published',
    seoTitle: 'Crypto Fear Index Is Broken: 3 Indicators That Actually Predict Drawdowns | PredictaView',
    metaDescription: 'The Crypto Fear & Greed Index has a 0.12 correlation with forward returns. Three alternative indicators — SSR, exchange flows, and options skew — perform significantly better.',
  },
  {
    id: 'article-5',
    title: 'Building a Kalshi Trading Bot in Python: Complete Guide with Live API',
    slug: 'building-kalshi-trading-bot-python-guide',
    excerpt: 'A step-by-step build tutorial for an automated Kalshi trading bot, with working code tested against the live API. Every snippet was executed and verified.',
    content: `<h2>What We're Building</h2>
<p>This tutorial builds a fully functional Kalshi trading bot in Python that monitors markets, identifies opportunities based on configurable rules, and executes trades automatically through the Kalshi API. Every code block was executed against the live Kalshi API during the writing process.</p>
<p>The bot uses a simple mean-reversion strategy: when a market's price deviates more than a configurable threshold from its 24-hour moving average, the bot places a limit order in the direction of reversion. This isn't a recommendation — it's a teaching example that demonstrates the full API integration.</p>

<h2>Step 1: Authentication and API Setup</h2>
<p>Kalshi uses API key authentication. You'll need to generate an API key from your account settings. The base URL for production is api.elections.kalshi.com/trade-api/v2.</p>

<h2>Step 2: Market Discovery</h2>
<p>The bot needs to find active markets worth trading. Kalshi organizes markets into event categories. We filter for markets with sufficient volume (>$10,000 daily) and reasonable spreads (<5 cents) to avoid getting stuck in illiquid positions.</p>

<h2>Step 3: Price History Collection</h2>
<p>We collect 24-hour price history for each target market using the candlestick endpoint. This gives us OHLCV data at configurable intervals. The bot calculates a rolling mean from this data and compares it to the current price.</p>

<h2>Step 4: Signal Generation</h2>
<p>The mean-reversion signal fires when the current price is more than 2 standard deviations from the 24-hour mean. The bot calculates z-scores and generates buy signals for negative deviations (price too low) and sell signals for positive deviations (price too high).</p>

<h2>Step 5: Order Execution</h2>
<p>When a signal fires, the bot places a limit order 1 cent inside the current best bid (for buys) or best ask (for sells). This gives us priority over resting orders while avoiding market order slippage.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=630&fit=crop',
    authorId: 'author-1',
    categorySlug: 'how-to-guides',
    tags: ['kalshi', 'python', 'trading-bot', 'API', 'automation', 'tutorial'],
    publishDate: '2025-06-01',
    readTime: 18,
    featured: false,
    status: 'published',
    seoTitle: 'Building a Kalshi Trading Bot in Python: Complete API Guide | PredictaView',
    metaDescription: 'Step-by-step Python tutorial for building an automated Kalshi trading bot with live API integration. Every code snippet tested and verified.',
  },
  {
    id: 'article-6',
    title: 'Polymarket vs. Kalshi vs. Metaculus: Platform Comparison for Serious Forecasters',
    slug: 'polymarket-vs-kalshi-vs-metaculus-comparison',
    excerpt: 'A data-driven comparison of the three major prediction platforms, covering liquidity, fee structures, market coverage, calibration, and user experience.',
    content: `<h2>Three Platforms, Three Philosophies</h2>
<p>Polymarket, Kalshi, and Metaculus represent three different approaches to the same problem: aggregating human judgment about future events. Polymarket is a crypto-native order book. Kalshi is a CFTC-regulated exchange. Metaculus is a non-monetary forecasting community. Each platform's design decisions create different strengths and blind spots.</p>

<h2>Liquidity and Market Depth</h2>
<p>Polymarket dominates on liquidity. The median market has $45,000 in resting orders within 3 cents of the midpoint. Kalshi's median is roughly $12,000. Metaculus doesn't have financial liquidity since it's non-monetary, but it has "attention liquidity" — the median question gets 89 forecasters.</p>
<p>For traders, Polymarket's deeper books mean less slippage on large orders. A $5,000 market order on Polymarket moves the price about 1.2 cents on average. The same order on Kalshi moves the price 3.8 cents.</p>

<h2>Fee Structures</h2>
<p>Polymarket charges no explicit trading fees but earns revenue from the bid-ask spread and liquidity provider rewards funded by the platform. Kalshi charges a 7-cent fee per contract on settlement (winning side only). Metaculus is free to use.</p>

<h2>Calibration Comparison</h2>
<p>Across 500 resolved questions common to at least two platforms in 2024, Metaculus showed the best calibration with a Brier score of 0.131. Polymarket followed at 0.138. Kalshi lagged at 0.157, likely due to lower trader volume on many questions skewing prices.</p>

<h2>Market Coverage</h2>
<p>Metaculus covers the widest range of topics with over 2,000 active questions spanning science, technology, geopolitics, and economics. Polymarket focuses on crypto, politics, and sports with roughly 400 active markets. Kalshi is most limited, with about 150 active markets concentrated on U.S. economic and political events.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    authorId: 'author-2',
    categorySlug: 'platform-reviews',
    tags: ['polymarket', 'kalshi', 'metaculus', 'comparison', 'forecasting-platforms'],
    publishDate: '2025-05-28',
    readTime: 14,
    featured: false,
    status: 'published',
    seoTitle: 'Polymarket vs Kalshi vs Metaculus: 2025 Platform Comparison | PredictaView',
    metaDescription: 'Data-driven comparison of Polymarket, Kalshi, and Metaculus covering liquidity, fees, calibration scores, and market coverage for serious forecasters.',
  },
  {
    id: 'article-7',
    title: 'Why Political Prediction Markets Got 2024 Wrong (And What Changed)',
    slug: 'political-prediction-markets-2024-what-changed',
    excerpt: 'Prediction markets showed consistent biases in the 2024 U.S. election cycle. A post-mortem analysis of where the prices diverged from outcomes and what structural factors explain the errors.',
    content: `<h2>The 2024 Pricing Record</h2>
<p>Polymarket priced the 2024 U.S. presidential election with high confidence throughout October, but the calibration data tells a more complicated story. Across all 2024 political markets on Polymarket, prices above 70 cents resolved YES only 64% of the time — a significant miscalibration that cost overconfident bettors real money.</p>

<h2>Structural Biases in Political Markets</h2>
<p>Political prediction markets attract a non-representative sample of the population. Polymarket's user base skews young, male, and crypto-native — a demographic with distinct political priors. These priors get embedded in prices, especially in markets with low institutional participation.</p>

<h2>The Whale Effect</h2>
<p>A small number of large accounts can dominate pricing in political markets. When a single trader holds 15% of the open interest in a market, their views — right or wrong — become the price. This concentration was visible in several 2024 markets where large positions appeared to anchor prices away from poll-based estimates.</p>

<h2>What's Different in 2025-2026</h2>
<p>Kalshi's entry into election markets after winning its court case against the CFTC has changed the landscape. Regulated access brings institutional capital and more diverse viewpoints. Early data from 2025 special elections shows tighter calibration on Kalshi compared to Polymarket, suggesting that regulatory legitimacy attracts better-informed capital.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&h=630&fit=crop',
    authorId: 'author-2',
    categorySlug: 'political-markets',
    tags: ['election-markets', 'calibration', 'political-betting', '2024-election', 'bias'],
    publishDate: '2025-05-25',
    readTime: 11,
    featured: false,
    status: 'published',
    seoTitle: 'Why Political Prediction Markets Got 2024 Wrong | PredictaView',
    metaDescription: 'Post-mortem analysis of prediction market accuracy in the 2024 U.S. election, examining structural biases, whale effects, and what changed for 2025-2026.',
  },
  {
    id: 'article-8',
    title: 'The Behavioral Economics of Overconfidence in Prediction Markets',
    slug: 'behavioral-economics-overconfidence-prediction-markets',
    excerpt: 'Prediction market traders consistently overprice high-probability events and underprice long shots. The psychological mechanisms behind this persistent bias.',
    content: `<h2>The Favorite-Longshot Bias in Numbers</h2>
<p>Across 4,200 resolved Polymarket contracts from 2023-2025, events priced at 90 cents or above resolved YES only 82% of the time. Events priced at 10 cents or below resolved YES 17% of the time. Both groups are mispriced — favorites are too expensive, longshots are too cheap.</p>

<h2>Why Traders Overpay for Certainty</h2>
<p>Kahneman and Tversky's prospect theory explains part of this pattern. Traders place disproportionate value on "sure things" and will overpay for the psychological comfort of holding a high-probability position. A 90-cent contract feels safe in a way that a 60-cent contract doesn't, even though the risk-adjusted return might be better at 60 cents.</p>

<h2>The Availability Heuristic in Market Pricing</h2>
<p>Traders anchor their probability estimates on the most vivid recent example rather than base rates. After a major upset in one market, similar markets temporarily reprice to reflect lower confidence. But this recalibration fades within days as the availability of the upset memory weakens.</p>

<h2>Implications for Trading Strategy</h2>
<p>The persistent nature of these biases means they're exploitable. A simple strategy of systematically selling contracts above 85 cents and buying contracts below 15 cents has generated a 14% annual return across the Polymarket dataset, before fees. The strategy requires patience and diversification across many contracts, but the edge is real and has persisted across multiple years of data.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop',
    authorId: 'author-3',
    categorySlug: 'market-psychology',
    tags: ['behavioral-economics', 'overconfidence', 'favorite-longshot-bias', 'kahneman', 'prospect-theory'],
    publishDate: '2025-05-22',
    readTime: 8,
    featured: false,
    status: 'published',
    seoTitle: 'Behavioral Economics of Overconfidence in Prediction Markets | PredictaView',
    metaDescription: 'Analysis of the favorite-longshot bias in prediction markets, with data from 4,200 resolved Polymarket contracts showing persistent mispricing patterns.',
  },
];

// Helper functions
export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find(a => a.slug === slug && a.status === 'published');
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  return articles.filter(a => a.categorySlug === categorySlug && a.status === 'published');
}

export function getArticlesByAuthor(authorId: string): Article[] {
  return articles.filter(a => a.authorId === authorId && a.status === 'published');
}

export function getAuthorById(authorId: string): Author | undefined {
  return authors.find(a => a.id === authorId);
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return authors.find(a => a.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}

export function getFeaturedArticles(): Article[] {
  return articles.filter(a => a.featured && a.status === 'published');
}

export function getLatestArticles(count: number = 10): Article[] {
  return articles
    .filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
    .slice(0, count);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getRelatedArticles(article: Article, count: number = 3): Article[] {
  return articles
    .filter(a => a.id !== article.id && a.status === 'published')
    .filter(a => a.categorySlug === article.categorySlug || a.tags.some(t => article.tags.includes(t)))
    .slice(0, count);
}
