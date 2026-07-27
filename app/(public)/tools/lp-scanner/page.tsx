'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';

/* ── Types ──────────────────────────────────────────────────────────── */

interface LPRewardMarket {
  conditionId: string;
  question: string;
  slug: string;
  image: string;
  dailyReward: number;
  spread: number;
  minSize: number;
  maxSpread: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  liquidity: number;
  competitiveness: number;
  endDate: string;
  priceChange24h: number;
  yesPrice: number;
  noPrice: number;
  tokenId: string;
}

interface OrderBook {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  bidCount: number;
  askCount: number;
  bidDepth: number;
  askDepth: number;
  spread: string | null;
  lastPrice: string;
  tickSize: string;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function fmt$(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

function fmtCents(n: number) {
  return (n * 100).toFixed(1) + '¢';
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = d.getTime() - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/* ── Main Page ──────────────────────────────────────────────────────── */

export default function LPScannerPage() {
  const [markets, setMarkets] = useState<LPRewardMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<'dailyReward' | 'spread' | 'volume24hr' | 'liquidity' | 'competitiveness' | 'minSize'>('dailyReward');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [selectedMarket, setSelectedMarket] = useState<LPRewardMarket | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [obLoading, setObLoading] = useState(false);

  // Velocity calculator
  const [vCap, setVCap] = useState(1000);
  const [vN, setVN] = useState(6);
  const [vPool, setVPool] = useState(90);
  const [vPhase, setVPhase] = useState(2.8);

  // Fetch rewards data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/lp-rewards');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setMarkets(data.markets ?? []);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch order book when market selected
  useEffect(() => {
    if (!selectedMarket?.tokenId) { setOrderBook(null); return; }
    let cancelled = false;
    (async () => {
      setObLoading(true);
      try {
        const res = await fetch('/api/order-book?token_id=' + selectedMarket.tokenId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!cancelled) setOrderBook(data);
      } catch {
        if (!cancelled) setOrderBook(null);
      } finally {
        if (!cancelled) setObLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedMarket?.tokenId]);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedMarket(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Sort + filter
  const filtered = useMemo(() => {
    return markets
      .filter((m) => !q || m.question.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => ((a[sortKey] as number) - (b[sortKey] as number)) * sortDir);
  }, [markets, q, sortKey, sortDir]);

  const handleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(-sortDir as -1 | 1);
    else { setSortKey(k); setSortDir(-1); }
  };

  const sortArrow = (k: typeof sortKey) => sortKey === k ? (sortDir === -1 ? ' ▼' : ' ▲') : '';

  // Velocity calc
  const vBase = vCap / (20 * 300 + vCap);
  const vShare = Math.min(0.85, vBase * vPhase);
  const vPerMatch = vPool * vShare;
  const vDaily = vPerMatch * vN;
  const vStaticD = vPool * vBase;

  return (
    <div className="s2-root">
      <div className="s2-bg-stripes" />
      <div className="s2-bg-grid" />
      <div className="s2-bg-glow s2-g1" />
      <div className="s2-bg-glow s2-g2" />
      <div className="s2-sweep" />

      {/* Masthead */}
      <header className="s2-masthead">
        <div className="s2-brand">
          ◢ <b>LP</b> <em>scanner — live reward pools</em>
        </div>
        <span className="s2-livebug"><i />LIVE</span>
        <div className="s2-mast-right">
          <span className="s2-mono dim" style={{ fontSize: 11 }}>
            {markets.length} active reward markets
          </span>
        </div>
      </header>

      <main>
        {/* Board */}
        <section className="s2-board">
          <div className="s2-console-head">
            <h2 className="s2-h2">Active Reward Pools</h2>
            <div className="s2-head-meta">
              <span>Source: Polymarket CLOB + Gamma API</span>
              <span>Sorted by daily reward</span>
            </div>
          </div>

          {/* Filters */}
          <div className="s2-filters">
            <input
              className="s2-search"
              placeholder="Search markets…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="s2-chips">
              {([
                ['dailyReward', 'Daily Reward'],
                ['spread', 'Spread'],
                ['volume24hr', '24h Volume'],
                ['liquidity', 'Liquidity'],
                ['competitiveness', 'Competitiveness'],
                ['minSize', 'Min Size'],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  className={'s2-fchip' + (sortKey === k ? ' s2-on' : '')}
                  onClick={() => handleSort(k)}
                >
                  {label}{sortArrow(k)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="s2-table-wrap" style={{ maxHeight: '65vh' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <span className="s2-mono" style={{ color: 'var(--s2-cyn)' }}>Loading reward pools…</span>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <span className="s2-mono" style={{ color: 'var(--s2-red)' }}>Error: {error}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <span className="s2-mono" style={{ color: 'var(--s2-mut)' }}>No markets found.</span>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ minWidth: 280 }}>Market</th>
                    <th onClick={() => handleSort('dailyReward')}>$/Day{sortArrow('dailyReward')}</th>
                    <th onClick={() => handleSort('spread')}>Spread{sortArrow('spread')}</th>
                    <th onClick={() => handleSort('minSize')}>Min Size{sortArrow('minSize')}</th>
                    <th onClick={() => handleSort('volume24hr')}>24h Vol{sortArrow('volume24hr')}</th>
                    <th onClick={() => handleSort('liquidity')}>Liquidity{sortArrow('liquidity')}</th>
                    <th onClick={() => handleSort('competitiveness')}>Compete{sortArrow('competitiveness')}</th>
                    <th>Ends</th>
                    <th>Prices</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => {
                    const days = daysUntil(m.endDate);
                    return (
                      <tr key={m.conditionId} onClick={() => setSelectedMarket(m)}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.35 }}>
                            {m.question}
                          </div>
                          <div className="s2-mono dim" style={{ fontSize: 10, marginTop: 3 }}>
                            {m.slug}
                          </div>
                        </td>
                        <td className="s2-mono s2-c-pool" style={{ fontSize: 15, fontWeight: 700 }}>
                          ${m.dailyReward.toFixed(2)}
                        </td>
                        <td className="s2-mono">
                          <span style={{ color: m.spread <= 0.02 ? 'var(--s2-grn)' : m.spread <= 0.05 ? 'var(--s2-yel)' : 'var(--s2-red)' }}>
                            {(m.spread * 100).toFixed(1)}¢
                          </span>
                        </td>
                        <td className="s2-mono">{m.minSize > 0 ? m.minSize : '—'}</td>
                        <td className="s2-mono">{fmt$(m.volume24hr)}</td>
                        <td className="s2-mono">{fmt$(m.liquidity)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 50, height: 5, background: 'var(--s2-panel2)', borderRadius: 2 }}>
                              <div style={{
                                width: (m.competitiveness * 100) + '%',
                                height: '100%',
                                background: m.competitiveness > 0.7 ? 'var(--s2-grn)' : m.competitiveness > 0.4 ? 'var(--s2-yel)' : 'var(--s2-red)',
                                borderRadius: 2,
                              }} />
                            </div>
                            <span className="s2-mono dim" style={{ fontSize: 11 }}>
                              {(m.competitiveness * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="s2-mono" style={{ fontSize: 12, color: days !== null && days < 7 ? 'var(--s2-red)' : 'var(--s2-mut)' }}>
                          {days !== null ? (days < 0 ? 'Ended' : days + 'd') : '—'}
                        </td>
                        <td className="s2-mono" style={{ fontSize: 12 }}>
                          <span className="s2-grn">{(m.yesPrice * 100).toFixed(0)}¢</span>
                          <span className="dim"> / </span>
                          <span style={{ color: 'var(--s2-red)' }}>{(m.noPrice * 100).toFixed(0)}¢</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <p className="s2-footnote">
            Data from Polymarket CLOB Rewards API + Gamma API · {filtered.length} markets with active LP rewards · Click any row for order book details
          </p>
        </section>

        {/* Velocity Calculator */}
        <section className="s2-sec s2-velo" id="velocity">
          <div>
            <p className="s2-kicker">Model your returns</p>
            <h2 className="s2-h2" style={{ marginBottom: 10 }}>Same $1,000. Six lives a day.</h2>
            <p style={{ color: 'var(--s2-mut)', lineHeight: 1.7, maxWidth: '52ch' }}>
              Static farming camps one book and takes whatever share the crowd leaves. The rotation re-enters at every opportunity with fresh capital against a decayed book — the pool share resets in your favor, over and over.
            </p>
            <div className={'s2-verdict' + (vDaily >= 100 ? ' s2-v-grn' : vDaily >= 60 ? ' s2-v-amb' : ' s2-v-red')}>
              <div className="s2-vt">
                {vDaily >= 100 ? `TARGET CLEARED — $${vDaily.toFixed(0)}/day modeled`
                  : vDaily >= 60 ? `IN RANGE — $${vDaily.toFixed(0)}/day modeled`
                  : `NOT YET — $${vDaily.toFixed(0)}/day modeled`}
              </div>
              <p>
                {vDaily >= 100
                  ? `The $100/day math works — via turnover, not one magic market. ${vN} entries at ${(vShare * 100).toFixed(0)}% average pool share. Subtract adverse selection, fills, delay.`
                  : vDaily >= 60
                  ? `$${(100 - vDaily).toFixed(0)} short of the target. Add ${Math.ceil(100 / vPerMatch) - vN} more entries or move entry timing later.`
                  : `At this rotation the target needs ~${vPerMatch > 0 ? Math.ceil(100 / vPerMatch) : '—'} entries or a larger bankroll.`}
              </p>
            </div>
          </div>
          <div className="s2-velo-panel">
            <div className="s2-vrow">
              <div className="s2-vlab"><span>Bankroll</span><b>${vCap.toLocaleString()}</b></div>
              <input type="range" min={100} max={5000} step={100} value={vCap} onChange={(e) => setVCap(+e.target.value)} />
            </div>
            <div className="s2-vrow">
              <div className="s2-vlab"><span>Entries / day</span><b>{vN}</b></div>
              <input type="range" min={1} max={10} step={1} value={vN} onChange={(e) => setVN(+e.target.value)} />
            </div>
            <div className="s2-vrow">
              <div className="s2-vlab"><span>Avg pool size</span><b>${vPool}/day</b></div>
              <input type="range" min={40} max={200} step={5} value={vPool} onChange={(e) => setVPool(+e.target.value)} />
            </div>
            <div className="s2-vrow">
              <div className="s2-vlab"><span>Entry timing</span></div>
              <select value={vPhase} onChange={(e) => setVPhase(+e.target.value)}>
                <option value={1}>Opener — full book (×1.0 share)</option>
                <option value={1.9}>Halftime break (×1.9 share)</option>
                <option value={2.8}>Second half (×2.8 share)</option>
                <option value={4.2}>Match point — clutch (×4.2 share)</option>
              </select>
            </div>
            <div className="s2-vout">
              <div><span className="s2-flab">Pool share / entry</span><div className="s2-big s2-mono" style={{ color: 'var(--s2-cyn)' }}>{(vShare * 100).toFixed(1)}%</div></div>
              <div><span className="s2-flab">Per match</span><div className="s2-big s2-mono">${vPerMatch.toFixed(2)}</div></div>
              <div><span className="s2-flab">Entries to $100/d</span><div className="s2-big s2-mono s2-amb">{vPerMatch > 0 ? Math.ceil(100 / vPerMatch) : '—'}</div></div>
            </div>
            <VelBar label="ONE STATIC MARKET" value={vStaticD} max={Math.max(vDaily, vStaticD, 100) * 1.12} colorClass="dim-b" />
            <VelBar label="ROTATION STRATEGY" value={vDaily} max={Math.max(vDaily, vStaticD, 100) * 1.12} colorClass="rot-b" />
            <div className="s2-vb-row">
              <span className="s2-vb-lab s2-mono">$100/DAY TARGET</span>
              <div className="s2-vb-track">
                <div className="s2-vb tgt-b" style={{ width: (100 / (Math.max(vDaily, vStaticD, 100) * 1.12)) * 100 + '%' }} />
              </div>
              <span className="s2-vb-v s2-mono" style={{ color: 'var(--s2-org)' }}>$100</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="s2-footer">
        <div className="s2-f-in">
          <div>
            <div className="s2-brand" style={{ fontSize: 17, marginBottom: 10 }}>◢ <b>LP</b> Scanner</div>
            <p>Real-time Polymarket LP reward pool data. Sources: CLOB Rewards API, Gamma API. Click any market for live order book depth. Nothing here is financial advice.</p>
          </div>
          <div className="s2-f-links">
            <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">Polymarket ↗</a>
            <a href="https://docs.polymarket.com" target="_blank" rel="noopener noreferrer">API docs ↗</a>
            <a href="#velocity">Velocity model ↑</a>
          </div>
        </div>
      </footer>

      {/* Scrim + Drawer */}
      <div className={'s2-scrim' + (selectedMarket ? ' s2-open' : '')} onClick={() => setSelectedMarket(null)} />
      {selectedMarket && (
        <aside className="s2-drawer s2-open">
          <button className="s2-dw-close" onClick={() => setSelectedMarket(null)}>✕</button>
          <div className="s2-dw-sub">{selectedMarket.slug}</div>
          <div style={{ fontFamily: 'var(--s2-disp)', fontSize: 22, textTransform: 'uppercase', margin: '8px 0 4px', letterSpacing: '.02em', color: 'var(--s2-ink)', lineHeight: 1.3 }}>
            {selectedMarket.question}
          </div>

          {/* Key metrics */}
          <div className="s2-dw-grid" style={{ marginTop: 18 }}>
            <div>
              <span className="s2-flab">Daily Reward</span>
              <span className="s2-mono" style={{ color: 'var(--s2-yel)', fontSize: 18, fontWeight: 700 }}>${selectedMarket.dailyReward.toFixed(2)}</span>
            </div>
            <div>
              <span className="s2-flab">Spread</span>
              <span className="s2-mono" style={{ fontSize: 15 }}>{(selectedMarket.spread * 100).toFixed(1)}¢</span>
            </div>
            <div>
              <span className="s2-flab">24h Volume</span>
              <span className="s2-mono s2-grn" style={{ fontSize: 15 }}>{fmt$(selectedMarket.volume24hr)}</span>
            </div>
            <div>
              <span className="s2-flab">Liquidity</span>
              <span className="s2-mono" style={{ fontSize: 15 }}>{fmt$(selectedMarket.liquidity)}</span>
            </div>
          </div>

          {/* Reward config */}
          <h4 className="s2-dw-h">Reward Configuration</h4>
          <div style={{ fontSize: 13, color: 'var(--s2-mut)', lineHeight: 1.8 }}>
            <div>Min size: <b style={{ color: 'var(--s2-ink)' }}>{selectedMarket.minSize || 'None'}</b></div>
            <div>Max spread: <b style={{ color: 'var(--s2-ink)' }}>{selectedMarket.maxSpread ? selectedMarket.maxSpread + '¢' : 'None'}</b></div>
            <div>Competitiveness: <b style={{ color: 'var(--s2-ink)' }}>{(selectedMarket.competitiveness * 100).toFixed(0)}%</b></div>
            <div>24h price change: <b style={{ color: selectedMarket.priceChange24h >= 0 ? 'var(--s2-grn)' : 'var(--s2-red)' }}>
              {selectedMarket.priceChange24h >= 0 ? '+' : ''}{(selectedMarket.priceChange24h * 100).toFixed(1)}%
            </b></div>
            {selectedMarket.endDate && (
              <div>Ends: <b style={{ color: 'var(--s2-ink)' }}>{new Date(selectedMarket.endDate).toLocaleDateString()}</b>
                <span className="dim"> ({daysUntil(selectedMarket.endDate)} days)</span>
              </div>
            )}
          </div>

          {/* Order book */}
          <h4 className="s2-dw-h">Live Order Book</h4>
          {obLoading ? (
            <div className="s2-mono dim" style={{ fontSize: 12, padding: '12px 0' }}>Loading order book…</div>
          ) : orderBook ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: 'var(--s2-panel2)', padding: 12, border: '1px solid var(--s2-line)' }}>
                  <div className="s2-flab">Bids ({orderBook.bidCount})</div>
                  <div className="s2-mono s2-grn" style={{ fontSize: 15, fontWeight: 600 }}>${orderBook.bidDepth.toFixed(0)}</div>
                </div>
                <div style={{ background: 'var(--s2-panel2)', padding: 12, border: '1px solid var(--s2-line)' }}>
                  <div className="s2-flab">Asks ({orderBook.askCount})</div>
                  <div className="s2-mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--s2-red)' }}>${orderBook.askDepth.toFixed(0)}</div>
                </div>
              </div>
              {orderBook.spread && (
                <div style={{ fontSize: 12, color: 'var(--s2-mut)', marginBottom: 10 }}>
                  Spread: <b style={{ color: 'var(--s2-ink)' }}>{(parseFloat(orderBook.spread) * 100).toFixed(1)}¢</b>
                  <span className="dim"> · Last: </span>
                  <b style={{ color: 'var(--s2-ink)' }}>{(parseFloat(orderBook.lastPrice) * 100).toFixed(1)}¢</b>
                </div>
              )}
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                <table style={{ width: '100%', fontSize: 11, fontFamily: 'var(--s2-mono)' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: 'var(--s2-grn)', padding: '4px 8px', borderBottom: '1px solid var(--s2-line)' }}>BID</th>
                      <th style={{ textAlign: 'right', color: 'var(--s2-grn)', padding: '4px 8px', borderBottom: '1px solid var(--s2-line)' }}>Size</th>
                      <th style={{ textAlign: 'left', color: 'var(--s2-red)', padding: '4px 8px', borderBottom: '1px solid var(--s2-line)' }}>ASK</th>
                      <th style={{ textAlign: 'right', color: 'var(--s2-red)', padding: '4px 8px', borderBottom: '1px solid var(--s2-line)' }}>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(orderBook.bids.length, orderBook.asks.length) }).map((_, i) => (
                      <tr key={i}>
                        <td style={{ padding: '3px 8px', color: 'var(--s2-grn)' }}>
                          {orderBook.bids[i] ? (parseFloat(orderBook.bids[i].price) * 100).toFixed(1) + '¢' : ''}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: 'var(--s2-mut)' }}>
                          {orderBook.bids[i] ? '$' + parseFloat(orderBook.bids[i].size).toFixed(0) : ''}
                        </td>
                        <td style={{ padding: '3px 8px', color: 'var(--s2-red)' }}>
                          {orderBook.asks[i] ? (parseFloat(orderBook.asks[i].price) * 100).toFixed(1) + '¢' : ''}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', color: 'var(--s2-mut)' }}>
                          {orderBook.asks[i] ? '$' + parseFloat(orderBook.asks[i].size).toFixed(0) : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="s2-mono dim" style={{ fontSize: 12, padding: '12px 0' }}>
              {selectedMarket.tokenId ? 'No order book data' : 'No token ID available'}
            </div>
          )}

          <a
            className="s2-dw-link"
            href={`https://polymarket.com/event/${selectedMarket.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPEN ON POLYMARKET ↗
          </a>
          <p className="s2-dw-note">
            Live data from Polymarket. Order book depth shows resting limit orders inside the current spread.
          </p>
        </aside>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function VelBar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  return (
    <div className="s2-vb-row">
      <span className="s2-vb-lab s2-mono">{label}</span>
      <div className="s2-vb-track">
        <div className={'s2-vb ' + colorClass} style={{ width: (value / max * 100) + '%' }} />
      </div>
      <span className={'s2-vb-v s2-mono ' + (colorClass === 'rot-b' ? 's2-grn' : colorClass === 'dim-b' ? 'dim' : '')}>
        ${value.toFixed(0)}/d
      </span>
    </div>
  );
}
