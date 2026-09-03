'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Zap, Activity, type LucideIcon } from 'lucide-react'
import { CornerDotSquare, HalfCircle } from '@/components/GeometricShapes'

/* ── THE SEAM ──────────────────────────────────────────────────────────
   Keep USE_MOCK = true until fetchLiveOpportunities() returns real data.
   The mock figures below are identical to the preview you approved, so the
   band looks alive on day one. The component renders the same either way.
────────────────────────────────────────────────────────────────────── */
const USE_MOCK = true

export interface ArbCell   { mkt: string; net: number; conf: number; risk?: string }
export interface LpCell    { mkt: string; real: number; head: string; fail: boolean }
export interface PulseCell { wallet: string; note: string; chip: string; win: boolean | null; park?: boolean }
export interface LiveOpportunities { arb: ArbCell; lp: LpCell; pulse: PulseCell }

/** Replace this body with a call to your engine / cached route handler.
 *  Return ONE current top opportunity per tool, in the shape above.
 *  Return null while unimplemented — the band keeps its last good snapshot. */
async function fetchLiveOpportunities(): Promise<LiveOpportunities | null> {
  return null
}

/* ── mock feed (same numbers as the preview) ─────────────────────────── */
const MOCK = {
  arb: [
    { mkt: 'Fed cuts — Sept FOMC', net: 1.7, conf: 83 },
    { mkt: 'BTC > $150k — Aug 31', net: 1.1, conf: 71 },
    { mkt: 'Spain wins World Cup', net: 1.4, conf: 78 },
    { mkt: 'US recession < 2027', net: 0.9, conf: 64, risk: 'stale quote' },
  ] as ArbCell[],
  lp: [
    { mkt: 'Fed cuts — Sept FOMC', real: 1.48, head: '9,400%', fail: true },
    { mkt: 'BTC $150k — Aug 31', real: 0.62, head: '3,900%', fail: false },
    { mkt: 'Israel–Syria normalize', real: 0.33, head: '33,200%', fail: false },
    { mkt: 'GPT-6 by Dec 31', real: -0.04, head: '4,400%', fail: true },
  ] as LpCell[],
  pulse: [
    { wallet: 'DEEDDIT', note: '$2.3M accumulated · Spain advance', chip: '+94%', win: true },
    { wallet: 'BreakTheBank', note: 'Spain YES @ 22¢ · 5 days out', chip: '+347%', win: true },
    { wallet: '0x37ee…f86F', note: 'sold $64.7K Spain YES @ 99.9¢', chip: 'exited at top', win: null },
    { wallet: '0x2c33…0563', note: 'Argentina NO @ 99.8¢', chip: '0.2% edge', win: null, park: true },
  ] as PulseCell[],
}
const cursor = { arb: 0, lp: 0, pulse: 0 }
function mockTop(advance?: 'arb' | 'lp' | 'pulse'): LiveOpportunities {
  if (advance) cursor[advance] = (cursor[advance] + 1) % MOCK[advance].length
  return { arb: MOCK.arb[cursor.arb], lp: MOCK.lp[cursor.lp], pulse: MOCK.pulse[cursor.pulse] }
}

type Tool = 'arb' | 'lp' | 'pulse'
const TC: Record<Tool, string> = { arb: '#2EE6A6', lp: '#B794FF', pulse: '#D9F24B' }

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

function renderCell(tool: Tool, d: ArbCell | LpCell | PulseCell) {
  if (tool === 'arb') {
    const a = d as ArbCell
    return (
      <>
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black" style={{ backgroundColor: '#2BD96E' }}>Arbitrage</span>
        <div className="font-display font-bold text-black text-[30px] leading-[1.05] mt-1.5 flex items-baseline flex-wrap gap-x-1.5 tabular-nums">
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
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black" style={{ backgroundColor: '#B794FF' }}>LP Rewards</span>
        <div className={`font-display font-bold text-[30px] leading-[1.05] mt-1.5 flex items-baseline flex-wrap gap-x-1.5 tabular-nums ${pos ? 'text-black' : 'text-red-600'}`}>
          {pos ? '+' : ''}{(l.real * 100).toFixed(0)}%<span className="text-[11px] font-medium text-ink-faint">realistic APR</span>
        </div>
        <div className="text-[13px] font-medium text-ink-secondary mt-1.5 leading-snug line-clamp-2">
          {l.mkt} · <span className="text-ink-faint line-through text-[11px]">{l.head}</span> headline
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {l.fail ? <Chip tone="r">⚠ no break-even</Chip> : <Chip tone="g">breaks even</Chip>}
          <Chip tone="c">net of competition</Chip>
        </div>
      </>
    )
  }
  const p = d as PulseCell
  const chip = p.win === true ? <Chip tone="g">✓ {p.chip}</Chip>
    : p.win === false ? <Chip tone="r">✗ {p.chip}</Chip>
    : p.park ? <Chip tone="k">parking · {p.chip}</Chip>
    : <Chip tone="c">{p.chip}</Chip>
  return (
    <>
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black rounded-md border-2 border-black" style={{ backgroundColor: '#D9F24B' }}>Smart Money</span>
        <div className="font-display font-bold text-[24px] leading-[1.1] mt-1.5 text-black truncate tabular-nums"
          title={p.wallet}>{p.wallet}</div>
        <div className="text-[13px] font-medium text-ink-secondary mt-1.5 leading-snug line-clamp-2">{p.note}</div>
      <div className="flex flex-wrap gap-1.5 mt-2">{chip}<Chip tone="c">graded</Chip></div>
    </>
  )
}

