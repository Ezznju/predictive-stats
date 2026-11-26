'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  TrendingUp,
  Zap,
  Activity,
  Flame,
  BarChart3,
  DollarSign,
  Calculator,
  Percent,
  type LucideIcon,
} from 'lucide-react'
import { CornerDotSquare, HalfCircle } from '@/components/GeometricShapes'
import type {
  ArbCell,
  LpCell,
  PulseCell,
  TrendCell,
  HomepageSignals,
} from '@/lib/homepage-signals'

// Timeless evergreen fallback ONLY when a specific cache key is warming up.
// Never uses expired calendar dates.
const FALLBACK: HomepageSignals = {
  arb: [
    { mkt: 'Cross-platform macro & political markets', net: 1.4, conf: 82 },
    { mkt: 'Live Polymarket × Kalshi binary spreads', net: 1.1, conf: 76 },
  ],
  lp: [
    { mkt: 'Active Polymarket liquidity reward pools', real: 0.48, head: 'Daily USDC rewards', fail: false },
    { mkt: 'Net-of-spread & competition yield ranking', real: 0.34, head: 'Live order books', fail: false },
  ],
  pulse: [
    { wallet: 'Top Skill Wallets', note: 'Live graded on-chain Polymarket whale trades', chip: 'skill-graded', win: true },
    { wallet: 'Smart Money Feed', note: 'Real-time conviction & win-rate filtering', chip: 'live feed', win: true },
  ],
  trend: [
    { mkt: 'Top 25 active Polymarket markets by 24h volume', vol: 4_200_000, yes: 56, unitLabel: '/ 24h · Polymarket' },
  ],
  kalshi: [
    { mkt: 'Top 25 active CFTC-regulated Kalshi contracts', vol: 2_800_000, yes: 52, unitLabel: '/ 24h · Kalshi' },
  ],
  kalshiSmart: [
    { mkt: 'Largest resting limit-order walls on Kalshi', vol: 1_900_000, yes: 61, unitLabel: 'resting in book' },
  ],
  hasLiveData: false,
}

type Tool = 'arb' | 'lp' | 'pulse' | 'trending' | 'kalshi' | 'kalshi-smart'
const TC: Record<Tool, string> = {
  arb: '#2EE6A6',
  lp: '#B794FF',
  pulse: '#D9F24B',
  trending: '#FF7900',
  kalshi: '#00A36C',
  'kalshi-smart': '#00C853',
}

const TONE: Record<'g' | 'r' | 'c' | 'k', string> = {
  g: 'text-black bg-[rgba(43,217,110,0.22)] border-black/60',
  r: 'text-black bg-[rgba(255,107,107,0.20)] border-black/60',
  c: 'text-black bg-[rgba(41,197,246,0.22)] border-black/60',
  k: 'text-black bg-[rgba(255,191,0,0.28)] border-black/60',
}

