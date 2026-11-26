'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Plus,
  Trash2,
  ShieldAlert,
  Calculator,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Link2,
  ClipboardCopy,
  Check,
} from 'lucide-react';
import { ToolShareBar } from '@/components/ToolShareBar';
import { TrackedLink } from '@/components/TrackedLink';
import { SITE_URL } from '@/lib/seo-utils';

type LegOutcome = 'win' | 'dnp' | 'loss';
type FeeMode = 'taker' | 'maker' | 'none';

interface ComboLeg {
  id: number;
  label: string;
  entryCents: number; // 1 - 99
  outcome: LegOutcome;
  scalarCents: number; // 1 - 99 (used when outcome === 'dnp')
}

const DEFAULT_LEGS: ComboLeg[] = [
  { id: 1, label: 'Leg 1 · Player 25+ Pts', entryCents: 55, outcome: 'dnp', scalarCents: 25 },
  { id: 2, label: 'Leg 2 · Home Team Wins', entryCents: 60, outcome: 'win', scalarCents: 60 },
  { id: 3, label: 'Leg 3 · Game Total Over', entryCents: 50, outcome: 'win', scalarCents: 50 },
];

const PRESETS: { name: string; tag: string; stake: number; legs: ComboLeg[] }[] = [
  {
    name: 'Blue Arrow DNP Haircut',
    tag: 'Most Popular',
    stake: 100,
    legs: [
      { id: 1, label: 'Leg 1 · Star Player 25+ Pts (DNP)', entryCents: 55, outcome: 'dnp', scalarCents: 25 },
      { id: 2, label: 'Leg 2 · Home Team Wins', entryCents: 60, outcome: 'win', scalarCents: 60 },
      { id: 3, label: 'Leg 3 · Game Total Over', entryCents: 50, outcome: 'win', scalarCents: 50 },
    ],
  },
  {
    name: 'Clean 3-Leg Combo Win',
    tag: 'Standard',
    stake: 100,
    legs: [
      { id: 1, label: 'Leg 1 · Fed Holds Rates', entryCents: 72, outcome: 'win', scalarCents: 72 },
      { id: 2, label: 'Leg 2 · CPI Below 3.0%', entryCents: 58, outcome: 'win', scalarCents: 58 },
      { id: 3, label: 'Leg 3 · S&P Closes Green', entryCents: 54, outcome: 'win', scalarCents: 54 },
    ],
  },
  {
    name: 'Late Injury Scalar Loss',
    tag: 'Warning Case',
    stake: 100,
    legs: [
      { id: 1, label: 'Leg 1 · QB 250+ Pass Yds (Halted)', entryCents: 50, outcome: 'dnp', scalarCents: 10 },
      { id: 2, label: 'Leg 2 · Favorite Covers', entryCents: 52, outcome: 'win', scalarCents: 52 },
      { id: 3, label: 'Leg 3 · Over 46.5 Points', entryCents: 50, outcome: 'win', scalarCents: 50 },
    ],
  },
];

function ceilCent(val: number): number {
  if (val <= 0) return 0;
  // Eliminate IEEE-754 noise like 1.7500000000000002 rounding to 1.76
  const clean = Math.round(val * 1e8) / 1e8;
  return Math.ceil(clean * 100) / 100;
}