const TOOL_LINK: Record<Tool, string> = { arb: '/tools/arbitrage-scanner', lp: '/tools/lp-scanner', pulse: '/pulse' }
const TOOL_LABEL: Record<Tool, string> = { arb: 'Arbitrage Scanner', lp: 'LP Reward Scanner', pulse: 'Prediction Pulse' }

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
    name: 'Prediction Pulse', sub: 'Whale Tracker', icon: Activity,
    iconBg: 'rgba(217,242,75,0.28)',
    question: '“When a big wallet moves, is it a signal worth following or just noise?”',
    cta: 'Track whales', tint: 'rgba(217,242,75,0.20)',
  },
}

function ToolCard({ tool, data, flashToken }: { tool: Tool; data: ArbCell | LpCell | PulseCell; flashToken: number }) {
  const meta = TOOL_META[tool]
  const Icon = meta.icon
  return (
    <div className="bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0" style={{ backgroundColor: meta.iconBg }}>
          <Icon className="w-5 h-5 text-black" />
        </div>
        <div>
          <h3 className="font-display font-bold text-[22px] text-ink leading-none">{meta.name}</h3>
          <p className="text-[14px] font-medium text-ink-muted mt-1">{meta.sub}</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl border-2 border-black p-3" style={{ backgroundColor: meta.tint }}>
        {flashToken > 0 && (
          <span key={flashToken} className="cell-ring" style={{ ['--tc' as any]: TC[tool] }} aria-hidden="true" />
        )}
        {renderCell(tool, data)}
      </div>
      <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3">
        <p className="text-sm font-bold text-black">
          This tool answers: {meta.question}
        </p>
      </div>
      <Link
        href={TOOL_LINK[tool]}
        aria-label={`Open ${TOOL_LABEL[tool]}`}
        className="mt-auto inline-flex items-center justify-center gap-2 bg-black text-white font-display font-bold text-sm px-4 py-2.5 rounded-xl btn-pop"
      >
        {meta.cta} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

export function DecisionLabStrip() {
  const [top, setTop] = useState<LiveOpportunities>(() => mockTop())
  const [flash, setFlash] = useState({ arb: 0, lp: 0, pulse: 0 })
  const warned = useRef(false)

  useEffect(() => {
    let mounted = true
    const tick = async () => {
      if (!mounted) return
      if (USE_MOCK) {
        const tools: Tool[] = ['arb', 'lp', 'pulse']
        const t = tools[Math.floor(Math.random() * tools.length)]
        setTop(mockTop(t))
        setFlash((f) => ({ ...f, [t]: f[t] + 1 }))
      } else {
        try {
          const data = await fetchLiveOpportunities()
          if (data) {
            setTop(data)
            setFlash((f) => ({ arb: f.arb + 1, lp: f.lp + 1, pulse: f.pulse + 1 }))
          } else if (!warned.current) {
            warned.current = true
            console.warn('[DecisionLabStrip] fetchLiveOpportunities() returned null — showing placeholder.')
          }
        } catch {
          /* keep last good snapshot */
        }
      }
    }

    if (!USE_MOCK) tick()
    const liveTimer = setInterval(tick, 3800)
    return () => { mounted = false; clearInterval(liveTimer) }
  }, [])

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
              <span className="text-[10px] font-bold tracking-[0.14em] text-black">LIVE</span>
            </span>
          </div>
          <Link href="/tools" className="text-sm text-black hover:text-white font-medium flex items-center gap-1 transition-colors">
            All tools <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['arb', 'lp', 'pulse'] as Tool[]).map((t) => (
            <ToolCard key={t} tool={t} data={top[t]} flashToken={flash[t]} />
          ))}
        </div>
      </div>
    </section>
  )
}
