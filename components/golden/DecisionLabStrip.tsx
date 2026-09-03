'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ZigzagLine, CornerDotSquare, ConcentricArches } from '@/components/GeometricShapes'

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
const TOOL_SHORT: Record<Tool, string> = { arb: 'Arbitrage', lp: 'LP Scanner', pulse: 'Pulse' }

function Cell({ tool, data, flashToken }: { tool: Tool; data: ArbCell | LpCell | PulseCell; flashToken: number }) {
  return (
    <Link
      href={TOOL_LINK[tool]}
      aria-label={`Open ${TOOL_LABEL[tool]}`}
      className="dl-cell group relative rounded-xl px-4 py-3.5 min-w-0 overflow-hidden bg-white border-2 border-black shadow-pop"
      style={{ ['--tc' as any]: TC[tool] }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, ${TC[tool]}, transparent 75%)` }}
      />
      {flashToken > 0 && (
        <span key={flashToken} className="cell-ring" style={{ ['--tc' as any]: TC[tool] }} aria-hidden="true" />
      )}
      {renderCell(tool, data)}
      <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-ink-faint transition-all duration-200 group-hover:text-black group-hover:gap-2">
        Open {TOOL_SHORT[tool]} <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  )
}

export function DecisionLabStrip() {
  const [top, setTop] = useState<LiveOpportunities>(() => mockTop())
  const [flash, setFlash] = useState({ arb: 0, lp: 0, pulse: 0 })
  const [age, setAge] = useState(0)
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
      setAge(0)
    }

    if (!USE_MOCK) tick()
    const ageTimer = setInterval(() => setAge((x) => x + 1), 1000)
    const liveTimer = setInterval(tick, 3800)
    return () => { mounted = false; clearInterval(ageTimer); clearInterval(liveTimer) }
  }, [])

  return (
    <section className="relative border-b border-surface-border overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.85]" aria-hidden="true">
        <ZigzagLine width={2000} height={40} color="#D9F24B" className="absolute -top-1 left-0" />
        <CornerDotSquare size={70} color="#29C5F6" dotColor="#FF00B8" className="absolute -left-3 bottom-2 rotate-6" />
        <ConcentricArches size={150} colors={['#FF00B8', '#FF6B00', '#FF00B8']} className="absolute -right-8 -bottom-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10 flex flex-col gap-5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="heading-chip bg-neon-lime" aria-hidden="true" />
          <h2 className="font-display font-bold text-[28px] text-black">The Decision Lab</h2>
          <span className="ml-auto flex items-center gap-2 bg-white border-2 border-black rounded-full px-3 py-1 shadow-pop-sm">
            <span className="live-dot" aria-hidden="true" />
            <span className="text-[10px] font-bold tracking-[0.18em] text-black">LIVE</span>
            <span className="text-[11px] tabular-nums text-ink-faint inline-block min-w-[92px]">updated {age}s ago</span>
          </span>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
            <Cell tool="arb" data={top.arb} flashToken={flash.arb} />
            <Cell tool="lp" data={top.lp} flashToken={flash.lp} />
            <Cell tool="pulse" data={top.pulse} flashToken={flash.pulse} />
          </div>
          <Link href="/tools"
            className="group/cta flex flex-col items-center justify-center gap-1 bg-neon-lime text-black font-display font-bold text-sm px-5 py-3 rounded-xl border-2 border-black shadow-pop hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-pop-lg active:translate-x-0 active:translate-y-0 active:shadow-pop-sm focus-visible:outline-black transition-all whitespace-nowrap self-stretch md:min-w-[170px]">
            <span className="inline-flex items-center gap-2 text-[15px]">Open the tools <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-1" /></span>
            <span className="text-[10px] font-body font-semibold text-black/60">3 free tools · no signup</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