function fmtUsd(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtSignedUsd(n: number): string {
  if (Math.abs(n) < 0.005) return '$0.00';
  return `${n > 0 ? '+' : '-'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function KalshiComboCalculatorPage() {
  const [legs, setLegs] = useState<ComboLeg[]>(DEFAULT_LEGS);
  const [stakeInput, setStakeInput] = useState<string>('100');
  const [feeMode, setFeeMode] = useState<FeeMode>('taker');
  const [useCustomQuote, setUseCustomQuote] = useState<boolean>(false);
  const [customQuoteCents, setCustomQuoteCents] = useState<string>('17');
  const [trueHitPct, setTrueHitPct] = useState<number>(22);
  const [bankrollInput, setBankrollInput] = useState<string>('2000');
  const [copiedMode, setCopiedMode] = useState<'link' | 'receipt' | null>(null);

  // Hydrate scenario from URL query params (?stake=100&fee=taker&legs=55:dnp:25,60:win:60,50:win:50&q=17)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('stake');
      if (s && Number(s) > 0) setStakeInput(String(Math.min(100000, Math.max(1, Number(s)))));
      const f = sp.get('fee');
      if (f === 'taker' || f === 'maker' || f === 'none') setFeeMode(f);
      const q = sp.get('q');
      if (q && Number(q) >= 1 && Number(q) <= 99) {
        setUseCustomQuote(true);
        setCustomQuoteCents(String(Math.round(Number(q))));
      }
      const legsParam = sp.get('legs');
      if (legsParam) {
        const parsed = legsParam
          .split(',')
          .slice(0, 5)
          .map((seg, i): ComboLeg | null => {
            const [eStr, outStr, scStr] = seg.split(':');
            const entry = Math.min(99, Math.max(1, Number(eStr) || 50));
            const outcome: LegOutcome = outStr === 'dnp' || outStr === 'loss' ? outStr : 'win';
            const scalar = Math.min(99, Math.max(1, Number(scStr) || entry));
            return {
              id: i + 1,
              label: `Leg ${i + 1} · ${outcome === 'dnp' ? 'Blue Arrow / DNP' : outcome === 'loss' ? 'Lost Leg' : 'Winning Leg'}`,
              entryCents: entry,
              outcome,
              scalarCents: scalar,
            };
          })
          .filter((x): x is ComboLeg => x !== null);
        if (parsed.length >= 2) setLegs(parsed);
      }
    } catch {
      // ignore invalid query strings
    }
  }, []);

  const buildShareUrl = () => {
    const sp = new URLSearchParams();
    sp.set('stake', String(Math.max(1, Number(stakeInput) || 100)));
    sp.set('fee', feeMode);
    sp.set('legs', legs.map((l) => `${l.entryCents}:${l.outcome}:${l.scalarCents}`).join(','));
    if (useCustomQuote) sp.set('q', String(Math.min(99, Math.max(1, Number(customQuoteCents) || 1))));
    return `${SITE_URL}/tools/kalshi-combo-calculator?${sp.toString()}`;
  };

  const copyScenarioLink = async () => {
    const url = buildShareUrl();
    window.history.replaceState(null, '', `?${url.split('?')[1]}`);
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedMode('link');
    setTimeout(() => setCopiedMode(null), 1800);
  };

  const copyTradeReceipt = async () => {
    const url = buildShareUrl();
    const legLines = legs
      .map(
        (l, i) =>
          `  ${i + 1}. ${l.label} (${l.entryCents}¢) → ${
            l.outcome === 'dnp' ? `Blue Arrow Scalar @ ${l.scalarCents}¢` : l.outcome === 'win' ? 'WIN ($1.00)' : 'LOSS ($0.00)'
          }`
      )
      .join('\n');
    const receipt = [
      `Kalshi ${legs.length}-Leg Combo Breakdown (${calc.contracts} contracts @ ${Math.round(calc.rawComboPrice * 100)}¢)`,
      legLines,
      `Cost + Fee (${feeMode}): ${fmtUsd(calc.totalOutlay)} | Payout: ${fmtUsd(calc.scenarioGross)} (${fmtSignedUsd(calc.scenarioNet)})`,
      calc.hasDnp && !calc.hasLoss
        ? `Sportsbook Void Payout would be ${fmtUsd(calc.sportsbookGross)} (${fmtSignedUsd(calc.blueArrowDiff)} diff)`
        : `All-Win Payout: ${fmtUsd(calc.fullWinGross)}`,
      `Interactive simulator: ${url}`,
    ].join('\n');
    await navigator.clipboard.writeText(receipt).catch(() => {});
    setCopiedMode('receipt');
    setTimeout(() => setCopiedMode(null), 1800);
  };

  const addLeg = () => {
    if (legs.length >= 5) return;
    const nextId = Math.max(0, ...legs.map((l) => l.id)) + 1;
    setLegs([
      ...legs,
      {
        id: nextId,
        label: `Leg ${legs.length + 1} · Event Outcome`,
        entryCents: 50,
        outcome: 'win',
        scalarCents: 50,
      },
    ]);
  };

  const removeLeg = (id: number) => {
    if (legs.length <= 2) return;
    setLegs(legs.filter((l) => l.id !== id));
  };

  const updateLeg = (id: number, patch: Partial<ComboLeg>) => {
    setLegs(legs.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setLegs(preset.legs.map((l) => ({ ...l })));
    setStakeInput(String(preset.stake));
    setUseCustomQuote(false);
  };

  const calc = useMemo(() => {
    const stake = Math.max(1, Number(stakeInput) || 0);

    // Theoretical independent combo probability (product of leg entry prices)
    const independentProb = legs.reduce((acc, l) => acc * (Math.min(99, Math.max(1, l.entryCents)) / 100), 1);
    const rawComboPrice = useCustomQuote
      ? Math.min(0.99, Math.max(0.01, (Number(customQuoteCents) || 1) / 100))
      : Math.min(0.99, Math.max(0.01, Math.round(independentProb * 100) / 100));

    // Integer contracts bought with the stake
    const contracts = Math.max(1, Math.floor(stake / rawComboPrice));
    const actualCost = contracts * rawComboPrice;

    // Kalshi quadratic fee: ceil_cent(rate * C * P * (1 - P))
    const feeRate = feeMode === 'taker' ? 0.07 : feeMode === 'maker' ? 0.0175 : 0;
    const fee = ceilCent(feeRate * contracts * rawComboPrice * (1 - rawComboPrice));
    const totalOutlay = actualCost + fee;

    // Scenario A: All legs win ($1.00 per contract)
    const fullWinGross = contracts * 1.0;
    const fullWinNet = fullWinGross - totalOutlay;
    const fullWinRoi = totalOutlay > 0 ? (fullWinNet / totalOutlay) * 100 : 0;

    // Scenario B: Current selected outcomes (with Blue Arrow / DNP scalar product formula)
    const payoutPerContract = legs.reduce((acc, l) => {
      if (l.outcome === 'loss') return 0;
      if (l.outcome === 'dnp') return acc * (Math.min(99, Math.max(1, l.scalarCents)) / 100);
      return acc * 1.0;
    }, 1);

    const scenarioGross = contracts * payoutPerContract;
    const scenarioNet = scenarioGross - totalOutlay;
    const scenarioRoi = totalOutlay > 0 ? (scenarioNet / totalOutlay) * 100 : 0;

    // Scenario C: Traditional Sportsbook Parlay Void comparison
    // On a sportsbook, a DNP leg is removed from the parlay and remaining legs pay out at their combined odds.
    const hasLoss = legs.some((l) => l.outcome === 'loss');
    const hasDnp = legs.some((l) => l.outcome === 'dnp');
    const activeWinningLegs = legs.filter((l) => l.outcome === 'win');
    let sportsbookGross = 0;
    if (hasLoss) {
      sportsbookGross = 0;
    } else if (activeWinningLegs.length === 0) {
      // Every leg voided -> stake refunded
      sportsbookGross = actualCost;
    } else {
      const remainingProb = activeWinningLegs.reduce(
        (acc, l) => acc * (Math.min(99, Math.max(1, l.entryCents)) / 100),
        1
      );
      sportsbookGross = actualCost / remainingProb;
    }
    const sportsbookNet = sportsbookGross - actualCost;
    const blueArrowDiff = scenarioGross - sportsbookGross;

    const impliedMultiplier = rawComboPrice > 0 ? 1 / rawComboPrice : 0;

    // Pro Quant: Combo Net EV & Half-Kelly Sizing (using all-win payout net of exact fee)
    const pTrue = Math.min(0.99, Math.max(0.01, trueHitPct / 100));
    const effectiveCost = Math.min(0.999, Math.max(0.001, totalOutlay / contracts));
    const comboEvUsd = pTrue * fullWinGross - totalOutlay;
    const bOdds = (1 - effectiveCost) / effectiveCost;
    const fullKelly = bOdds > 0 ? Math.max(0, (bOdds * pTrue - (1 - pTrue)) / bOdds) : 0;
    const halfKelly = fullKelly / 2;
    const quarterKelly = fullKelly / 4;
    const bankroll = Math.max(0, Number(bankrollInput) || 0);

    return {
      independentProb,
      rawComboPrice,
      contracts,
      actualCost,
      fee,
      totalOutlay,
      fullWinGross,
      fullWinNet,
      fullWinRoi,
      payoutPerContract,
      scenarioGross,
      scenarioNet,
      scenarioRoi,
      hasLoss,
      hasDnp,
      sportsbookGross,
      sportsbookNet,
      blueArrowDiff,
      impliedMultiplier,
      comboEvUsd,
      halfKellyPct: halfKelly * 100,
      quarterKellyPct: quarterKelly * 100,
      halfKellyUsd: bankroll * halfKelly,
      quarterKellyUsd: bankroll * quarterKelly,
    };
  }, [legs, stakeInput, feeMode, useCustomQuote, customQuoteCents, trueHitPct, bankrollInput]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-5">
        <Link href="/" className="hover:text-black hover:underline transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <Link href="/tools" className="hover:text-black hover:underline transition-colors">
          Tools
        </Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <span className="text-black font-bold">Kalshi Combo Calculator</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFE642] text-black border-2 border-black shadow-pop-sm">
            FREE CALCULATOR
          </span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#29C5F6] text-black border-2 border-black shadow-pop-sm">
            BLUE ARROW / DNP SIMULATOR
          </span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
          Kalshi Combo Payout &amp; Blue Arrow Simulator
        </h1>
        <p className="text-base sm:text-lg text-black/85 font-medium mt-3 max-w-3xl leading-relaxed">
          Calculate multi-leg Kalshi combo payouts, exact fees, and see how a{' '}
          <strong>Blue Arrow / Blue Shield (DNP) scalar settlement</strong> impacts your return compared to a
          traditional sportsbook parlay void.
        </p>
        <ToolShareBar
          url={`${SITE_URL}/tools/kalshi-combo-calculator`}
          title="Free Kalshi Combo Payout & Blue Arrow (DNP) Simulator — calculate exact combo payouts before you trade"
        />
      </header>

      {/* Quick Presets */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-black/75 mr-1">
          Load scenario:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-black shadow-pop-sm text-xs font-bold text-ink hover:bg-[#FFE642] hover:-translate-y-0.5 transition-all"
          >
            <span>{p.name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10 text-black/80">{p.tag}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setLegs(DEFAULT_LEGS);
            setStakeInput('100');
            setFeeMode('taker');
            setUseCustomQuote(false);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-black/10 border border-black/30 text-xs font-semibold text-black hover:bg-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Main 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Combo Builder */}
        <section className="lg:col-span-7 bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 pb-3 border-b-2 border-black/10">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-black" />
              <h2 className="font-display font-bold text-lg text-ink">1. Build Your Combo ({legs.length} Legs)</h2>
            </div>
            <button
              type="button"
              onClick={addLeg}
              disabled={legs.length >= 5}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C6F23A] border-2 border-black shadow-pop-sm text-xs font-bold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Leg
            </button>
          </div>

          {/* Leg rows */}
          <div className="space-y-4">
            {legs.map((leg, idx) => (
              <div
                key={leg.id}
                className={`rounded-xl border-2 border-black p-4 transition-colors ${
                  leg.outcome === 'dnp'
                    ? 'bg-[#E6F7FF]'
                    : leg.outcome === 'loss'
                    ? 'bg-[#FFEAEA]'
                    : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <input
                    type="text"
                    value={leg.label}
                    onChange={(e) => updateLeg(leg.id, { label: e.target.value })}
                    aria-label={`Leg ${idx + 1} name`}
                    className="flex-1 min-w-0 font-display font-bold text-sm text-ink bg-transparent border-b border-dashed border-black/30 focus:border-black focus:outline-none pb-0.5"
                  />
                  {legs.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeLeg(leg.id)}
                      aria-label={`Remove leg ${idx + 1}`}
                      className="p-1.5 rounded-lg text-black/60 hover:text-black hover:bg-black/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Entry price slider */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary mb-1">
                    <span>Leg Entry Price (Implied Prob.)</span>
                    <span className="font-mono font-bold text-black bg-[#FFF7E6] border border-black/30 rounded px-2 py-0.5">
                      {leg.entryCents}¢ ({leg.entryCents}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={95}
                    step={1}
                    value={leg.entryCents}
                    onChange={(e) => updateLeg(leg.id, { entryCents: Number(e.target.value) })}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                {/* Outcome selector */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => updateLeg(leg.id, { outcome: 'win' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border-2 text-xs font-bold transition-all ${
                      leg.outcome === 'win'
                        ? 'bg-[#2BD96E] border-black text-black shadow-pop-sm'
                        : 'bg-white border-black/25 text-ink-secondary hover:border-black'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Win ($1)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLeg(leg.id, { outcome: 'dnp' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border-2 text-xs font-bold transition-all ${
                      leg.outcome === 'dnp'
                        ? 'bg-[#29C5F6] border-black text-black shadow-pop-sm'
                        : 'bg-white border-black/25 text-ink-secondary hover:border-black'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" /> Blue Arrow
                  </button>
                  <button
                    type="button"
                    onClick={() => updateLeg(leg.id, { outcome: 'loss' })}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border-2 text-xs font-bold transition-all ${
                      leg.outcome === 'loss'
                        ? 'bg-[#FF6B6B] border-black text-black shadow-pop-sm'
                        : 'bg-white border-black/25 text-ink-secondary hover:border-black'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" /> Loss ($0)
                  </button>
                </div>

                {/* Scalar slider when Blue Arrow / DNP selected */}
                {leg.outcome === 'dnp' && (
                  <div className="mt-3 pt-3 border-t border-black/15">
                    <div className="flex items-center justify-between text-xs font-bold text-black mb-1">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Scalar Settlement Value
                      </span>
                      <span className="font-mono bg-[#29C5F6] border border-black rounded px-2 py-0.5">
                        ${(leg.scalarCents / 100).toFixed(2)} ({leg.scalarCents}¢)
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={99}
                      step={1}
                      value={leg.scalarCents}
                      onChange={(e) => updateLeg(leg.id, { scalarCents: Number(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                    <p className="text-[11px] text-black/75 mt-1 leading-snug">
                      Kalshi settles a Blue Arrow / DNP leg at an intermediate price rather than voiding it to $1.00.
                      Slide lower to test a late injury or halted-market haircut.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stake, Quote Override & Fee Controls */}
          <div className="pt-4 border-t-2 border-black/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="combo-stake" className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                Your Stake (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-black">$</span>
                <input
                  id="combo-stake"
                  type="number"
                  min={1}
                  max={100000}
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white border-2 border-black font-mono font-bold text-sm text-ink focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[25, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setStakeInput(String(amt))}
                    className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-black/5 border border-black/25 hover:bg-[#FFE642] hover:border-black transition-colors"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                Kalshi Order Fee
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'taker', label: 'Taker' },
                    { id: 'maker', label: 'Maker' },
                    { id: 'none', label: 'No Fee' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFeeMode(m.id)}
                    className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                      feeMode === m.id
                        ? 'bg-black text-[#FFE642] border-black'
                        : 'bg-white text-ink border-black/30 hover:border-black'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-ink-muted mt-1.5">
                Applies Kalshi&apos;s exact quadratic fee on the combo contract price.
              </p>
            </div>
          </div>

          {/* Optional RFQ / Correlated Combo Price Override */}
          <div className="rounded-xl bg-[#FFF7E6] border border-black/25 p-3.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-xs font-bold text-ink">
                Override combo quote price?{' '}
                <span className="font-normal text-ink-secondary">
                  (Useful for correlated sports combos quoted on Kalshi RFQ)
                </span>
              </span>
              <input
                type="checkbox"
                checked={useCustomQuote}
                onChange={(e) => {
                  setUseCustomQuote(e.target.checked);
                  if (e.target.checked) {
                    setCustomQuoteCents(String(Math.max(1, Math.round(calc.independentProb * 100))));
                  }
                }}
                className="w-4 h-4 accent-black shrink-0"
              />
            </label>
            {useCustomQuote && (
              <div className="mt-3 flex items-center gap-3">
                <label htmlFor="custom-quote" className="text-xs font-mono font-bold text-black">
                  Actual Kalshi Quote:
                </label>
                <div className="relative w-24">
                  <input
                    id="custom-quote"
                    type="number"
                    min={1}
                    max={99}
                    value={customQuoteCents}
                    onChange={(e) => setCustomQuoteCents(e.target.value)}
                    className="w-full pr-6 pl-2.5 py-1 rounded-lg bg-white border-2 border-black font-mono font-bold text-sm"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold">¢</span>
                </div>
                <span className="text-[11px] text-ink-muted">
                  (Independent price: {(calc.independentProb * 100).toFixed(1)}¢)
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Right: Live Payout & Blue Arrow Impact Panel */}
        <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          {/* Primary Result Card */}
          <div className="bg-white border-2 border-black rounded-2xl shadow-pop p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b-2 border-black/10">
              <h2 className="font-display font-bold text-lg text-ink">2. Simulated Payout</h2>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-black text-[#FFE642]">
                {calc.contracts.toLocaleString()} contracts @ {Math.round(calc.rawComboPrice * 100)}¢
              </span>
            </div>

            {/* Big KPI */}
            <div
              className={`rounded-xl border-2 border-black p-4 mb-4 ${
                calc.scenarioNet > 0
                  ? 'bg-[#C6F23A]'
                  : calc.scenarioNet < 0
                  ? 'bg-[#FFE2E2]'
                  : 'bg-[#FFF7E6]'
              }`}
            >
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-black/75">
                {calc.hasLoss
                  ? 'Combo Lost ($0.00 / contract)'
                  : calc.hasDnp
                  ? 'Kalshi Scalar-Adjusted Payout'
                  : 'Full Combo Win Payout'}
              </p>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-black">
                  {fmtUsd(calc.scenarioGross)}
                </span>
                <span className="font-mono font-bold text-sm px-2 py-0.5 rounded bg-white border border-black text-black">
                  {fmtSignedUsd(calc.scenarioNet)} ({calc.scenarioRoi >= 0 ? '+' : ''}
                  {calc.scenarioRoi.toFixed(1)}%)
                </span>
              </div>
              <p className="text-xs font-semibold text-black/80 mt-2">
                Payout per contract: <strong className="font-mono">${calc.payoutPerContract.toFixed(4)}</strong> (vs.{' '}
                <span className="font-mono">$1.00</span> full win)
              </p>
            </div>

            {/* Cost Breakdown */}
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="text-ink-secondary">Combo Implied Odds</dt>
                <dd className="font-mono font-bold text-ink">
                  {(calc.rawComboPrice * 100).toFixed(1)}% ({calc.impliedMultiplier.toFixed(2)}×)
                </dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="text-ink-secondary">Contract Cost ({calc.contracts} × {Math.round(calc.rawComboPrice * 100)}¢)</dt>
                <dd className="font-mono font-bold text-ink">{fmtUsd(calc.actualCost)}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="text-ink-secondary">Est. Kalshi Fee ({feeMode})</dt>
                <dd className="font-mono font-bold text-ink">{fmtUsd(calc.fee)}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="font-bold text-ink">Total Outlay</dt>
                <dd className="font-mono font-extrabold text-ink">{fmtUsd(calc.totalOutlay)}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="text-ink-secondary">If All Legs Won Cleanly</dt>
                <dd className="font-mono font-bold text-ink">
                  {fmtUsd(calc.fullWinGross)}{' '}
                  <span className="text-xs text-ink-muted">({fmtSignedUsd(calc.fullWinNet)})</span>
                </dd>
              </div>
            </dl>

            {/* Shareable Scenario URL & X/Reddit Receipt */}
            <div className="mt-4 pt-4 border-t-2 border-black/10 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyScenarioLink}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#FFF7E6] border-2 border-black text-xs font-bold text-black hover:bg-[#FFE642] transition-colors"
              >
                {copiedMode === 'link' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                {copiedMode === 'link' ? 'Link Copied!' : 'Copy Scenario URL'}
              </button>
              <button
                type="button"
                onClick={copyTradeReceipt}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black text-[#C6F23A] border-2 border-black text-xs font-bold hover:bg-black/85 transition-colors"
              >
                {copiedMode === 'receipt' ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                {copiedMode === 'receipt' ? 'Copied Receipt!' : 'Copy X/Reddit Receipt'}
              </button>
            </div>
          </div>

          {/* Blue Arrow vs Sportsbook Void Alert Box */}
          {calc.hasDnp && !calc.hasLoss && (
            <div className="bg-[#29C5F6] border-2 border-black rounded-2xl shadow-pop p-5 text-black">
              <div className="flex items-start gap-2.5 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-bold text-base leading-snug">
                    Blue Arrow Impact vs. Sportsbook Void
                  </h3>
                  <p className="text-xs font-medium text-black/85 mt-1 leading-relaxed">
                    A traditional sportsbook voids a DNP leg and pays the remaining winning legs at their standalone odds.
                    Kalshi multiplies your payout by the scalar settlement price instead:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <div className="bg-white rounded-xl border-2 border-black p-3">
                  <span className="block text-[10px] font-mono font-bold uppercase text-black/60">
                    Sportsbook Void
                  </span>
                  <span className="font-display font-extrabold text-xl text-black">
                    {fmtUsd(calc.sportsbookGross)}
                  </span>
                </div>
                <div className="bg-[#FFE642] rounded-xl border-2 border-black p-3">
                  <span className="block text-[10px] font-mono font-bold uppercase text-black/70">
                    Kalshi Scalar Payout
                  </span>
                  <span className="font-display font-extrabold text-xl text-black">
                    {fmtUsd(calc.scenarioGross)}
                  </span>
                </div>
              </div>

              <p className="mt-3 text-xs font-bold bg-black text-white rounded-lg px-3 py-2 font-mono">
                Difference: {fmtSignedUsd(calc.blueArrowDiff)}{' '}
                {calc.blueArrowDiff < 0 ? 'less than a sportsbook void' : 'vs. a sportsbook void'}
              </p>
            </div>
          )}

          {/* Pro Quant: +EV & Kelly Sizing */}
          <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm text-ink">
                Pro Mode: Combo +EV &amp; Kelly Sizing
              </h3>
              <span
                className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-black ${
                  calc.comboEvUsd > 0 ? 'bg-[#C6F23A] text-black' : 'bg-[#FFE2E2] text-black'
                }`}
              >
                {calc.comboEvUsd > 0 ? '+EV COMBO' : '-EV COMBO'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-ink-secondary">Your True Hit %</span>
                  <span className="font-mono font-bold text-black">{trueHitPct}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={95}
                  value={trueHitPct}
                  onChange={(e) => setTrueHitPct(Number(e.target.value))}
                  aria-label="Your estimated true combo hit probability"
                  className="w-full accent-black cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="combo-bankroll" className="block text-[11px] font-semibold text-ink-secondary mb-1">
                  Bankroll ($)
                </label>
                <input
                  id="combo-bankroll"
                  type="number"
                  min={10}
                  max={10000000}
                  value={bankrollInput}
                  onChange={(e) => setBankrollInput(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-white border-2 border-black font-mono font-bold text-xs text-ink"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`rounded-xl border-2 border-black p-2 ${calc.comboEvUsd > 0 ? 'bg-[#C6F23A]/40' : 'bg-[#FFE2E2]/60'}`}>
                <span className="block text-[9px] font-mono font-bold uppercase text-black/70">Net EV</span>
                <span className="block font-display font-extrabold text-sm text-black">
                  {fmtSignedUsd(calc.comboEvUsd)}
                </span>
              </div>
              <div className="rounded-xl border-2 border-black bg-white p-2">
                <span className="block text-[9px] font-mono font-bold uppercase text-black/70">Half-Kelly</span>
                <span className="block font-display font-extrabold text-sm text-black">
                  {fmtUsd(calc.halfKellyUsd)}
                </span>
                <span className="block text-[9px] font-mono text-ink-muted">{calc.halfKellyPct.toFixed(1)}%</span>
              </div>
              <div className="rounded-xl border-2 border-black bg-white p-2">
                <span className="block text-[9px] font-mono font-bold uppercase text-black/70">Quarter-Kelly</span>
                <span className="block font-display font-extrabold text-sm text-black">
                  {fmtUsd(calc.quarterKellyUsd)}
                </span>
                <span className="block text-[9px] font-mono text-ink-muted">{calc.quarterKellyPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Contextual Guides & Platform CTA */}
          <div className="bg-[#FFF7E6] border-2 border-black rounded-2xl shadow-pop-sm p-5 space-y-3">
            <h3 className="font-display font-bold text-sm text-ink">Related Kalshi Guides &amp; Tools</h3>
            <div className="space-y-2">
              <Link
                href="/platform-reviews/what-a-blue-arrow-really-means-on-kalshi-and-why-its-a-problem"
                className="flex items-center justify-between gap-2 text-xs font-bold text-ink hover:text-brand-orange transition-colors"
              >
                <span>What a Blue Arrow / Shield Really Means on Kalshi</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
              <Link
                href="/platform-reviews/how-do-kalshi-combos-work-the-complete-guide-to-kalshi-combo-bets-parlays-rules-"
                className="flex items-center justify-between gap-2 text-xs font-bold text-ink hover:text-brand-orange transition-colors"
              >
                <span>Complete Guide to Kalshi Combos &amp; Parlay Rules</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
              <Link
                href="/tools/kalshi-fee-calculator"
                className="flex items-center justify-between gap-2 text-xs font-bold text-ink hover:text-brand-orange transition-colors"
              >
                <span>Kalshi vs. Polymarket Fee &amp; Break-Even Calculator</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
            <div className="pt-2 border-t border-black/15 flex flex-wrap gap-2">
              <TrackedLink
                platform="kalshi"
                ctx="combo-calculator"
                className="flex-1 text-center px-3 py-2 rounded-xl bg-black text-[#FFE642] font-display font-bold text-xs hover:bg-black/85 transition-colors"
              >
                Explore Kalshi →
              </TrackedLink>
              <Link
                href="/kalshi-smart-money"
                className="flex-1 text-center px-3 py-2 rounded-xl bg-white border-2 border-black text-black font-display font-bold text-xs hover:bg-[#C6F23A] transition-colors"
              >
                Kalshi Smart Money
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Educational Formula & FAQ Section */}
      <section className="mt-10 bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="font-display font-bold text-2xl text-ink mb-2">
            How the Kalshi Combo &amp; Blue Arrow Formula Works
          </h2>
          <p className="text-sm text-ink-secondary leading-relaxed max-w-3xl">
            Every Kalshi combo settles as the product of its individual leg settlement prices. When all legs win,
            <span className="font-mono font-semibold text-ink"> $1.00 × $1.00 × $1.00 = $1.00</span> per contract.
            If any single leg loses (<span className="font-mono font-semibold text-ink">$0.00</span>), the entire combo settles at{' '}
            <span className="font-mono font-semibold text-ink">$0.00</span>. When a leg triggers a{' '}
            <strong>Blue Arrow / Blue Shield</strong> (such as a DNP or intermediate scalar resolution at e.g.{' '}
            <span className="font-mono font-semibold text-ink">$0.25</span>), the payout becomes{' '}
            <span className="font-mono font-semibold text-ink">$0.25 × $1.00 × $1.00 = $0.25</span> per contract —
            which can dramatically reduce your payout compared to a sportsbook that voids the leg.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border-2 border-black p-4">
            <h3 className="font-display font-bold text-sm text-ink mb-1.5">Why does my combo quote differ?</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Correlated legs (like a team winning and its star scoring 25+ points) are priced higher on Kalshi&apos;s RFQ
              book than multiplying independent probabilities. Toggle &ldquo;Override combo quote price&rdquo; above to plug in the exact quote you see in the Kalshi app.
            </p>
          </div>
          <div className="rounded-xl bg-white border-2 border-black p-4">
            <h3 className="font-display font-bold text-sm text-ink mb-1.5">Can I cancel or cash out early?</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              You cannot cancel a filled combo order, only sell it back into the order book if bids exist. Read our{' '}
              <Link
                href="/platform-reviews/kalshi-combos-cancel-cash-out-early-rules-fees-and-exit-guide"
                className="underline font-bold text-ink"
              >
                Kalshi Combos Exit &amp; Cash-Out Guide
              </Link>{' '}
              for full details.
            </p>
          </div>
          <div className="rounded-xl bg-white border-2 border-black p-4">
            <h3 className="font-display font-bold text-sm text-ink mb-1.5">100% client-side &amp; free</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              All calculations run instantly in your browser with zero signup. Informational and educational estimates
              only — always check Kalshi&apos;s official contract rules before placing a trade.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
