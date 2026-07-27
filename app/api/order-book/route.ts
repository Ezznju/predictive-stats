import { NextResponse } from 'next/server';
import { safeFetchJson } from '@/lib/safe-fetch';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface OrderBookSummary {
  market: string;
  asset_id: string;
  timestamp: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  last_trade_price: string;
  tick_size: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('token_id');

  if (!tokenId) {
    return NextResponse.json({ error: 'token_id required' }, { status: 400 });
  }

  try {
    const book = await safeFetchJson<OrderBookSummary>(
      `https://clob.polymarket.com/book?token_id=${tokenId}`,
      undefined,
      {},
      { timeoutMs: 10000, retries: 1 }
    );

    const bidDepth = book.bids.reduce((sum, b) => sum + parseFloat(b.size || '0'), 0);
    const askDepth = book.asks.reduce((sum, a) => sum + parseFloat(a.size || '0'), 0);

    return NextResponse.json({
      bids: book.bids.slice(0, 20),
      asks: book.asks.slice(0, 20),
      bidCount: book.bids.length,
      askCount: book.asks.length,
      bidDepth,
      askDepth,
      spread: book.asks.length && book.bids.length
        ? (parseFloat(book.asks[0].price) - parseFloat(book.bids[0].price)).toFixed(3)
        : null,
      lastPrice: book.last_trade_price,
      tickSize: book.tick_size,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
