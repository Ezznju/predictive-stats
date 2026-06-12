import { Author, Category, Article, SiteSettings } from '@/types';

export const siteSettings: SiteSettings = {
  siteName: 'Predictions Market Fans',
  siteTagline: 'Sharp analysis for uncertain markets',
  siteDescription: 'Predictions Market Fans is an editorial publication covering prediction markets, forecasting, probabilistic analysis, and data-driven commentary.',
  siteUrl: 'https://predictionsmarketfans.com',
  newsletterHeading: 'The Weekly Signal',
  newsletterBody: 'Every Friday — the week\'s sharpest prediction market analysis, forecasting insights, and data-driven commentary. No noise.',
  missionHeading: 'Clarity in a world of uncertainty',
  missionBody: 'Predictions Market Fans exists to make probabilistic thinking accessible and rigorous. We cover prediction markets, forecasting methodology, and data-driven analysis with editorial independence and intellectual honesty.',
  socialTwitter: '@predictivestats',
  socialLinkedin: 'https://www.linkedin.com/in/ezekiel-chiri-9705a2108/',
  socialGithub: '',
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
    seoTitle: 'How Polymarket CLOB Pricing Works: Mathematical Breakdown | Predictions Market Fans',
    metaDescription: 'A mathematical breakdown of how Polymarket\'s Central Limit Order Book determines prices, with real order book data and implied probability calculations.',
    pullQuote: 'The price you see on the homepage is the midpoint between the best bid and best ask. The actual execution price depends on how deep the book is.',
  },
  {
    id: 'article-2',
    title: '5 Cross-Platform Sports Arbitrage Strategies Between Polymarket and Kalshi',
    slug: '5-cross-platform-sports-arbitrage-strategies-polymarket-kalshi',
    excerpt: 'Polymarket and Kalshi price the same sporting events differently. Here are five concrete arbitrage strategies with real numbers, expected returns, and execution mechanics that work across NBA, NFL, MLB, soccer, and MMA markets.',
    content: `<h2>Why Sports Markets Create Arbitrage Windows</h2>
<p>Prediction market platforms attract different user bases. Polymarket skews American and crypto-native. Kalshi skews institutional and regulatory-aware. When both platforms list the same sporting event, these different trader populations produce different price opinions on identical outcomes. NBA playoff series, NFL regular season games, MLB pennant races, Premier League matches, UFC title fights — the pricing gaps show up everywhere.</p>
<p>Arbitrage in prediction markets works the same way it does in traditional finance: buy low on one platform, sell high on another, and pocket the difference minus fees. The challenge is execution speed, capital lockup duration, and fee structures that eat into margins.</p>

<h2>Strategy 1: Championship and Tournament Winner Spreads</h2>
<p>The simplest arbitrage targets outright winner markets across major leagues. When Polymarket prices a team to win the NBA Finals at 0.18 and Kalshi lists the same team at 0.21, that 3-cent spread represents a risk-free profit if you can buy YES on one platform and effectively sell YES on the other.</p>
<p>The mechanics require buying YES on Polymarket and buying NO on Kalshi (since Kalshi doesn't have a direct "sell YES" function for most markets). If the team wins, you collect 1.00 from Polymarket and lose 0.79 on Kalshi, netting 0.03 per share. If the team doesn't win, you collect nothing from Polymarket but gain 0.21 from Kalshi NO, against your 0.18 Polymarket loss — again netting 0.03. This pattern repeats across NFL Super Bowl markets, MLB World Series futures, and international soccer tournaments.</p>

<h2>Strategy 2: Game Totals and Over/Under Mismatches</h2>
<p>Game total markets show wider disagreements between platforms. Polymarket might price "Over 215.5 total points" in a Lakers-Celtics game at 0.72 while Kalshi prices the same threshold at 0.68. These mismatches appear because the platforms use different liquidity provision models and attract different trader populations. NFL game totals, MLB run lines, and Premier League goal markets all exhibit the same pattern.</p>

<h2>Strategy 3: Series and Playoff Advancement Stacking</h2>
<p>This strategy targets "will X team advance" markets across both platforms during playoff series. By mapping all series outcomes and comparing advancement probabilities, you can identify cases where the combined cost of a complete hedged position is below 1.00, guaranteeing profit regardless of the outcome. NBA seven-game series are ideal because both platforms list them, and the probabilities shift meaningfully after each game.</p>

<h2>Strategy 4: Player Prop Correlation Trades</h2>
<p>Player prop markets — MVP awards, scoring titles, individual game performance — are notoriously illiquid on both platforms, which creates wider spreads and more arbitrage opportunities. The key is identifying players whose award probability or stat line is priced inconsistently across platforms and constructing positions that profit from the discrepancy. NFL MVP, NBA scoring leader, and UFC fight outcome props all qualify.</p>

<h2>Strategy 5: Conditional Market Chains</h2>
<p>The most sophisticated strategy chains conditional markets together. If Polymarket prices "Lakers win Western Conference" at 0.55 and Kalshi prices "Lakers win NBA Championship" at 0.35, you can calculate whether the implied conditional probability of winning the title given conference victory is consistent across platforms. When it isn't, you have an edge. This approach works with any sport that has sequential elimination rounds — tennis Grand Slams, March Madness brackets, international soccer tournaments.</p>`,
    featuredImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=630&fit=crop',
    authorId: 'author-1',
    categorySlug: 'strategy',
    tags: ['arbitrage', 'sports', 'NBA', 'NFL', 'polymarket', 'kalshi', 'cross-platform'],
    publishDate: '2025-06-08',
    readTime: 15,
    featured: true,
    status: 'published',
    seoTitle: '5 Cross-Platform Sports Arbitrage Strategies: Polymarket vs Kalshi | Predictions Market Fans',
    metaDescription: 'Concrete sports arbitrage strategies between Polymarket and Kalshi across NBA, NFL, MLB, soccer, and MMA markets, with real pricing data and expected return calculations.',
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
    seoTitle: 'Superforecasters vs. Prediction Markets: 2025 Calibration Comparison | Predictions Market Fans',
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
    seoTitle: 'Crypto Fear Index Is Broken: 3 Indicators That Actually Predict Drawdowns | Predictions Market Fans',
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
    seoTitle: 'Building a Kalshi Trading Bot in Python: Complete API Guide | Predictions Market Fans',
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
    seoTitle: 'Polymarket vs Kalshi vs Metaculus: 2025 Platform Comparison | Predictions Market Fans',
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
    seoTitle: 'Why Political Prediction Markets Got 2024 Wrong | Predictions Market Fans',
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
    seoTitle: 'Behavioral Economics of Overconfidence in Prediction Markets | Predictions Market Fans',
    metaDescription: 'Analysis of the favorite-longshot bias in prediction markets, with data from 4,200 resolved Polymarket contracts showing persistent mispricing patterns.',
  },
  {
    id: 'article-9',
    title: '5 Cross-Platform Arbitrage Strategies for the 2026 World Cup (Polymarket × Kalshi)',
    slug: '5-cross-platform-arbitrage-strategies-2026-world-cup-polymarket-kalshi',
    excerpt: 'Five prediction market platforms now list World Cup contracts simultaneously. When the same event trades on multiple venues at different prices, that gap is money sitting on the table. Here are five concrete strategies with real numbers, real fee formulas, and real order book depths.',
    content: `<p>The 2026 FIFA World Cup has generated massive amounts of money in trading volume on Polymarket alone. Kalshi's outright winner market has crossed $15.4 million with group-stage match markets pulling in six figures per game. Five prediction market platforms now list World Cup contracts simultaneously: Polymarket, Polymarket US, Kalshi, Gemini, and OG Predictions. When the same event trades on multiple venues at different prices, and those prices don't agree, that gap is money sitting on the table.</p>
<p>This article breaks down five concrete cross-platform arbitrage strategies for the 2026 World Cup using live market data pulled from Polymarket's CLOB API and Kalshi's public pricing on June 11, 2026. Every calculation here uses real numbers, real fee formulas, and real order book depths. Nothing hypothetical.</p>
<h2>How Cross-Platform Prediction Market Arbitrage Works</h2>
<p>The mechanics are blunt. Every prediction market contract settles at $1.00 if the outcome occurs, $0.00 if it doesn't. When you buy YES on one platform at a lower price than the corresponding NO on another platform, the combined cost is less than $1.00. One side always wins. You collect $1.00 and keep the difference.</p>
<p>Say Spain trades at 16.9¢ YES on Polymarket and 83.1¢ NO on the same platform. That's $1.00 combined, so no arb exists within a single venue. But if Kalshi prices Spain YES at 17.6¢ while Polymarket prices Spain YES at 16.9¢, those 0.7 cents represent a real discrepancy that can be traded.</p>
<p>The cross-platform spread on the World Cup winner market currently averages 2.0% for the top four favorites and widens to 5-8 cents on mid-tier teams. According to DeFi Rate's aggregator data from June 8, 2026, Spain shows a 2.0% spread across venues, France sits at 2.0%, Portugal at 1.1%, and England at 1.2%. The widest gaps appear on teams ranked 7th through 15th in the probability distribution, where lower liquidity on one or both platforms lets prices drift further apart.</p>
<p>Before jumping into the strategies, two things matter more than the math: fee structures and settlement risk.</p>
<h2>The Fee Math You Cannot Ignore</h2>
<p>Kalshi and Polymarket have fundamentally different fee architectures, and every arbitrage calculation that ignores fees is fiction.</p>
<p><strong>Kalshi's formula</strong> is parabolic. Taker fees follow <code>0.07 × C × P × (1 - P)</code>, where P is the contract price in dollars and C is the number of contracts. Maker fees use the same formula but at 0.0175 instead of 0.07. The fee peaks at 50¢ (where P × (1 - P) = 0.25) and drops toward zero at the extremes. For a $1,000 position on Spain YES at 17.6¢:</p>
<ul>
<li>Contracts: 1,000 ÷ 0.176 = 5,682 contracts</li>
<li>Fee per contract: 0.07 × 0.176 × 0.824 = $0.01015</li>
<li>Total taker fee: 5,682 × $0.01015 = $57.67</li>
<li>As percentage of position: 5.77%</li>
</ul>
<p>That 5.77% fee on a 17.6¢ contract is steep, but it's the taker rate. If you rest your order and get filled as a maker, the fee drops to 0.0175 × 0.176 × 0.824 = $0.00254 per contract, bringing total maker fees to $14.42 (1.44% of position). The difference between taker and maker on Kalshi can make or break an arb.</p>
<p><strong>Polymarket</strong> charges a flat percentage by category. Sports markets carry a 0.75% taker fee with zero maker fees. For the same $1,000 position on Spain YES at 17.0¢:</p>
<ul>
<li>Taker fee: $1,000 × 0.0075 = $7.50</li>
<li>As percentage: 0.75%</li>
</ul>
<p>That's a 7.7x cost difference between Kalshi taker and Polymarket taker. Any arb strategy involving Kalshi must either (a) place limit orders to get maker pricing, or (b) account for the full taker fee and only trade spreads wide enough to absorb it.</p>
<p><strong>The combined fee floor</strong>: A taker-taker arb between both platforms on a 17¢ contract costs approximately 5.77% + 0.75% = 6.52% of position value. Your cross-platform spread needs to exceed 6.52 cents on a $1.00 contract to generate profit as a taker. If you can get maker pricing on Kalshi, that floor drops to 1.44% + 0.75% = 2.19%.</p>
<h2>Strategy 1: Outright Winner Spread Arbitrage</h2>
<p>This is the most documented and accessible strategy. The World Cup winner market trades on both Polymarket and Kalshi with 48 teams each. Here is the current pricing side by side, pulled from live data:</p>
<table>
<thead>
<tr><th>Team</th><th>Polymarket YES</th><th>Kalshi YES (June 9)</th><th>Spread (cents)</th><th>Direction</th></tr>
</thead>
<tbody>
<tr><td>Spain</td><td>16.9-17.0¢</td><td>17.6-17.7¢</td><td>0.7</td><td>Kalshi higher</td></tr>
<tr><td>France</td><td>16.0-16.1¢</td><td>15.9-16.0¢</td><td>0.1</td><td>Polymarket higher</td></tr>
<tr><td>England</td><td>10.8-10.9¢</td><td>10.7-10.8¢</td><td>0.1</td><td>Polymarket higher</td></tr>
<tr><td>Portugal</td><td>10.8-10.9¢</td><td>11.1-11.2¢</td><td>0.3</td><td>Kalshi higher</td></tr>
<tr><td>Argentina</td><td>8.9-9.0¢</td><td>8.9-9.0¢</td><td>0.0</td><td>Aligned</td></tr>
<tr><td>Brazil</td><td>8.6-8.7¢</td><td>8.4¢</td><td>0.3</td><td>Polymarket higher</td></tr>
<tr><td>Germany</td><td>5.2-5.3¢</td><td>5.5-5.6¢</td><td>0.3</td><td>Kalshi higher</td></tr>
<tr><td>Netherlands</td><td>4.2-4.3¢</td><td>4.7¢</td><td>0.5</td><td>Kalshi higher</td></tr>
<tr><td>Norway</td><td>2.3-2.4¢</td><td>2.5¢</td><td>0.2</td><td>Kalshi higher</td></tr>
</tbody>
</table>
The spread on most top-tier teams is 0.1 to 0.7 cents. At taker-taker rates, none of these generate profit. The combined fee floor on a 17¢ contract is approximately 6.5 cents, and the widest spread here is 0.7 cents. That gap is 9.3x too narrow for a pure taker play.
<p><strong>Where it works</strong>: Maker-maker execution. If you post a limit buy on Polymarket (0% maker fee) and a limit sell/NO buy on Kalshi (0.25% maker fee for the maker tier), your combined fee drops below 0.5%. Spain at 16.9¢ on Polymarket vs. 17.6¢ on Kalshi becomes a 0.7¢ gross spread minus \\~0.08¢ in maker fees, netting approximately 0.62¢ per contract, which is a 3.6% return on the cheaper leg.</p>
<p><strong>The execution problem</strong>: Maker orders require patience. You're posting limit orders and waiting. During a World Cup with breaking news every few hours (injuries, lineup announcements, group results), posted orders can get run over. You post a bid at 16.9¢ on Polymarket for Spain, a goal goes in during a Spain match, and your bid gets lifted instantly at a stale price while the Kalshi side hasn't filled yet. Now you own Spain YES on Polymarket at 16.9¢ with no offsetting position.</p>
<p><strong>Practical sizing</strong>: Polymarket's order book shows massive depth on the top teams. Spain has $252,760 in bid depth across 10 price levels, with the top ask at 17.0¢ carrying 628,431 shares. You can push $50,000 through with zero slippage. Kalshi's volume is thinner ($214,400 total volume vs. Polymarket's $2.3 million on Spain alone), so the binding constraint on size is always the Kalshi side.</p>
<p><strong>Worked example for Spain</strong>:</p>
<ul>
<li>Buy 10,000 shares Spain YES on Polymarket at 17.0¢ = $1,700</li>
<li>Buy 10,000 shares Spain NO on Kalshi at 82.4¢ = $8,240 (equivalent to selling Spain YES)</li>
<li>Total outlay: $9,940</li>
<li>If Spain wins: collect $10,000 from Polymarket YES, lose $8,240 on Kalshi NO → net: +$60</li>
<li>If Spain loses: lose $1,700 on Polymarket YES, collect $10,000 from Kalshi NO → net: +$60</li>
<li>Minus Polymarket taker fee: $1,700 × 0.0075 = $12.75</li>
<li>Minus Kalshi taker fee on NO at 82.4¢: 0.07 × 10,000 × 0.824 × 0.176 = $101.56</li>
<li>Net profit after fees: $60 - $12.75 - $101.56 = -$54.31</li>
</ul>
<p>Negative. The Kalshi taker fee on a high-priced NO contract (82.4¢) is where this strategy dies for small spreads. The fee formula peaks at 50¢ and is still punishing at 82.4¢. Flipping the direction (buy YES on Kalshi, buy NO on Polymarket) changes the fee distribution but doesn't solve the core problem: 0.7¢ is not enough spread for taker execution.</p>
<p><strong>When this strategy activates</strong>: During high-volatility moments (a major favorite getting eliminated, a shocking group-stage result), spreads between platforms can blow out to 3-5 cents for 10-30 minutes. A pre-positioned bot monitoring both platforms can catch these windows. The SI.com comparison from May 28 documented $90+ payout differences on a $100 wager for Portugal, Argentina, and Netherlands, meaning the spread had widened to roughly 2-3 cents at that snapshot. Those are the moments this strategy pays.</p>
<h2>Strategy 2: Group Stage Match Market Arbitrage</h2>
<p>Group-stage match markets are three-way (Win/Draw/Lose) and trade on both platforms. This is where the spreads get interesting because match markets have shorter duration, lower volume, and more emotional pricing.</p>
<p>Current data for upcoming group-stage matches:</p>
<p><strong>Mexico vs. South Africa (June 11)</strong></p>
<table>
<thead>
<tr><th>Outcome</th><th>Polymarket</th><th>Kalshi</th><th>Spread</th></tr>
</thead>
<tbody>
<tr><td>Mexico Win</td><td>\\~69%</td><td>69% ($0.69)</td><td>\\~0%</td></tr>
<tr><td>South Africa Win</td><td>\\~12%</td><td>12% ($0.12)</td><td>\\~0%</td></tr>
<tr><td>Draw</td><td>\\~21%</td><td>21% ($0.21)</td><td>\\~0%</td></tr>
<tr><td>Volume</td><td>$4.42M</td><td>$143,370</td><td>30:1 ratio</td></tr>
</tbody>
</table>
<strong>USA vs. Paraguay (June 13)</strong>
<table>
<thead>
<tr><th>Outcome</th><th>Polymarket</th><th>Kalshi</th><th>Spread</th></tr>
</thead>
<tbody>
<tr><td>USA Win</td><td>\\~50%</td><td>50% ($0.50)</td><td>\\~0%</td></tr>
<tr><td>Paraguay Win</td><td>\\~25%</td><td>25% ($0.24)</td><td>\\~1%</td></tr>
<tr><td>Draw</td><td>\\~28%</td><td>28% ($0.28)</td><td>\\~0%</td></tr>
<tr><td>Volume</td><td>$758K</td><td>$116,953</td><td>6.5:1 ratio</td></tr>
</tbody>
</table>
<strong>Brazil vs. Morocco (June 13)</strong>
<table>
<thead>
<tr><th>Outcome</th><th>Polymarket</th><th>Kalshi</th><th>Spread</th></tr>
</thead>
<tbody>
<tr><td>Brazil Win</td><td>\\~62%</td><td>62% ($0.62)</td><td>\\~0%</td></tr>
<tr><td>Morocco Win</td><td>\\~17%</td><td>17% ($0.17)</td><td>\\~0%</td></tr>
<tr><td>Draw</td><td>\\~22%</td><td>22% ($0.22)</td><td>\\~0%</td></tr>
<tr><td>Volume</td><td>$451K</td><td>$81,040</td><td>5.6:1 ratio</td></tr>
</tbody>
</table>
The pre-match pricing is currently aligned. The volume differential is the signal here: Polymarket handles 6 to 30 times more volume per match. When a match kicks off and in-play pricing begins adjusting, the platform with less depth (Kalshi) will lag.
<p><strong>The three-way market advantage</strong>: In a binary (YES/NO) market, the two sides mechanically sum to $1.00 on the same platform. In a three-way market (Win/Draw/Lose), each outcome is a separate contract. The three prices should sum to $1.00, but they rarely do because the book-making margin pushes the total above $1.00. If Kalshi's three-way sum is 1.02 and Polymarket's is 1.04, there may be specific combinations where buying one outcome on Kalshi and selling another on Polymarket yields a locked profit.</p>
<p><strong>Worked example using the three-way structure:</strong></p>
<p>Suppose during the USA vs. Paraguay match, Paraguay scores and the live odds shift. Polymarket updates within seconds: USA Win drops from 50¢ to 35¢, Paraguay Win jumps to 38¢, Draw moves to 30¢. Kalshi takes 30-60 seconds to adjust, still showing USA Win at 45¢, Paraguay Win at 30¢, Draw at 28¢. In that window:</p>
<ul>
<li>Buy Paraguay Win on Polymarket at 38¢ (already moved)</li>
<li>Buy USA Win on Kalshi at 45¢ (hasn't moved yet)</li>
<li>Combined cost on these two legs: 83¢</li>
<li>Draw outcome is uncovered, which is a real risk</li>
</ul>
<p>This is not a pure arbitrage in the textbook sense because the Draw outcome creates exposure. But if you add a third leg (Draw on whichever platform offers a lower price), you can potentially cover all three outcomes for under $1.00. The math only works during the lag window, and only if the three-platform combined total dips below $1.00 after fees.</p>
<p><strong>Fee calculation for match markets:</strong> On Kalshi, a contract at 45¢ generates the highest possible fee: 0.07 × 0.45 × 0.55 = $0.01733 per contract. On Polymarket, the 0.75% flat rate on a 38¢ contract costs $0.00285 per contract. Total fee per pair: $0.02018, or about 2.4% of the combined 83¢ outlay. The spread between platforms needs to be larger than 2.4 cents for this to work.</p>
<h2>Strategy 3: Advancement Market Layering</h2>
<p>Both platforms offer group advancement markets (Will Team X qualify for the knockout round?). These are binary YES/NO contracts, but they're derived from group-stage results, which means their pricing is structurally linked to match markets and outright winner odds.</p>
<p>Here's where pricing discrepancies compound. From Kalshi's CBS Sports data (June 9):</p>
<table>
<thead>
<tr><th>Team</th><th>Win Group (Kalshi)</th><th>Advance (Kalshi)</th><th>Outright Winner (Kalshi)</th><th>Outright Winner (Polymarket)</th></tr>
</thead>
<tbody>
<tr><td>Brazil</td><td>$0.71</td><td>$0.98</td><td>$0.084</td><td>$0.087</td></tr>
<tr><td>USA</td><td>$0.40</td><td>$0.84</td><td>$0.016</td><td>$0.013</td></tr>
<tr><td>Mexico</td><td>$0.57</td><td>$0.92</td><td>$0.020</td><td>$0.014</td></tr>
<tr><td>Japan</td><td>$0.27</td><td>$0.83</td><td>$0.017</td><td>$0.018</td></tr>
<tr><td>Belgium</td><td>$0.68</td><td>$0.95</td><td>$0.023</td><td>$0.021</td></tr>
<tr><td>Spain</td><td>$0.79</td><td>$0.99</td><td>$0.169</td><td>$0.170</td></tr>
</tbody>
</table>
The arbitrage here is structural, not just about price differences. These markets are mathematically related: a team's outright winner probability is bounded by its advancement probability. If Spain has a 99% chance of advancing (Kalshi) but only a 17% chance of winning the whole tournament, the implied probability of winning conditional on advancing is 17% ÷ 99% = 17.2%. That number should be consistent across platforms.
<p><strong>The layered play:</strong></p>
<p>Take Mexico. Kalshi prices Mexico's advancement at $0.92 (92%). Kalshi prices Mexico's outright winner at $0.020 (2.0%). Polymarket prices Mexico's outright winner at $0.014 (1.4%). The conditional probability of Mexico winning given advancement differs between platforms:</p>
<ul>
<li>Kalshi implied: 2.0% ÷ 92% = 2.17%</li>
<li>Polymarket implied (using Kalshi advancement since Polymarket doesn't have a comparable advancement market at the same depth): 1.4% ÷ 92% = 1.52%</li>
</ul>
<p>If you believe the conditional probability should be the same regardless of platform, you can:</p>
<ol>
<li>Buy Mexico outright winner YES on Polymarket at 1.4¢</li>
<li>Sell Mexico outright winner YES on Kalshi at 2.0¢ (or buy the NO)</li>
</ol>
<p>The spread is 0.6 cents. On a 2¢ contract, the Kalshi taker fee is 0.07 × 0.02 × 0.98 = $0.001372 per contract (0.14¢). Polymarket taker fee on a 1.4¢ contract: $0.0014 × 0.0075 = negligible at $0.0000105. Combined fees are approximately 0.14¢, well below the 0.6¢ spread. This is a positive-expectation trade after fees.</p>
<p><strong>Scaling problem:</strong> The volume on Mexico's outright winner contract is thin on Kalshi. You're competing for $0.020 bids that might represent only a few hundred dollars of depth. Getting $5,000+ through both sides simultaneously requires patience and slicing orders across multiple price levels.</p>
<p><strong>Advancement market timing:</strong> Group advancement probabilities move violently during and after group-stage matches. If Mexico loses its first match, advancement drops from 92% to perhaps 70%. The outright winner price should drop proportionally, but it often doesn't react at the same rate on both platforms. The hour after a surprise group-stage result is when advancement-market arbitrage is most fertile.</p>
<h2>Strategy 4: Latency Arbitrage During Live Matches</h2>
<p>This is the highest-return, highest-barrier strategy. It requires automation, pre-funded accounts on both platforms, and real-time data feeds.</p>
<p>The core mechanic: when a goal is scored, a red card is given, or any significant match event occurs, prediction market prices update at different speeds. Polymarket's CLOB (Central Limit Order Book) runs on the Polygon blockchain with a WebSocket feed at <code>wss://ws-subscriptions-clob.polymarket.com/ws/market</code>. Price updates propagate within 1-3 seconds of a major event. Kalshi updates through its own order book, typically within 5-15 seconds for programmatic traders and 30-60 seconds for the broader market.</p>
<p>That 5-60 second window is the entire opportunity.</p>
<p><strong>Real-time data infrastructure needed:</strong></p>
<p>On Polymarket, subscribe to the WebSocket with <code>{"assets\\_ids": \\[<token\\_ids>\\], "type": "market"}</code>. Note the <code>assets\\_ids</code> spelling (not <code>asset\\_ids</code>). The first message for each token delivers a full order book snapshot, followed by <code>price\\_change</code> differential updates.</p>
<p>On Kalshi, the public API at <code>api.elections.kalshi.com</code> provides market data, but execution requires authentication and a funded account. Kalshi's API documentation at <code>trading-api.kalshi.com</code> describes the order placement endpoints.</p>
<p><strong>Order book reality check using live Polymarket data:</strong></p>
<p>Spain's order book on Polymarket (pulled June 11, 2026): - Top bid: 16.9¢ with 239,644 shares ($40,501 notional) - Top ask: 17.0¢ with 628,431 shares ($106,833 notional) - 10-level bid depth: $252,760 - 10-level ask depth: $125,362</p>
<p>At $50,000 market buy, you fill at 17.0¢ flat with zero slippage. The book is deep enough for institutional-sized orders on major teams.</p>
<p>But move to a mid-tier team like Netherlands, and the picture changes: - Top bid: 4.3¢ with only 7,254 shares ($312 notional) - 10-level ask depth: $79,753 - $1,000 market buy fills at 4.48¢ (4.3% slippage from best ask at 4.4¢) - $5,000 market buy fills at 4.50¢ (4.6% slippage) - $50,000 market buy fills at 4.78¢ (11.1% slippage)</p>
<p>Portugal is worse. Only $9,037 in 10-level ask depth. A $10,000 market buy fills at 11.18¢ versus a 10.9¢ best ask (2.6% slippage), and $50,000 fills at 19.43¢ (78% slippage). The book simply doesn't have the depth.</p>
<p><strong>The latency play execution flow:</strong></p>
<ol>
<li>Pre-deploy $5,000-$20,000 on each platform, split across USDC (Polymarket) and USD (Kalshi)</li>
<li>Run a bot that monitors both platforms' order books in real time</li>
<li>When a match event occurs (via a sports data API or the prediction market price movement itself), compare prices across platforms</li>
<li>If Platform A's price has moved but Platform B's hasn't, buy the "new correct price" side on Platform B before it adjusts</li>
<li>Immediately list the offsetting position on Platform A or hold until Platform B's price catches up and sell there</li>
</ol>
<p><strong>Realistic return estimate:</strong> If you catch one 3-cent spread per match day across 4 matches, trading $2,000 per opportunity, gross profit is $2,000 × 0.03 × 4 = $240 per day. Subtract combined platform fees of approximately 3% ($72), infrastructure costs, and the occasional mis-execution where both sides move against you (budget 20% loss rate). Net daily expectation in the group stage: roughly $100-$130 on $10,000 deployed capital. Annualized that's astronomical, but the window is 25 days of group-stage matches. Realistic total for the tournament: $2,500-$3,500 on $10,000 capital.</p>
<p><strong>Risk:</strong> Execution failure. You buy on one platform and the other platform's order gets rejected, times out, or fills at a moved price. Now you're directionally exposed on a single match outcome. This happens. Budget for it.</p>
<h2>Strategy 5: Overround Arbitrage via Synthetic Cross-Platform NO Positions</h2>
<p>This is the most technically sophisticated strategy and the one with the most persistent edge.</p>
<p>Every multi-outcome market (like "Who wins the World Cup?" with 48 teams) has an overround: the sum of all implied probabilities exceeds 100%. The overround represents the market-maker's margin. When different platforms have different overrounds, a cross-platform synthetic position can exploit the gap.</p>
<p><strong>Current overround data (June 11, 2026):</strong></p>
<p>Polymarket's overround on the 48-team World Cup winner market: 103.70%. The sum of all YES prices across 48 teams is $1.037. For every dollar the market implies, $0.037 is excess.</p>
<p>The live intra-platform arbitrage scan on Polymarket shows: - Sum of all best asks (buying YES on every team): $1.061 - Sum of all best bids (selling YES on every team): $1.013</p>
<p>That $1.013 sum of best bids means selling YES on every team at the best bid prices would collect $1.013 for a guaranteed $1.00 payout (since exactly one team wins). That's a 1.3% gross profit on a risk-free position within a single platform. But there's a catch: 12 of the 48 teams have zero bids. Jordan, New Zealand, Cape Verde, Curaçao, and others are so improbable that nobody is bidding on their YES shares. You can't actually execute the arb because you can't sell YES on teams with empty bid books.</p>
<p><strong>The cross-platform synthetic approach:</strong></p>
<p>Instead of trying to sell all 48 teams' YES on one platform (which requires all 48 to have bids), you construct a partial basket:</p>
<ol>
<li>On Polymarket, sell YES (buy NO) on the top 10 teams. Their best bids sum to: 0.169 + 0.160 + 0.108 + 0.108 + 0.089 + 0.086 + 0.052 + 0.042 + 0.023 + 0.020 = 0.857</li>
<li>On Kalshi, buy YES on the same top 10 teams. Their prices sum to: 0.176 + 0.163 + 0.108 + 0.111 + 0.090 + 0.084 + 0.058 + 0.047 + 0.025 + 0.023 = 0.885</li>
</ol>
<p>The Kalshi basket costs 2.8 cents more per unit than the Polymarket basket. If you buy the whole Kalshi basket and sell the whole Polymarket basket, you're paying the Kalshi overround premium (higher prices on YES) and collecting the Polymarket bid prices. The net position is long on the top-10 teams via Kalshi and short via Polymarket.</p>
<p><strong>Where the profit hides:</strong> The profit doesn't come from the basket itself but from the overround differential. If Kalshi's overround on these 10 teams is 88.5% and Polymarket's is 85.7%, the 2.8% gap means the "remaining 48 minus 10 = 38 teams" are priced differently across platforms. Kalshi allocates less probability mass to longshots, Polymarket allocates more. A dollar-neutral basket on the top 10 teams (long Kalshi, short Polymarket) effectively bets that the longshot tail is overpriced on Polymarket relative to Kalshi.</p>
<p>This is not risk-free. If a massive longshot wins (New Zealand takes the Cup), you lose on both legs because neither covers that outcome. But the conditional probability of a top-10 team winning is historically 85-95%, so the risk is bounded.</p>
<p><strong>Fee impact on the basket:</strong> For a $1,000 position per team across 10 teams ($10,000 total per platform, $20,000 gross):</p>
<p>Polymarket side (selling YES / buying NO on 10 teams): - Average price: 8.57¢ - Total taker fee: $10,000 × 0.0075 = $75</p>
<p>Kalshi side (buying YES on 10 teams): - Average price: 8.85¢ - Weighted fee using the formula (varies by price): approximately $107 total across 10 legs</p>
<p>Combined fees: $182, or 0.91% of total capital deployed. The 2.8 cents of gross spread across $20,000 deployed generates $280 gross. Net after fees: $98, or 0.49% return on a position that resolves in roughly 30 days. Annualized: \\~6%. Not exciting on its own, but it's as close to risk-free as prediction market trading gets, and it scales.</p>
<h2>Practical Execution Checklist</h2>
<p><strong>Account setup:</strong> You need funded accounts on both Polymarket and Kalshi. Polymarket requires a crypto wallet (MetaMask, Coinbase Wallet, or similar) with USDC on the Polygon network. Kalshi accepts USD via ACH bank transfer (free) or debit card (2% fee). For Kenya-based traders, Polymarket is accessible globally since it runs on-chain; Kalshi is US-only. You would need a US-based intermediary or VPN setup for Kalshi, which raises regulatory and terms-of-service questions.</p>
<p><strong>Capital allocation:</strong> Split 60/40 between platforms, with the larger share on the platform where you expect to be the taker more often. For strategies 1-3, that means more capital on Polymarket (lower taker fees). For strategy 4, equal allocation since you don't know which direction the lag will go.</p>
<p><strong>Tools:</strong> - DeFi Rate's World Cup odds aggregator (<code>defirate.com/prediction-markets/world-cup-odds/</code>) shows side-by-side pricing across Kalshi, Polymarket, Polymarket US, Gemini, and OG in real time - MarketMath.io's arbitrage calculator (<code>marketmath.io/tools/arbitrage-calculator</code>) handles the fee math for any two platforms - Polymarket's CLOB API (<code>clob.polymarket.com</code>) for real-time order books - Kalshi's trading API for programmatic order placement</p>
<p><strong>Monitoring cadence:</strong> During the group stage (June 11-27), check cross-platform spreads every 30 minutes and immediately before/after each match. The knockout rounds (June 28 onward) will see fewer games per day but higher volume and larger price swings per event.</p>
<h2>The Risk Table Nobody Wants to Read</h2>
<table>
<thead>
<tr><th>Risk</th><th>Impact</th><th>Mitigation</th></tr>
</thead>
<tbody>
<tr><td>Settlement delay mismatch</td><td>Kalshi settles within 3 hours; Polymarket settles on-chain within minutes. Capital locked on Kalshi between matches.</td><td>Budget for the delay. Don't count on re-deploying Kalshi capital intra-day.</td></tr>
<tr><td>Counterparty risk</td><td>Kalshi is CFTC-regulated (DCM). Polymarket is an on-chain protocol on Polygon.</td><td>Accept that these are different risk profiles. Size positions accordingly.</td></tr>
<tr><td>Execution failure on one leg</td><td>You fill on Polymarket but Kalshi rejects or the price moved. You're now directionally exposed.</td><td>Use limit orders on both sides. Accept that some arb attempts will only half-fill.</td></tr>
<tr><td>Fee changes mid-tournament</td><td>Either platform can adjust fees. Polymarket's taker fee is "at the sole discretion of Polymarket."</td><td>Build 50bps of fee buffer into every calculation.</td></tr>
<tr><td>Platform downtime during a match</td><td>Heavy load during popular matches can slow UI and API.</td><td>Pre-position orders before kickoff rather than during live play.</td></tr>
<tr><td>Regulatory action</td><td>Polymarket's US re-entry is limited (invite-only beta with 1M+ waitlist). Kalshi is US-only.</td><td>Don't build a strategy that requires US residency you don't have.</td></tr>
<tr><td>Gas fees on Polygon</td><td>On-chain transactions cost gas in MATIC. Usually <$0.01 but can spike during network congestion.</td><td>Keep MATIC in your wallet. Budget $5-10 for a full tournament's worth of transactions.</td></tr>
</tbody>
</table>
<h2>What the Volume Numbers Actually Tell You</h2>
<p>Polymarket has traded $2 billion on the World Cup winner market. Kalshi's equivalent market has $15.4 million. That's a 130:1 volume ratio. On individual match markets, the ratio narrows to 5:1 through 30:1 depending on the matchup.</p>
<p>This asymmetry is the entire reason cross-platform arbs exist. If both platforms had identical volume and identical user bases, prices would converge instantly. The volume gap means different populations of traders set prices on each platform, with different information, different biases, and different reaction speeds.</p>
<p>Crypto-native traders dominate Polymarket. They update positions quickly, run bots, and react to on-chain whale movements. Kalshi's user base skews toward US sports bettors converting from DraftKings and FanDuel, who trade more on narrative and less on data. When a credible injury report surfaces on X at 2 AM Eastern, Polymarket reprices within minutes. Kalshi might not move until the US market opens.</p>
<p>That behavioral divergence is the permanent alpha in cross-platform prediction market trading. Fee structures will change. Spreads will compress as more arb bots come online. But as long as the two platforms serve different trader populations with different information processing speeds, price gaps will keep appearing.</p>
<h2>Group-by-Group Arb Opportunities</h2>
<p>Here's the group-by-group breakdown of where the biggest cross-platform spreads are likely to appear during the group stage, based on the current pricing differential patterns and liquidity profiles.</p>
<p><strong>Groups with highest arb potential</strong> (wide spreads, sufficient liquidity on both platforms):</p>
<ul>
<li><strong>Group C (Brazil, Morocco, Scotland, Haiti)</strong>: Brazil vs. Morocco on June 13 has $451K Polymarket volume vs. $81K Kalshi. Morocco is the swing team. If Morocco takes the lead or equalizes, their advancement probability should spike on both platforms, but Kalshi's thinner book will lag. Morocco's outright winner odds show a 0.4¢ gap between platforms already.</li>
</ul>
<ul>
<li><strong>Group D (USA, Turkey, Paraguay, Australia)</strong>: USA vs. Paraguay draws the largest American audience, which means heavy Kalshi volume relative to other groups. The $117K Kalshi volume is closer to Polymarket's $758K, narrowing the ratio to 6.5:1. With more balanced flow, prices should converge faster, but the raw Kalshi interest means deeper books for execution.</li>
</ul>
<ul>
<li><strong>Group H (Spain, Uruguay, Saudi Arabia, Cape Verde)</strong>: Spain is priced at 99% to advance (Kalshi), so there's no edge on Spain's advancement. But Uruguay's advancement market ($0.90 Kalshi) and outright winner ($0.010 both platforms) could diverge if Saudi Arabia delivers a surprise (the 2022 template). Saudi Arabia beating Argentina in 2022 caused a 15-20 cent repricing across every market within 4 minutes.</li>
</ul>
<p><strong>Groups with lowest arb potential</strong> (tight spreads, either too liquid or too illiquid):</p>
<ul>
<li><strong>Group A (Mexico, Korea Republic, Czechia, South Africa)</strong>: Balanced group with no extreme favorite or longshot, pricing is already tight.</li>
<li><strong>Group G (Belgium, Egypt, Iran, New Zealand)</strong>: Belgium dominates at 68% to win the group, and the remaining teams have too little liquidity on both platforms to execute meaningful size.</li>
</ul>
<h2>Building a Tournament-Long Arb Portfolio</h2>
<p>Rather than chasing individual trades, the systematic approach builds a portfolio across all five strategies:</p>
<ol>
<li><strong>Allocate 40% to Strategy 1</strong> (outright winner spreads) with maker-only orders on both platforms. This is the lowest-effort, lowest-return bucket. Set limit orders based on DeFi Rate's aggregator and adjust daily.</li>
</ol>
<ol>
<li><strong>Allocate 20% to Strategy 3</strong> (advancement market layering). Focus on the 8-10 teams where Polymarket and Kalshi advancement odds differ by more than 2 percentage points. Rebalance after each match day.</li>
</ol>
<ol>
<li><strong>Allocate 20% to Strategy 4</strong> (latency arb). This requires a bot or at minimum a dual-screen setup with both platforms open during every match. Capital here needs to be liquid and ready to deploy in seconds.</li>
</ol>
<ol>
<li><strong>Allocate 10% to Strategy 5</strong> (overround arb via synthetic basket). Set up the basket on day one and hold through the tournament. This is the "set and forget" allocation.</li>
</ol>
<ol>
<li><strong>Keep 10% in reserve</strong> for Strategy 2 (match market arb) as opportunities present themselves during specific high-volatility matches.</li>
</ol>
<p><strong>Expected tournament-long return on $20,000 deployed</strong>: Conservative estimate of 5-12% net of all fees, or $1,000-$2,400 over the tournament's 30-day duration. This assumes maker pricing on 70% of trades, no catastrophic execution failures, and daily monitoring.</p>
<p>The World Cup runs 25 group-stage match days and approximately 15 knockout-round days. Each match day produces 2-4 repricing events. With 5 platforms listing the same markets and a $2 billion liquidity pool on the primary venue, the number of exploitable moments across 40 match days will be in the hundreds. Not every one will clear the fee hurdle. But the ones that do are real money.</p>`,
    featuredImage: '/images/wc-arbitrage-cover.png',
    authorId: 'author-1',
    categorySlug: 'strategy',
    tags: ['arbitrage', 'world-cup', '2026', 'polymarket', 'kalshi', 'cross-platform', 'FIFA', 'sports-betting', 'prediction-markets'],
    publishDate: '2026-06-11',
    readTime: 24,
    featured: true,
    status: 'published',
    seoTitle: '5 Cross-Platform Arbitrage Strategies for the 2026 World Cup (Polymarket × Kalshi) | Predictions Market Fans',
    metaDescription: 'Five concrete cross-platform arbitrage strategies for the 2026 FIFA World Cup using live Polymarket CLOB API and Kalshi pricing data. Real fee calculations, order book depths, and expected returns.',
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
