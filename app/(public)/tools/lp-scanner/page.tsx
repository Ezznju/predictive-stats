'use client';

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  GAMES,
  EsportsMatch,
  FeedEvent,
  createInitialMatches,
  tick,
  derive,
  backfill,
  winProbR,
  winProbG,
  isMatchPoint,
} from '@/lib/esports/match-engine';

/* ── Gamma Types ────────────────────────────────────────────────────── */

interface GammaRewardPool {
  conditionId: string;
  question: string;
  slug: string;
  image: string;
  dailyReward: number;
  minShares: number;
  maxSpread: number;
  endDate: string;
  tokens: Array<{
    tokenId: string;
    outcome: string;
    price: number;
  }>;
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function clamp(v: number, a: number, b: number) { return Math.min(b, Math.max(a, v)); }
function fmtT(s: number) { return Math.floor(Math.max(0, s) / 60) + ':' + String(Math.max(0, s) % 60).padStart(2, '0'); }
function fmtTime() { return new Date().toUTCString().slice(17, 25); }

/* ── Phase Cell ─────────────────────────────────────────────────────── */

function phaseCell(m: EsportsMatch) {
  const g = GAMES[m.game];
  if (!g) return <span className="s2-ph s2-ph-pre">—</span>;
  if (m.state === 'PRE') return <span className="s2-ph s2-ph-pre">T-{fmtT(m.pre ?? 0)}</span>;
  if (m.state === 'DONE') return <span className="s2-ph s2-ph-done">SETTLED</span>;
  if (m.state === 'HT') return <span className="s2-ph s2-ph-ht">◼ HALFTIME</span>;
  if (g.type === 'rounds') {
    return (
      <span className="s2-ph s2-ph-live">
        <i className="s2-live-dot" />
        R{m.round} · {fmtT(m.clock ?? 0)} · {(m.half ?? 0) === 1 ? '1H' : '2H'}
        {isMatchPoint(m) && <b className="s2-mp"> MP</b>}
      </span>
    );
  }
  return (
    <span className="s2-ph s2-ph-live">
      <i className="s2-live-dot" />
      G{m.gNum} · {m.gMin}′
    </span>
  );
}

function scoreCell(m: EsportsMatch) {
  const g = GAMES[m.game];
  if (!g) return <span className="dim">—</span>;
  if (m.state === 'PRE') return <span className="dim">—</span>;
  if (g.type === 'rounds') {
    return <>{m.sA}–{m.sB}{m.state === 'DONE' && <span className="dim"> F</span>}</>;
  }
  return <>{m.ga}–{m.gb}{((m.gNum ?? 1) > 1 || m.state === 'DONE') ? '' : <span className="dim"> G1</span>}</>;
}

function winTag(m: EsportsMatch) {
  if (m.state === 'PRE') return <span className="s2-wtag s2-w-pre">T-MINUS</span>;
  if (m.state === 'DONE') return <span className="s2-wtag s2-w-done">CLOSED</span>;
  if (m.state === 'HT') return <span className="s2-wtag s2-w-arm">ARMING</span>;
  if (isMatchPoint(m)) return <span className="s2-wtag s2-w-clutch">CLUTCH</span>;
  if (m.secondHalf && m.decay > 0.45) return <span className="s2-wtag s2-w-open">WINDOW OPEN</span>;
  if (m.secondHalf) return <span className="s2-wtag s2-w-arm">OPENING</span>;
  return <span className="s2-wtag s2-w-early">EARLY</span>;
}

function edgeBar(m: EsportsMatch) {
  const grad = m.edge >= 64
    ? 'linear-gradient(90deg,var(--s2-cyn),var(--s2-yel))'
    : m.edge >= 45
    ? 'linear-gradient(90deg,var(--s2-cyn),var(--s2-grn))'
    : 'linear-gradient(90deg,var(--s2-dim),var(--s2-mut))';
  return (
    <div>
      <div className="s2-edge"><i style={{ width: m.edge + '%', background: grad }} /></div>
      <span className={`s2-grade s2-g-${m.grade}`}>{m.grade} · {m.edge}</span>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────── */

export default function LPScannerPage() {
  const [matches, setMatches] = useState<EsportsMatch[]>(() => {
    const m = createInitialMatches();
    m.forEach(backfill);
    m.forEach(derive);
    return m;
  });
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [paused, setPaused] = useState(false);
  const [sortKey, setSortKey] = useState<'edge' | 'pool' | 'mNow' | 'spread' | 'est1k'>('edge');
  const [sortDir, setSortDir] = useState(-1);
  const [selGame, setSelGame] = useState('ALL');
  const [q, setQ] = useState('');
  const [winOnly, setWinOnly] = useState(false);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [posCap, setPosCap] = useState(1000);
  const [clock, setClock] = useState('--:--');
  const [tickerOffset, setTickerOffset] = useState(0);
  const feedRef = useRef<FeedEvent[]>([]);

  // Velocity calculator state
  const [vCap, setVCap] = useState(1000);
  const [vN, setVN] = useState(6);
  const [vPool, setVPool] = useState(90);
  const [vPhase, setVPhase] = useState(2.8);

  // Gamma API state
  const [gammaPools, setGammaPools] = useState<GammaRewardPool[]>([]);
  const [gammaLoading, setGammaLoading] = useState(true);
  const [gammaError, setGammaError] = useState<string | null>(null);

  const addFeed = useCallback((m: EsportsMatch, txt: string) => {
    const evt: FeedEvent = {
      t: fmtTime(),
      tag: m.a + ' v ' + m.b,
      mid: m.id,
      txt,
    };
    feedRef.current = [evt, ...feedRef.current].slice(0, 20);
  }, []);

  // Clock
  useEffect(() => {
    const iv = setInterval(() => setClock(fmtTime()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Fetch Gamma reward pools
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gamma-rewards');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!cancelled) {
          setGammaPools(Array.isArray(data.pools) ? data.pools : []);
          setGammaLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setGammaError(err?.message ?? 'Failed to load');
          setGammaLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Simulation tick
  useEffect(() => {
    if (paused) return;
    const iv = setInterval(() => {
      setMatches((prev) => {
        const next = prev.map((m) => ({ ...m, hist: [...m.hist] }));
        tick(next, addFeed);
        return next;
      });
      setFeed([...feedRef.current]);
    }, 2000);
    return () => clearInterval(iv);
  }, [paused, addFeed]);

  // Advance 10 min
  const advance = useCallback(() => {
    setMatches((prev) => {
      const next = prev.map((m) => ({ ...m, hist: [...m.hist] }));
      for (let i = 0; i < 5; i++) tick(next, addFeed);
      return next;
    });
    setFeed([...feedRef.current]);
  }, [addFeed]);

  // Sort
  const filtered = useMemo(() => {
    return matches
      .filter(
        (m) =>
          (selGame === 'ALL' || m.game === selGame) &&
          (!q || (m.a + ' ' + m.b + ' ' + m.league).toLowerCase().includes(q.toLowerCase())) &&
          (!winOnly || m.winOpen)
      )
      .sort((a, b) => ((a as any)[sortKey] - (b as any)[sortKey]) * sortDir);
  }, [matches, selGame, q, winOnly, sortKey, sortDir]);

  const handleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(-sortDir);
    else { setSortKey(k); setSortDir(-1); }
  };

  const featured = matches[0];
  const drawer = drawerId !== null ? matches.find((m) => m.id === drawerId) : null;
  const sel = drawer;

  // Velocity calc
  const vBase = vCap / (20 * 300 + vCap);
  const vShare = Math.min(0.85, vBase * vPhase);
  const vPerMatch = vPool * vShare;
  const vDaily = vPerMatch * vN;
  const vStaticD = vPool * vBase;

  return (
    <div className="s2-root">
      {/* Ambient layers */}
      <div className="s2-bg-stripes" />
      <div className="s2-bg-grid" />
      <div className="s2-bg-glow s2-g1" />
      <div className="s2-bg-glow s2-g2" />
      <div className="s2-sweep" />

      {/* Masthead */}
      <header className="s2-masthead">
        <div className="s2-brand">
          ◢ SIDE·<b>TWO</b> <em>second-half esports LP desk</em>
        </div>
        <span className="s2-livebug"><i />IN-PLAY</span>
        <div className="s2-mast-right">
          <button
            className="s2-feed-badge"
            onClick={() => setPaused(!paused)}
          >
            <i className={paused ? '' : 's2-grn-dot'} />
            <span>{paused ? 'SIM · PAUSED' : 'SIM · RUNNING'}</span>
          </button>
          <span className="s2-mono">{clock} UTC</span>
          <button className="s2-btn" onClick={advance}>⏩ +10 min</button>
        </div>
      </header>

      {/* Ticker */}
      <div className="s2-ticker">
        <div className="s2-ticker-track">
          {[...matches, ...matches].map((m, i) => (
            <span className="s2-tk" key={i}>
              <b>{m.a} v {m.b}</b>
              <span className="s2-mono">{(m.mid * 100).toFixed(1)}¢</span>
              <span className={m.state === 'DONE' ? 'dim' : m.mid > (m.prevMid ?? m.mid) ? 's2-tup' : 's2-tdn'}>
                {m.state === 'DONE' ? '■' : m.mid > (m.prevMid ?? m.mid) ? '▲' : '▼'}
              </span>
            </span>
          ))}
        </div>
      </div>

      <main>
        {/* Opening: thesis + featured match */}
        <section className="s2-open-grid">
          <div>
            <p className="s2-kicker">The esports LP thesis</p>
            <h1 className="s2-h1">
              Wait for the<br />
              <span className="s2-yel">second half.</span>
            </h1>
            <p className="s2-lede">
              Political markets lock capital for weeks. Esports markets die in three hours — and every one of them runs the same lifecycle: <b>a crowded opening book, a halftime exodus, and a second half where the reward pool keeps paying but most of the competition has already left.</b> The opportunity isn&apos;t a mispricing you find once. It&apos;s a rhythm that happens on schedule, in every league, every day.
            </p>
            <div className="s2-stat-chips">
              <span className="s2-schip"><b>−71%</b> makers by round 20</span>
              <span className="s2-schip">pool pays <b>flat</b> through the match</span>
              <span className="s2-schip">capital rotates <b>6×/day</b></span>
            </div>
          </div>
          <div>
            {/* Featured match */}
            {featured && (
              <div className="s2-feat" onClick={() => setDrawerId(featured.id)} style={{ cursor: 'pointer' }}>
                <div className="s2-feat-top">
                  <span className="s2-gametag" style={{ background: GAMES[featured.game]?.color }}>
                    {GAMES[featured.game]?.label} · BO3{((featured.map ?? 1) > 1 ? ' · MAP ' + featured.map : '')}
                  </span>
                  <span className="s2-league s2-mono">{featured.league}</span>
                  <span className="s2-livebug" style={{ marginLeft: 'auto' }}>
                    <i />
                    {featured.state === 'LIVE' ? 'LIVE' : featured.state === 'HT' ? 'BREAK' : featured.state === 'DONE' ? 'SETTLED' : 'PRE'}
                  </span>
                </div>
                <div className="s2-sb">
                  <div className="s2-team" style={{ color: featured.colorA }}>
                    <span className="s2-t-mark" style={{ background: featured.colorA }}><span>{featured.a[0]}</span></span>
                    <div>
                      <div className="s2-t-name">{featured.a}</div>
                      <div className="s2-t-score">{featured.sA ?? 0}</div>
                    </div>
                  </div>
                  <div className="s2-sb-mid">
                    <div className="s2-mono s2-sb-round">
                      ROUND {featured.round} · {(featured.half ?? 0) === 1 ? '1ST' : '2ND'} HALF · MAP {(featured.map ?? 1)}
                    </div>
                    <div className="s2-mono s2-sb-clock">
                      {featured.state === 'DONE' ? (featured.winner ?? '') + ' WINS' : fmtT(featured.clock ?? 0)}
                    </div>
                  </div>
                  <div className="s2-team s2-right" style={{ color: featured.colorB }}>
                    <span className="s2-t-mark" style={{ background: featured.colorB }}><span>{featured.b[0]}</span></span>
                    <div>
                      <div className="s2-t-name">{featured.b}</div>
                      <div className="s2-t-score">{featured.sB ?? 0}</div>
                    </div>
                  </div>
                </div>
                <div className="s2-phasebar">
                  <i style={{ width: Math.min(1, ((featured.sA ?? 0) + (featured.sB ?? 0)) / 25) * 100 + '%' }} />
                  <em />
                </div>
                <div className="s2-feat-grid">
                  <div className="s2-fcell">
                    <span className="s2-flab">Mid · {featured.mid >= 0.5 ? featured.a : featured.b} favored</span>
                    <span className="s2-fval s2-mono">{(featured.mid * 100).toFixed(1)}¢</span>
                  </div>
                  <div className="s2-fcell">
                    <span className="s2-flab">Makers open → now</span>
                    <span className="s2-fval s2-mono">{featured.mOpen} → <b className="s2-amb">{featured.mNow}</b></span>
                    <div className="s2-decay"><i style={{ width: (1 - featured.decay) * 100 + '%' }} /></div>
                  </div>
                  <div className="s2-fcell">
                    <span className="s2-flab">Pool / day</span>
                    <span className="s2-fval s2-mono s2-amb">${featured.pool}</span>
                  </div>
                  <div className="s2-fcell">
                    <span className="s2-flab">Est $/day · $1k</span>
                    <span className="s2-fval s2-mono s2-grn">${featured.est1k.toFixed(2)}</span>
                  </div>
                  <div className="s2-fcell">
                    <span className="s2-flab">Window</span>
                    {winTag(featured)}
                  </div>
                </div>
              </div>
            )}

            {/* Feed */}
            <div className="s2-feed">
              {feed.slice(0, 5).map((f, i) => (
                <div className={'s2-fi' + (i === 0 ? ' s2-new' : '')} key={i}>
                  <span className="s2-fi-t s2-mono">{f.t}</span>
                  <span className="s2-fi-tag">{f.tag}</span>
                  <span>{f.txt}</span>
                </div>
              ))}
              {feed.length === 0 && (
                <div className="s2-fi">
                  <span className="s2-fi-tag">DESK</span>
                  <span>Feed warming up…</span>
                </div>
              )}
            </div>

            {/* Up next */}
            <div className="s2-upnext">
              {matches.filter((m) => m.state === 'PRE').sort((a, b) => (a.pre ?? 0) - (b.pre ?? 0)).length > 0 ? (
                <>
                  <span className="s2-un-lab">UP NEXT ▸</span>
                  {matches.filter((m) => m.state === 'PRE').sort((a, b) => (a.pre ?? 0) - (b.pre ?? 0)).map((m) => (
                    <span className="s2-un" key={m.id}>
                      <b>{m.a} v {m.b}</b>
                      <span className="s2-mono s2-amb">T-{fmtT(m.pre ?? 0)}</span>
                      <span className="dim s2-mono">{GAMES[m.game]?.label} · ${m.pool}/d</span>
                    </span>
                  ))}
                </>
              ) : (
                <span className="s2-un-lab">▸ ALL DESKS LIVE</span>
              )}
            </div>
          </div>
        </section>

        {/* Live Window Board */}
        <section className="s2-board">
          <div className="s2-console-head">
            <h2 className="s2-h2">Live Window Board</h2>
            <div className="s2-head-meta">
              <span>{filtered.length} markets</span>
              <span>SCAN {clock} UTC</span>
            </div>
          </div>
          <div className="s2-filters">
            <input
              type="search"
              placeholder="▸ team / league…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="s2-search"
            />
            <div className="s2-chips">
              {['ALL', ...Object.keys(GAMES)].map((g) => (
                <button
                  key={g}
                  className={'s2-fchip' + (selGame === g ? ' s2-on' : '')}
                  onClick={() => setSelGame(g)}
                >
                  {g === 'ALL' ? 'ALL' : GAMES[g]?.label}
                </button>
              ))}
            </div>
            <label className="s2-wl-t">
              <input type="checkbox" checked={winOnly} onChange={(e) => setWinOnly(e.target.checked)} />
              window open only
            </label>
          </div>
          <div className="s2-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Phase</th>
                  <th>Score</th>
                  <th onClick={() => handleSort('pool')}>Pool/day {sortKey === 'pool' ? (sortDir < 0 ? '▼' : '▲') : ''}</th>
                  <th onClick={() => handleSort('mNow')}>Makers {sortKey === 'mNow' ? (sortDir < 0 ? '▼' : '▲') : ''}</th>
                  <th onClick={() => handleSort('spread')}>Spread {sortKey === 'spread' ? (sortDir < 0 ? '▼' : '▲') : ''}</th>
                  <th onClick={() => handleSort('est1k')}>Est $/d · $1k {sortKey === 'est1k' ? (sortDir < 0 ? '▼' : '▲') : ''}</th>
                  <th>Window</th>
                  <th onClick={() => handleSort('edge')}>Edge {sortKey === 'edge' ? (sortDir < 0 ? '▼' : '▲') : ''}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const g = GAMES[m.game];
                  return (
                    <tr key={m.id} onClick={() => setDrawerId(m.id)}>
                      <td>
                        <div className="s2-m-match">
                          <span className="s2-gchip" style={{ background: g?.color }}>{g?.label}</span>
                          <b>{m.a} <span className="dim">vs</span> {m.b}</b>
                        </div>
                        <div className="dim s2-mono s2-m-league">{m.league}</div>
                      </td>
                      <td>{phaseCell(m)}</td>
                      <td className="s2-mono s2-sc">{scoreCell(m)}</td>
                      <td className="s2-mono s2-c-pool">${m.pool}</td>
                      <td>
                        <div className="s2-mono">{m.mOpen}→<b className={m.decay > 0.5 ? 's2-amb' : ''}>{m.mNow}</b></div>
                        <div className="s2-dmini"><i style={{ width: (1 - m.decay) * 100 + '%' }} /></div>
                      </td>
                      <td className="s2-mono">{m.spread.toFixed(1)}¢</td>
                      <td className="s2-mono s2-c-est s2-grn">${m.est1k.toFixed(2)}</td>
                      <td>{winTag(m)}</td>
                      <td>{edgeBar(m)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="s2-footnote">
            SIM ENGINE — scores, clocks and maker counts are simulated to demonstrate the liquidity lifecycle; structure mirrors Polymarket esports format (CS2/VAL MR12, LoL/Dota BO3). Maker counts marked ~ are modeled. Not financial advice.
          </p>
        </section>

        {/* Live Gamma Reward Pools */}
        <section className="s2-sec" id="gamma">
          <div className="s2-sec-head">
            <p className="s2-kicker" style={{ margin: 0 }}>Live from Polymarket</p>
            <h2 className="s2-h2">Active Reward Pools</h2>
          </div>
          <p style={{ color: 'var(--s2-mut)', maxWidth: '70ch', marginBottom: 18 }}>
            Real-time reward pool data from Polymarket&apos;s Gamma API. These markets are currently paying LP rewards — sorted by daily reward.
          </p>
          {gammaLoading ? (
            <div className="s2-feat" style={{ textAlign: 'center', padding: 40 }}>
              <span className="s2-mono" style={{ color: 'var(--s2-cyn)' }}>Loading reward pools…</span>
            </div>
          ) : gammaError ? (
            <div className="s2-feat" style={{ textAlign: 'center', padding: 40 }}>
              <span className="s2-mono" style={{ color: 'var(--s2-red)' }}>Error: {gammaError}</span>
            </div>
          ) : gammaPools.length === 0 ? (
            <div className="s2-feat" style={{ textAlign: 'center', padding: 40 }}>
              <span className="s2-mono" style={{ color: 'var(--s2-mut)' }}>No active reward pools found.</span>
            </div>
          ) : (
            <div className="s2-table-wrap" style={{ maxHeight: '40vh' }}>
              <table>
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Reward/Day</th>
                    <th>Min Shares</th>
                    <th>Max Spread</th>
                    <th>YES Price</th>
                    <th>NO Price</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {gammaPools.map((p) => {
                    const yesTok = p.tokens.find((t) => t.outcome === 'Yes');
                    const noTok = p.tokens.find((t) => t.outcome === 'No');
                    return (
                      <tr key={p.conditionId}>
                        <td>
                          <div style={{ maxWidth: 400 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.question}</div>
                          </div>
                        </td>
                        <td className="s2-mono s2-c-pool">${p.dailyReward.toFixed(2)}</td>
                        <td className="s2-mono">{p.minShares.toLocaleString()}</td>
                        <td className="s2-mono">{p.maxSpread}¢</td>
                        <td className="s2-mono s2-grn">{yesTok ? (yesTok.price * 100).toFixed(1) + '¢' : '—'}</td>
                        <td className="s2-mono" style={{ color: 'var(--s2-red)' }}>{noTok ? (noTok.price * 100).toFixed(1) + '¢' : '—'}</td>
                        <td>
                          <a
                            href={`https://polymarket.com/event/${p.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="s2-dw-link"
                            style={{ display: 'inline-block', padding: '6px 12px', fontSize: 10, marginTop: 0 }}
                          >
                            VIEW ↗
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="s2-footnote">
            Data from Polymarket Gamma API · {gammaPools.length} active reward markets · Updated on page load
          </p>
        </section>

        {/* Decay Chart */}
        <section className="s2-sec" id="decay">
          <div className="s2-sec-head">
            <p className="s2-kicker" style={{ margin: 0 }}>Why the second half pays</p>
            <h2 className="s2-h2">Makers leave. The pool doesn&apos;t.</h2>
          </div>
          <p style={{ color: 'var(--s2-mut)', maxWidth: '70ch', marginBottom: 18 }}>
            One CS2 playoff market, tracked from open to match point. The cyan line is competition; the amber line is your share of a flat pool per $1,000 deployed. Hover the phases.
          </p>
          <DecayChart />
        </section>

        {/* Velocity Calculator */}
        <section className="s2-sec s2-velo">
          <div>
            <p className="s2-kicker">The turnover multiplier</p>
            <h2 className="s2-h2" style={{ marginBottom: 10 }}>Same $1,000. Six lives a day.</h2>
            <p style={{ color: 'var(--s2-mut)', lineHeight: 1.7, maxWidth: '52ch' }}>
              Static farming camps one book and takes whatever share the crowd leaves. The esports rotation re-enters at every halftime with fresh capital against a decayed book — the pool share resets in your favor, over and over. This is what makes the &quot;$100 a day&quot; math a process instead of a lottery ticket.
            </p>
            <div className={'s2-verdict' + (vDaily >= 100 ? ' s2-v-grn' : vDaily >= 60 ? ' s2-v-amb' : ' s2-v-red')}>
              <div className="s2-vt">
                {vDaily >= 100 ? `TARGET CLEARED — $${vDaily.toFixed(0)}/day modeled`
                  : vDaily >= 60 ? `IN RANGE — $${vDaily.toFixed(0)}/day modeled`
                  : `NOT YET — $${vDaily.toFixed(0)}/day modeled`}
              </div>
              <p>
                {vDaily >= 100
                  ? `The article's $100/day math works — via turnover, not one magic market. ${vN} second-half entries at ${(vShare * 100).toFixed(0)}% average pool share. Now subtract the bill: adverse selection, fills, delay.`
                  : vDaily >= 60
                  ? `$${(100 - vDaily).toFixed(0)} short of the target. Add ${Math.ceil(100 / vPerMatch) - vN} more entries or move entry timing later into the half.`
                  : `At this rotation the target needs ~${vPerMatch > 0 ? Math.ceil(100 / vPerMatch) : '—'} entries or a larger bankroll. This is why $100→$10/day is a stretch but $1,000→$100/day is a process.`}
              </p>
            </div>
          </div>
          <div className="s2-velo-panel">
            <div className="s2-vrow">
              <div className="s2-vlab"><span>Bankroll</span><b>${vCap.toLocaleString()}</b></div>
              <input type="range" min={100} max={5000} step={100} value={vCap} onChange={(e) => setVCap(+e.target.value)} />
            </div>
            <div className="s2-vrow">
              <div className="s2-vlab"><span>Second-half entries / day</span><b>{vN}</b></div>
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
            <VelBar label="ESPORTS ROTATION" value={vDaily} max={Math.max(vDaily, vStaticD, 100) * 1.12} colorClass="rot-b" />
            <div className="s2-vb-row">
              <span className="s2-vb-lab s2-mono">$100/DAY TARGET</span>
              <div className="s2-vb-track">
                <div className="s2-vb tgt-b" style={{ width: (100 / (Math.max(vDaily, vStaticD, 100) * 1.12)) * 100 + '%' }} />
              </div>
              <span className="s2-vb-v s2-mono" style={{ color: 'var(--s2-org)' }}>$100</span>
            </div>
          </div>
        </section>

        {/* Playbook */}
        <section className="s2-sec" id="playbook">
          <p className="s2-kicker">Second-half playbook</p>
          <h2 className="s2-h2" style={{ marginBottom: 24 }}>Six rules for the window</h2>
          {[
            { n: '01', title: 'The pool doesn\'t watch the match', desc: <>Rewards accrue per epoch whether it&apos;s round 1 or round 24. You&apos;re not timing the event — <b>you&apos;re timing the competition</b>. The scoreboard is noise; the maker count is the signal.</> },
            { n: '02', title: 'Makers flee volatility', desc: <>Every clutch round is pure adverse selection for a market maker, so the book thins exactly when the match gets loud. <b>Their fear is your yield.</b> A 34-maker opener becomes a 9-maker second half without the pool losing a cent.</> },
            { n: '03', title: 'Enter at the break, not the rally', desc: <>Halftime and between-map pauses: volatility stops, game state is legible, and the exodus has already happened. Mid-round quoting against live kill feeds makes you <b>exit liquidity for someone with a data feed</b>.</> },
            { n: '04', title: 'Watch the game or don\'t quote', desc: <>Your edge in the window is live context — eco, momentum, tilt, the paused round. Broadcast delay runs 30–120 seconds, which means <b>attention is the moat</b>: if you can&apos;t watch, you&apos;re the slowest person in the room.</> },
            { n: '05', title: 'Velocity beats yield', desc: <>$1,000 rotating through six second halves beats $1,000 camped in one book for a month. <b>Capital turnover is the compounding engine</b> — the per-match yield can be modest and the day still clears.</> },
            { n: '06', title: 'Tier-1 only. Cap inventory.', desc: <>The window pays because it&apos;s risky: match-point swings, picked-off quotes, tail events. IEM, Majors, LCK/LEC/LCS, VCT, Riyadh — <b>nothing you&apos;ve never heard of</b> — and size to survive being right only 60% of the time.</> },
          ].map((r, i) => (
            <div className="s2-rule" key={i}>
              <div className="s2-num">{r.n}</div>
              <div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Risk Section */}
        <section className="s2-sec" id="risks">
          <div className="s2-bill">
            <h3>▮ The bill — what the window charges</h3>
            {[
              { n: '01', title: 'Adverse selection is the real cost.', desc: 'A kill happens, price moves in two seconds, and your stale quote gets filled by someone faster. The second-half yield is compensation for that risk — not a loophole.' },
              { n: '02', title: 'You are slower than you think.', desc: 'Streams delay 30–120s. Real in-play makers sit on direct game-state feeds. This is why rule 03 exists: the break is the only moment where your latency doesn\'t matter.' },
              { n: '03', title: 'Rotation has friction.', desc: 'Six entries a day is twelve-plus fills — spread costs, epoch boundaries, and the occasional bad exit all eat the model. Track your realized number, not the modeled one.' },
              { n: '04', title: 'It\'s not only esports.', desc: 'Any event market with a live phase runs this lifecycle — traditional sports in-play, debate nights, award shows. Esports is just the purest case: short, dense, 24/7, across timezones.' },
            ].map((item, i) => (
              <div className="s2-bill-item" key={i}>
                <i>{item.n}</i>
                <div>
                  <b>{item.title}</b>
                  <span>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Wire Section */}
        <section className="s2-sec s2-wire">
          <div>
            <p className="s2-kicker">Wire it to reality</p>
            <h2 className="s2-h2">From sim to live desk</h2>
            <p className="s2-body-copy">
              This page runs a self-contained simulation of the match lifecycle so the strategy is visible. To make it a production desk you need two feeds:
            </p>
            <ul className="s2-wire-list">
              <li><b>Reward pools</b> — Polymarket&apos;s Gamma API, keyless: <code>rewards</code>, <code>rewardsMinSize</code>, <code>rewardsMaxSpread</code> per market.</li>
              <li><b>Game state</b> — an esports data provider (PandaScore, GRID, Abios) over websocket for round wins, halves and match point.</li>
              <li><b>Maker counts</b> — poll the CLOB order book per token; count distinct resting makers inside max spread.</li>
              <li><b>The alert</b> — fire when phase ≥ halftime AND maker decay &gt; 50%. That&apos;s the whole product.</li>
            </ul>
          </div>
          <pre className="s2-pre"><code>{`// 1 · pools — Gamma API (free, keyless)
const pools = await fetch(
  "https://gamma-api.polymarket.com/markets?closed=false&active=true"
).then(r => r.json());  // filter to esports tags client-side

// 2 · live game state — provider websocket (PandaScore / GRID)
provider.on("round_win", ({ match }) => {
  const book  = orderbook(match.polymarketTokenId); // CLOB API
  const decay = 1 - book.makers / book.makersAtOpen;
  const phase = match.half === 2 ? "SECOND_HALF" : "FIRST_HALF";

  if (phase === "SECOND_HALF" && decay > 0.5)
    alert(\`WINDOW OPEN · \${match.name} · makers \${book.makers}\`);
});`}</code></pre>
        </section>
      </main>

      {/* Footer */}
      <footer className="s2-footer">
        <div className="s2-f-in">
          <div>
            <div className="s2-brand" style={{ fontSize: 17, marginBottom: 10 }}>◢ SIDE·<b>TWO</b></div>
            <p>Companion desk to the LP Scanner — built on the esports second-half thesis. All match data on this page is simulated to demonstrate the liquidity lifecycle; reward mechanics mirror Polymarket&apos;s published LP program. Nothing here is financial advice — qualifying orders carry inventory risk, and modeled yields are not realized yields.</p>
          </div>
          <div className="s2-f-links">
            <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer">Polymarket ↗</a>
            <a href="https://docs.polymarket.com" target="_blank" rel="noopener noreferrer">API docs ↗</a>
            <a href="#velocity">Velocity model ↑</a>
          </div>
        </div>
      </footer>

      {/* Scrim + Drawer */}
      <div className={'s2-scrim' + (drawer !== null ? ' s2-open' : '')} onClick={() => setDrawerId(null)} />
      {sel && (
        <aside className="s2-drawer s2-open">
          <button className="s2-dw-close" onClick={() => setDrawerId(null)}>✕</button>
          <span className="s2-gchip" style={{ background: GAMES[sel.game]?.color }}>{GAMES[sel.game]?.label}</span>
          <div className="s2-dw-teams">{sel.a} <span className="dim" style={{ fontSize: 16 }}>vs</span> {sel.b}</div>
          <div className="s2-dw-sub">{sel.league} · pool ${sel.pool}/day</div>
          <h4 className="s2-dw-h">Maker decay · live</h4>
          <div className="s2-hsvg">
            <svg viewBox="0 0 280 52" preserveAspectRatio="none">
              {sel.hist.length > 1 && (
                <path
                  d={sel.hist.map((v, i) => {
                    const mx = Math.max(...sel.hist);
                    const mn = Math.min(...sel.hist);
                    const r = mx - mn || 1;
                    return (i ? 'L' : 'M') + ((i / (sel.hist.length - 1)) * 280).toFixed(1) + ',' + (52 - 4 - ((v - mn) / r) * 42).toFixed(1);
                  }).join('')}
                  fill="none"
                  stroke="var(--s2-cyn)"
                  strokeWidth="1.6"
                />
              )}
            </svg>
          </div>
          <div className="s2-mono dim" style={{ fontSize: 10.5, marginTop: 6 }}>
            {sel.mOpen} at open → {sel.mNow} now (−{(sel.decay * 100).toFixed(0)}%)
          </div>
          <h4 className="s2-dw-h">Position model</h4>
          <div className="s2-dw-cap">
            Capital
            <input
              type="number"
              value={posCap}
              min={10}
              step={10}
              onChange={(e) => setPosCap(Math.max(0, +e.target.value || 0))}
            />
          </div>
          <div className="s2-dw-grid" style={{ marginTop: 14 }}>
            <div>
              <span className="s2-flab">Pool share</span>
              <span className="s2-mono" style={{ color: 'var(--s2-cyn)' }}>
                {(Math.min(0.85, posCap / (sel.makerCap + posCap)) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="s2-flab">This match</span>
              <span className="s2-mono s2-grn">
                ${(sel.pool * Math.min(0.85, posCap / (sel.makerCap + posCap))).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="s2-flab">× 6 rotations</span>
              <span className="s2-mono s2-amb">
                ${(sel.pool * Math.min(0.85, posCap / (sel.makerCap + posCap)) * 6).toFixed(0)}/d
              </span>
            </div>
            <div>
              <span className="s2-flab">Spread</span>
              <span className="s2-mono">{sel.spread.toFixed(1)}¢</span>
            </div>
          </div>
          <h4 className="s2-dw-h">Desk read</h4>
          {isMatchPoint(sel) && (
            <div className="s2-flag s2-bad"><i>▮</i><div><b>Match point</b><span>Maximum adverse selection — every round is decisive. Size down or sit out.</span></div></div>
          )}
          {sel.state === 'PRE' && (
            <div className="s2-flag"><i>▮</i><div><b>Window not open yet</b><span>Set an alert for halftime. Entering at the opener means paying full competition.</span></div></div>
          )}
          {sel.mNow < 5 && (
            <div className="s2-flag s2-bad"><i>▮</i><div><b>Skeleton book</b><span>Under 5 makers — your own fills move the mid. Quote minimum size only.</span></div></div>
          )}
          {sel.winOpen && (
            <div className="s2-flag s2-ok"><i>▮</i><div><b>Window open</b><span>Maker decay {(sel.decay * 100).toFixed(0)}% with the pool still paying flat. This is the setup.</span></div></div>
          )}
          {!isMatchPoint(sel) && sel.state !== 'PRE' && sel.mNow >= 5 && !sel.winOpen && (
            <div className="s2-flag"><i>▮</i><div><b>No major flags</b><span>Standard book for this phase.</span></div></div>
          )}
          <a className="s2-dw-link" href="https://polymarket.com/markets" target="_blank" rel="noopener noreferrer">
            OPEN ON POLYMARKET ↗
          </a>
          <p className="s2-dw-note">
            Simulated lifecycle. Real deployment needs Gamma API pools + a live game-state provider + CLOB maker counts.
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

function DecayChart() {
  const phases = ['PRE', 'R1–6', 'R7–12', 'HT', 'R13–18', 'R19–24', 'MP'];
  const makers = [34, 30, 24, 15, 11, 9, 6];
  const share = makers.map((n) => 1000 / (n * 300 + 1000) * 100);
  const notes = [
    'Full book. Everyone is here — worst possible time to enter.',
    'Casual money plus bots. Competition peaks, share bottoms.',
    'Only grinders remain. Your share quietly creeps up.',
    'The break. Risk desks reset, first big pull happens here.',
    'Volatility up, makers down. The window arms.',
    'Every round decisive. Thin book, fat share — the money zone.',
    'Maximum share, maximum adverse selection. Clutch or don\u2019t.',
  ];
  const [hover, setHover] = useState(5);

  const W = 780, H = 300, L = 52, R = 56, T = 30, B = 46;
  const iw = (W - L - R) / 7;
  const yM = (n: number) => T + (1 - n / 40) * (H - T - B);
  const yS = (p: number) => T + (1 - p / 40) * (H - T - B);

  const linePath = (vals: number[], yf: (n: number) => number) =>
    vals.map((v, i) => (i ? 'L' : 'M') + (L + iw * i + iw / 2) + ',' + yf(v)).join(' ');

  return (
    <div>
      <div className="s2-chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`}>
          {/* Grid */}
          {[0, 10, 20, 30, 40].map((v) => (
            <g key={v}>
              <line x1={L} y1={yM(v)} x2={W - R} y2={yM(v)} stroke="rgba(139,151,173,.12)" />
              <text x={L - 8} y={yM(v) + 3} fill="var(--s2-dim)" fontSize="9" textAnchor="end" fontFamily="var(--s2-mono)">{v}</text>
            </g>
          ))}
          {/* Window highlight */}
          <rect x={L + iw * 3} y={T} width={W - R - (L + iw * 3)} height={H - T - B} fill="rgba(255,214,10,.055)" />
          <line x1={L + iw * 3} y1={T} x2={L + iw * 3} y2={H - B} stroke="rgba(255,214,10,.5)" strokeDasharray="4 4" />
          <text x={L + iw * 3 + 10} y={T + 16} fill="var(--s2-yel)" fontSize="10" fontFamily="var(--s2-mono)" letterSpacing="2">THE SECOND-HALF WINDOW</text>
          {/* Lines */}
          <path d={linePath(makers, yM)} fill="none" stroke="var(--s2-cyn)" strokeWidth="2.2" />
          <path d={linePath(share, yS)} fill="none" stroke="var(--s2-yel)" strokeWidth="2.2" />
          {/* Dots */}
          {makers.map((v, i) => <circle key={'m' + i} cx={L + iw * i + iw / 2} cy={yM(v)} r="3.4" fill="var(--s2-cyn)" />)}
          {share.map((v, i) => <circle key={'s' + i} cx={L + iw * i + iw / 2} cy={yS(v)} r="3.4" fill="var(--s2-yel)" />)}
          {/* Labels */}
          {phases.map((p, i) => (
            <text key={i} x={L + iw * i + iw / 2} y={H - 18} fill="var(--s2-mut)" fontSize="10" textAnchor="middle" fontFamily="var(--s2-mono)">{p}</text>
          ))}
          {/* Hover bands */}
          {phases.map((_, i) => (
            <rect key={i} x={L + iw * i} y={T} width={iw} height={H - T - B} fill="transparent" style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHover(i)} />
          ))}
          <text x={L} y={16} fill="var(--s2-cyn)" fontSize="10" fontFamily="var(--s2-mono)" letterSpacing="2">MAKERS LEFT</text>
          <text x={W - R} y={16} fill="var(--s2-yel)" fontSize="10" textAnchor="end" fontFamily="var(--s2-mono)" letterSpacing="2">POOL SHARE / $1K</text>
        </svg>
      </div>
      <div className="s2-cread">
        <div><span className="s2-flab">Phase</span><b className="s2-mono" style={{ color: 'var(--s2-ink)' }}>{phases[hover]}</b></div>
        <div><span className="s2-flab">Makers left</span><b className="s2-mono" style={{ color: 'var(--s2-cyn)' }}>{makers[hover]} <span style={{ color: 'var(--s2-dim)', fontSize: 11 }}>({Math.round((1 - makers[hover] / 34) * 100)}% gone)</span></b></div>
        <div><span className="s2-flab">Share of pool / $1k</span><b className="s2-mono s2-amb">{share[hover].toFixed(0)}%</b></div>
        <div><span className="s2-flab">Est $/day · $1k</span><b className="s2-mono s2-grn">${(120 * share[hover] / 100).toFixed(0)}</b></div>
        <div className="s2-cnote">{notes[hover]}</div>
      </div>
    </div>
  );
}