function Chip({ tone, children }: { tone: 'g' | 'r' | 'c' | 'k'; children: React.ReactNode }) {
  return (
    <span className={`font-display text-[10px] font-bold tracking-[0.02em] px-2 py-[3px] rounded-md border whitespace-nowrap ${TONE[tone]}`}>
      {children}
    </span>
  )
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.round(n)}`
}

function renderTrendCell(t: TrendCell, badgeLabel: string, badgeBg: string) {
  return (
    <>
      <span
        className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black"
        style={{ backgroundColor: badgeBg }}
      >
        {badgeLabel}
      </span>
      <div className="font-display font-bold text-black text-[28px] leading-[1.05] mt-1.5 flex items-baseline flex-wrap gap-x-1.5 tabular-nums">
        {fmtVol(t.vol)}
        <span className="text-[11px] font-medium text-ink-faint">{t.unitLabel ?? '/ 24h'}</span>
      </div>
      <div className="text-[13px] font-medium text-ink-secondary mt-1.5 leading-snug line-clamp-2">{t.mkt}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        <Chip tone="c">live snapshot</Chip>
        <Chip tone="k">YES {Math.round(t.yes)}¢</Chip>
      </div>
    </>
  )
}

function renderCell(tool: Tool, d: ArbCell | LpCell | PulseCell | TrendCell) {
  if (tool === 'trending') return renderTrendCell(d as TrendCell, 'Polymarket', '#FF7900')
  if (tool === 'kalshi') return renderTrendCell(d as TrendCell, 'Kalshi Volume', '#29C5F6')
  if (tool === 'kalshi-smart') return renderTrendCell(d as TrendCell, 'Order Book Wall', '#2BD96E')

  if (tool === 'arb') {
    const a = d as ArbCell
    return (
      <>
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black" style={{ backgroundColor: '#2BD96E' }}>
          Arbitrage
        </span>
        <div className="font-display font-bold text-black text-[28px] leading-[1.05] mt-1.5 flex items-baseline flex-wrap gap-x-1.5 tabular-nums">
          +{a.net.toFixed(1)}¢<span className="text-[11px] font-medium text-ink-faint">/ pair · net</span>
        </div>
        <div className="text-[13px] font-medium text-ink-secondary mt-1.5 leading-snug line-clamp-2">{a.mkt}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Chip tone="c">net of fees + slip</Chip>
          <Chip tone="k">conf {a.conf}%</Chip>
          {a.risk && <Chip tone="r">⚠ {a.risk}</Chip>}
        </div>
      </>
    )
  }

  if (tool === 'lp') {
    const l = d as LpCell
    const pos = l.real >= 0
    return (
      <>
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black" style={{ backgroundColor: '#B794FF' }}>
          LP Rewards
        </span>
        <div className={`font-display font-bold text-[28px] leading-[1.05] mt-1.5 flex items-baseline flex-wrap gap-x-1.5 tabular-nums ${pos ? 'text-black' : 'text-red-600'}`}>
          {pos ? '+' : ''}{(l.real * 100).toFixed(0)}%<span className="text-[11px] font-medium text-ink-faint">est. net APR</span>
        </div>
        <div className="text-[13px] font-medium text-ink-secondary mt-1.5 leading-snug line-clamp-2">
          {l.mkt}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Chip tone="g">{l.head}</Chip>
          {l.fail ? <Chip tone="r">high competition</Chip> : <Chip tone="c">active rewards</Chip>}
        </div>
      </>
    )
  }

  const p = d as PulseCell
  const chip = p.win === true
    ? <Chip tone="g">✓ {p.chip}</Chip>
    : p.win === false
    ? <Chip tone="r">✗ {p.chip}</Chip>
    : p.park
    ? <Chip tone="k">parking · {p.chip}</Chip>
    : <Chip tone="c">{p.chip}</Chip>

  return (
    <>
      <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black" style={{ backgroundColor: '#D9F24B' }}>
        Smart Money
      </span>
      <div className="font-display font-bold text-[22px] leading-[1.1] mt-1.5 text-black truncate tabular-nums" title={p.wallet}>
        {p.wallet}
      </div>
      <div className="text-[13px] font-medium text-ink-secondary mt-1.5 leading-snug line-clamp-2">{p.note}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">{chip}<Chip tone="c">on-chain</Chip></div>
    </>
  )
}

const TOOL_LINK: Record<Tool, string> = {
  arb: '/tools/arbitrage-scanner',
  lp: '/tools/lp-scanner',
  pulse: '/pulse',
  trending: '/polymarket-trending-markets',
  kalshi: '/kalshi-trending-markets',
  'kalshi-smart': '/kalshi-smart-money',
}

const TOOL_LABEL: Record<Tool, string> = {
  arb: 'Arbitrage Scanner',
  lp: 'LP Reward Scanner',
  pulse: 'Polymarket Whale Tracker',
  trending: 'Polymarket Trending',
  kalshi: 'Kalshi Trending',
  'kalshi-smart': 'Kalshi Smart Money',
}

interface ToolMeta {
  name: string
  sub: string
  icon: LucideIcon
  iconBg: string
  question: string
  cta: string
  tint: string
}

const TOOL_META: Record<Tool, ToolMeta> = {
  arb: {
    name: 'Arbitrage Scanner', sub: 'Polymarket × Kalshi', icon: Zap,
    iconBg: 'rgba(43,217,110,0.14)',
    question: '“Is anything mispriced right now, and could I actually fill it?”',
    cta: 'Find spreads', tint: 'rgba(43,217,110,0.10)',
  },
  lp: {
    name: 'LP Reward Scanner', sub: 'Polymarket', icon: TrendingUp,
    iconBg: 'rgba(183,148,255,0.16)',
    question: '“Does providing liquidity here actually pay, once hidden costs are counted?”',
    cta: 'Scan pools', tint: 'rgba(183,148,255,0.12)',
  },
  pulse: {
    name: 'Polymarket Whale Tracker', sub: 'Smart Money', icon: Activity,
    iconBg: 'rgba(217,242,75,0.28)',
    question: '“When a big wallet moves, is it a signal worth following or just noise?”',
    cta: 'Track whales', tint: 'rgba(217,242,75,0.20)',
  },
  trending: {
    name: 'Polymarket Trending', sub: 'Polymarket · Live', icon: Flame,
    iconBg: 'rgba(255,121,0,0.16)',
    question: '“Which Polymarket markets are traders piling into right now?”',
    cta: 'Open board', tint: 'rgba(255,121,0,0.10)',
  },
  kalshi: {
    name: 'Kalshi Trending', sub: 'Kalshi · Live', icon: BarChart3,
    iconBg: 'rgba(41,197,246,0.18)',
    question: '“Which Kalshi markets are traders piling into right now?”',
    cta: 'Open board', tint: 'rgba(41,197,246,0.10)',
  },
  'kalshi-smart': {
    name: 'Kalshi Smart Money', sub: 'Kalshi · Live', icon: DollarSign,
    iconBg: 'rgba(0,200,83,0.16)',
    question: '“Where is serious capital resting in the Kalshi order book?”',
    cta: 'Open signals', tint: 'rgba(0,200,83,0.10)',
  },
}

function ToolCard({ tool, data, flashToken }: { tool: Tool; data: ArbCell | LpCell | PulseCell | TrendCell; flashToken: number }) {
  const meta = TOOL_META[tool]
  const Icon = meta.icon
  return (
    <div className="bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0" style={{ backgroundColor: meta.iconBg }}>
          <Icon className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="font-display font-bold text-[20px] text-ink leading-tight">{meta.name}</h3>
          <p className="text-[13px] font-medium text-ink-muted mt-0.5">{meta.sub}</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border-2 border-black p-3" style={{ backgroundColor: meta.tint }}>
        {flashToken > 0 && (
          <span key={flashToken} className="cell-ring" style={{ ['--tc' as any]: TC[tool] }} aria-hidden="true" />
        )}
        {renderCell(tool, data)}
      </div>
      <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3">
        <p className="text-sm font-bold text-black leading-snug">
          {meta.question}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <Link
          href={TOOL_LINK[tool]}
          aria-label={`Open ${TOOL_LABEL[tool]}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-black text-white font-display font-bold text-sm px-4 py-2.5 rounded-xl btn-pop"
        >
          {meta.cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

export function DecisionLabStrip({ initialSignals }: { initialSignals?: HomepageSignals }) {
  const arbList = initialSignals?.arb?.length ? initialSignals.arb : FALLBACK.arb
  const lpList = initialSignals?.lp?.length ? initialSignals.lp : FALLBACK.lp
  const pulseList = initialSignals?.pulse?.length ? initialSignals.pulse : FALLBACK.pulse
  const trendList = initialSignals?.trend?.length ? initialSignals.trend : FALLBACK.trend
  const kalshiList = initialSignals?.kalshi?.length ? initialSignals.kalshi : FALLBACK.kalshi
  const kalshiSmartList = initialSignals?.kalshiSmart?.length ? initialSignals.kalshiSmart : FALLBACK.kalshiSmart

  const [cursors, setCursors] = useState({ arb: 0, lp: 0, pulse: 0, trending: 0, kalshi: 0, 'kalshi-smart': 0 })
  const [flash, setFlash] = useState({ arb: 0, lp: 0, pulse: 0, trending: 0, kalshi: 0, 'kalshi-smart': 0 })

  // Gently cycle through the real server-seeded top-4 snapshots per card (zero network polling!)
  useEffect(() => {
    const tools: Tool[] = ['arb', 'lp', 'pulse', 'trending', 'kalshi', 'kalshi-smart']
    let step = 0
    const timer = setInterval(() => {
      const t = tools[step % tools.length]
      step++
      setCursors((c) => ({ ...c, [t]: c[t] + 1 }))
      setFlash((f) => ({ ...f, [t]: f[t] + 1 }))
    }, 4200)
    return () => clearInterval(timer)
  }, [])

  const currentData: Record<Tool, ArbCell | LpCell | PulseCell | TrendCell> = {
    arb: arbList[cursors.arb % arbList.length],
    lp: lpList[cursors.lp % lpList.length],
    pulse: pulseList[cursors.pulse % pulseList.length],
    trending: trendList[cursors.trending % trendList.length],
    kalshi: kalshiList[cursors.kalshi % kalshiList.length],
    'kalshi-smart': kalshiSmartList[cursors['kalshi-smart'] % kalshiSmartList.length],
  }

  return (
    <section className="py-12 border-b border-surface-border relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.85]" aria-hidden="true">
        <CornerDotSquare size={60} color="#29C5F6" dotColor="#FF00B8" className="absolute top-6 -right-4 opacity-70 hidden md:block" />
        <HalfCircle size={80} color="#2BD96E" direction="right" className="absolute -left-10 bottom-8 opacity-70 hidden md:block" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="heading-chip bg-neon-blue" />
            <h2 className="font-display font-bold text-[28px] text-black">Free Tools</h2>
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-white border-2 border-black rounded-full px-2.5 py-1 shadow-pop-sm">
              <span className="live-dot" aria-hidden="true" />
              <span className="text-[10px] font-bold tracking-[0.14em] text-black">
                {initialSignals?.hasLiveData ? 'LIVE DATA' : 'FREE SUITE'}
              </span>
            </span>
          </div>
          <Link href="/tools" className="text-sm text-black hover:text-white font-medium flex items-center gap-1 transition-colors">
            All 8 tools <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 6 Live Scanners & Market Boards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(['arb', 'lp', 'pulse', 'trending', 'kalshi', 'kalshi-smart'] as Tool[]).map((t) => (
            <ToolCard key={t} tool={t} data={currentData[t]} flashToken={flash[t]} />
          ))}
        </div>

        {/* 2 Instant Free Calculators Strip */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href="/tools/kalshi-combo-calculator"
            className="group bg-[#FFFDF9] border-2 border-black rounded-2xl p-5 shadow-pop hover:-translate-y-0.5 hover:shadow-pop-lg transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-[#29C5F6] flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5 text-black" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-ink group-hover:text-brand-orange transition-colors">
                    Kalshi Combo &amp; Blue Arrow Simulator
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-[#FFE642]">NEW</span>
                </div>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  Model 2–5 leg Kalshi combo payouts, fees &amp; DNP scalar settlements vs. sportsbook voids.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-black shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>

          <Link
            href="/tools/kalshi-fee-calculator"
            className="group bg-[#FFFDF9] border-2 border-black rounded-2xl p-5 shadow-pop hover:-translate-y-0.5 hover:shadow-pop-lg transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl border-2 border-black bg-[#C6F23A] flex items-center justify-center shrink-0">
                <Percent className="w-5 h-5 text-black" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-base text-ink group-hover:text-brand-orange transition-colors">
                    Kalshi vs. Polymarket Fee Calculator
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-[#C6F23A]">NEW</span>
                </div>
                <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                  Exact Kalshi quadratic taker/maker fees, break-even win %, and 0%-fee savings.
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-black shrink-0 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
