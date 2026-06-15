import { fetchKalshiEvents, fetchKalshiMarketsForEvent } from '../lib/kalshi';
import { fetchPolymarketEvents } from '../lib/arbitrage';
import { fetchRewardMarkets, fetchOrderBook } from '../lib/polymarket';

async function main() {
  console.log('--- Polymarket gamma events ---');
  const poly = await fetchPolymarketEvents();
  console.log('events:', poly.length, '| sample markets:', poly[0]?.markets.length, '| sample prices:', poly[0]?.markets[0]?.outcomePrices);

  console.log('--- Kalshi events ---');
  const k = await fetchKalshiEvents();
  console.log('events:', k.length, '| sample:', k[0]?.event_ticker, k[0]?.category);

  console.log('--- Kalshi markets for one event ---');
  const km = await fetchKalshiMarketsForEvent(k.find((e) => e.category !== 'Sports')?.event_ticker ?? k[0]?.event_ticker);
  console.log('markets:', km.length, '| sample bid:', km[0]?.yes_bid_dollars);

  console.log('--- Polymarket reward markets ---');
  const rm = await fetchRewardMarkets();
  console.log('reward markets:', rm.length, '| top score:', rm[0]?.rewardScore?.toFixed(2), '| reward/day:', rm[0]?.rewardPerDay);

  console.log('--- Order book ---');
  const tok = rm.find((m) => m.yesTokenId)?.yesTokenId;
  const book = tok ? await fetchOrderBook(tok) : null;
  console.log('book bids:', book?.bids.length, '| asks:', book?.asks.length);

  console.log('\nALL OK');
}

main().catch((e) => {
  console.error('SMOKE FAILED:', e);
  process.exit(1);
});
