'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Percent,
  ArrowRight,
  ExternalLink,
  Scale,
  TrendingUp,
  Link2,
  ClipboardCopy,
  Check,
} from 'lucide-react';
import { ToolShareBar } from '@/components/ToolShareBar';
import { TrackedLink } from '@/components/TrackedLink';
import { SITE_URL } from '@/lib/seo-utils';

type SizeMode = 'contracts' | 'dollars';
type OrderTier = 'taker' | 'maker' | 'index_taker';

const TIER_RATES: Record<OrderTier, { label: string; rate: number; badge: string }> = {
  taker: { label: 'Standard Taker', rate: 0.07, badge: '7.0% × P(1−P)' },
  maker: { label: 'Standard Maker', rate: 0.0175, badge: '1.75% × P(1−P)' },
  index_taker: { label: 'Index Market Taker', rate: 0.035, badge: '3.5% × P(1−P)' },
};

const CURVE_PRICES = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95];

function ceilCent(val: number): number {
  if (val <= 0) return 0;
  const clean = Math.round(val * 1e8) / 1e8;
  return Math.ceil(clean * 100) / 100;
}

function fmtUsd(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function KalshiFeeCalculatorPage() {
  const [priceCents, setPriceCents] = useState<number>(50);
  const [sizeMode, setSizeMode] = useState<SizeMode>('contracts');
  const [contractsInput, setContractsInput] = useState<string>('500');
  const [dollarsInput, setDollarsInput] = useState<string>('250');
  const [tier, setTier] = useState<OrderTier>('taker');
  const [roundTrip, setRoundTrip] = useState<boolean>(false);
  const [trueProbPct, setTrueProbPct] = useState<number>(58);
  const [bankrollInput, setBankrollInput] = useState<string>('2000');
  const [copiedMode, setCopiedMode] = useState<'link' | 'receipt' | null>(null);

  // Hydrate scenario from URL query params (?price=50&mode=contracts&qty=500&tier=taker&rt=0)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const p = sp.get('price');
      if (p && Number(p) >= 1 && Number(p) <= 99) setPriceCents(Math.round(Number(p)));
      const m = sp.get('mode');
      const qty = sp.get('qty');
      if (m === 'dollars') {
        setSizeMode('dollars');
        if (qty && Number(qty) > 0) setDollarsInput(String(Math.min(1000000, Number(qty))));
      } else if (m === 'contracts') {
        setSizeMode('contracts');
        if (qty && Number(qty) > 0) setContractsInput(String(Math.min(1000000, Math.round(Number(qty)))));
      }
      const t = sp.get('tier');
      if (t === 'taker' || t === 'maker' || t === 'index_taker') setTier(t);
      const rt = sp.get('rt');
      if (rt === '1' || rt === 'true') setRoundTrip(true);
    } catch {
      // ignore invalid query strings
    }
  }, []);

  const buildShareUrl = () => {
    const sp = new URLSearchParams();
    sp.set('price', String(priceCents));
    sp.set('mode', sizeMode);
    sp.set('qty', sizeMode === 'contracts' ? contractsInput : dollarsInput);
    sp.set('tier', tier);
    if (roundTrip) sp.set('rt', '1');
    return `${SITE_URL}/tools/kalshi-fee-calculator?${sp.toString()}`;
  };

  const copyScenarioLink = async () => {
    const url = buildShareUrl();
    window.history.replaceState(null, '', `?${url.split('?')[1]}`);
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedMode('link');
    setTimeout(() => setCopiedMode(null), 1800);
  };

  const copyFeeReceipt = async () => {
    const url = buildShareUrl();
    const receipt = [
      `Kalshi vs. Polymarket Fee Breakdown (${calc.contracts.toLocaleString()} contracts @ ${priceCents}¢${roundTrip ? ', Round-Trip' : ''})`,
      `• Kalshi ${TIER_RATES[tier].label} Fee: ${fmtUsd(calc.totalFee)} (${calc.feePerContractCents.toFixed(2)}¢/contract) → Break-even: ${calc.breakEvenProb.toFixed(2)}%`,
      `• Kalshi Maker Fee: ${fmtUsd(calc.makerFee)} (saves ${fmtUsd(calc.makerSavings)} vs. Taker)`,
      `• Polymarket (0% fee): $0.00 (saves ${fmtUsd(calc.polySavings)} vs. Kalshi Taker)`,
      `Run your own trade: ${url}`,
    ].join('\n');
    await navigator.clipboard.writeText(receipt).catch(() => {});
    setCopiedMode('receipt');
    setTimeout(() => setCopiedMode(null), 1800);
  };

  const calc = useMemo(() => {
    const P = Math.min(0.99, Math.max(0.01, priceCents / 100));
    const contracts =
      sizeMode === 'contracts'
        ? Math.max(1, Math.floor(Number(contractsInput) || 1))
        : Math.max(1, Math.floor((Number(dollarsInput) || 1) / P));

    const notionalCost = contracts * P;
    const legsMultiplier = roundTrip ? 2 : 1;

    const selectedRate = TIER_RATES[tier].rate;
    const oneWayFee = ceilCent(selectedRate * contracts * P * (1 - P));
    const totalFee = oneWayFee * legsMultiplier;
    const feePerContractCents = (totalFee / contracts) * 100;
    const effectiveFeePct = notionalCost > 0 ? (totalFee / notionalCost) * 100 : 0;

    const totalOutlay = notionalCost + totalFee;
    const grossWinPayout = contracts * 1.0;
    const netProfitIfWin = grossWinPayout - totalOutlay;
    const netRoiIfWin = totalOutlay > 0 ? (netProfitIfWin / totalOutlay) * 100 : 0;
    const breakEvenProb = grossWinPayout > 0 ? (totalOutlay / grossWinPayout) * 100 : 0;
    const feeDragPctPts = breakEvenProb - priceCents;

    // Venue comparisons (same contract count & entry price)
    const takerFee = ceilCent(0.07 * contracts * P * (1 - P)) * legsMultiplier;
    const makerFee = ceilCent(0.0175 * contracts * P * (1 - P)) * legsMultiplier;
    const takerBreakEven = ((notionalCost + takerFee) / grossWinPayout) * 100;
    const makerBreakEven = ((notionalCost + makerFee) / grossWinPayout) * 100;
    const polyBreakEven = priceCents;

    // Pro Quant: Net Expected Value (+EV) & Kelly Optimal Position Sizing (net of exact fee)
    const pTrue = Math.min(0.99, Math.max(0.01, trueProbPct / 100));
    const effectiveCostPerContract = Math.min(0.999, Math.max(0.001, totalOutlay / contracts));
    const netEvUsd = pTrue * grossWinPayout - totalOutlay;
    const netEvPct = totalOutlay > 0 ? (netEvUsd / totalOutlay) * 100 : 0;
    const edgeVsBreakEven = trueProbPct - breakEvenProb;
    const bOdds = (1 - effectiveCostPerContract) / effectiveCostPerContract;
    const fullKelly = bOdds > 0 ? Math.max(0, (bOdds * pTrue - (1 - pTrue)) / bOdds) : 0;
    const halfKelly = fullKelly / 2;
    const quarterKelly = fullKelly / 4;
    const bankroll = Math.max(0, Number(bankrollInput) || 0);

    return {
      P,
      contracts,
      notionalCost,
      totalFee,
      feePerContractCents,
      effectiveFeePct,
      totalOutlay,
      grossWinPayout,
      netProfitIfWin,
      netRoiIfWin,
      breakEvenProb,
      feeDragPctPts,
      takerFee,
      makerFee,
      takerBreakEven,
      makerBreakEven,
      polyBreakEven,
      makerSavings: Math.max(0, takerFee - makerFee),
      polySavings: takerFee,
      netEvUsd,
      netEvPct,
      edgeVsBreakEven,
      halfKellyPct: halfKelly * 100,
      quarterKellyPct: quarterKelly * 100,
      halfKellyUsd: bankroll * halfKelly,
      quarterKellyUsd: bankroll * quarterKelly,
    };
  }, [priceCents, sizeMode, contractsInput, dollarsInput, tier, roundTrip, trueProbPct, bankrollInput]);

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
        <span className="text-black font-bold">Kalshi Fee Calculator</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#C6F23A] text-black border-2 border-black shadow-pop-sm">
            FREE CALCULATOR
          </span>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFE642] text-black border-2 border-black shadow-pop-sm">
            KALSHI VS. POLYMARKET
          </span>
        </div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight">
          Kalshi Fee &amp; Break-Even Calculator
        </h1>
        <p className="text-base sm:text-lg text-black/85 font-medium mt-3 max-w-3xl leading-relaxed">
          Calculate exact Kalshi taker and maker fees with Kalshi&apos;s quadratic formula, see your true break-even win
          probability, and compare dollar savings against 0%-fee venues like Polymarket.
        </p>
        <ToolShareBar
          url={`${SITE_URL}/tools/kalshi-fee-calculator`}
          title="Free Kalshi Fee & Break-Even Calculator — compare Kalshi Taker, Kalshi Maker & Polymarket 0% fees"
        />
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Controls */}
        <section className="lg:col-span-6 bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-5 sm:p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-black/10">
            <Percent className="w-5 h-5 text-black" />
            <h2 className="font-display font-bold text-lg text-ink">1. Enter Trade Details</h2>
          </div>

          {/* Contract Price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="contract-price" className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                Contract Price (YES or NO)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="contract-price"
                  type="number"
                  min={1}
                  max={99}
                  value={priceCents}
                  onChange={(e) => setPriceCents(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-16 text-right px-2 py-1 rounded-lg bg-white border-2 border-black font-mono font-bold text-sm"
                />
                <span className="font-mono font-bold text-sm text-black">¢</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={99}
              step={1}
              value={priceCents}
              onChange={(e) => setPriceCents(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10, 25, 50, 75, 90].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriceCents(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border-2 transition-colors ${
                    priceCents === p
                      ? 'bg-black text-[#FFE642] border-black'
                      : 'bg-white text-black border-black/25 hover:border-black'
                  }`}
                >
                  {p}¢
                </button>
              ))}
            </div>
          </div>

          {/* Size Mode + Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-black">Position Size</span>
              <div className="inline-flex rounded-lg border-2 border-black overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSizeMode('contracts')}
                  className={`px-2.5 py-1 text-[11px] font-bold ${
                    sizeMode === 'contracts' ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  Contracts
                </button>
                <button
                  type="button"
                  onClick={() => setSizeMode('dollars')}
                  className={`px-2.5 py-1 text-[11px] font-bold ${
                    sizeMode === 'dollars' ? 'bg-black text-white' : 'bg-white text-black'
                  }`}
                >
                  Dollar Stake
                </button>
              </div>
            </div>

            {sizeMode === 'contracts' ? (
              <div>
                <input
                  type="number"
                  min={1}
                  max={1000000}
                  value={contractsInput}
                  onChange={(e) => setContractsInput(e.target.value)}
                  aria-label="Number of contracts"
                  className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-black font-mono font-bold text-base text-ink focus:outline-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50, 100, 500, 1000, 5000].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setContractsInput(String(c))}
                      className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-black/5 border border-black/25 hover:bg-[#FFE642] hover:border-black transition-colors"
                    >
                      {c.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-black">$</span>
                  <input
                    type="number"
                    min={1}
                    max={1000000}
                    value={dollarsInput}
                    onChange={(e) => setDollarsInput(e.target.value)}
                    aria-label="Dollar stake"
                    className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white border-2 border-black font-mono font-bold text-base text-ink focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50, 100, 250, 500, 2500].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDollarsInput(String(d))}
                      className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-md bg-black/5 border border-black/25 hover:bg-[#FFE642] hover:border-black transition-colors"
                    >
                      ${d.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Type */}
          <div>
            <span className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-2">
              Kalshi Order Type
            </span>
            <div className="space-y-2">
              {(Object.keys(TIER_RATES) as OrderTier[]).map((k) => {
                const item = TIER_RATES[k];
                const active = tier === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setTier(k)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 text-left transition-all ${
                      active
                        ? 'bg-[#FFE642] border-black shadow-pop-sm text-black'
                        : 'bg-white border-black/25 text-ink hover:border-black'
                    }`}
                  >
                    <span className="font-display font-bold text-sm">{item.label}</span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-black/10">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Round-trip toggle */}
          <div className="rounded-xl bg-[#FFF7E6] border border-black/25 p-3.5">
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="block text-xs font-bold text-ink">Active Exit / Round-Trip Trade (2× fee)</span>
                <span className="block text-[11px] text-ink-secondary">
                  Turn on if you plan to sell early before settlement instead of holding to expiration.
                </span>
              </div>
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={(e) => setRoundTrip(e.target.checked)}
                className="w-4 h-4 accent-black shrink-0"
              />
            </label>
          </div>
        </section>

        {/* Right: Results */}
        <section className="lg:col-span-6 space-y-5">
          {/* Primary Fee Output Card */}
          <div className="bg-white border-2 border-black rounded-2xl shadow-pop p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b-2 border-black/10">
              <h2 className="font-display font-bold text-lg text-ink">2. Fee &amp; Break-Even Summary</h2>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-black text-[#C6F23A]">
                {calc.contracts.toLocaleString()} contracts
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border-2 border-black bg-[#FFE642] p-4">
                <span className="block text-[10px] font-mono font-bold uppercase text-black/70">
                  Exact Kalshi Fee
                </span>
                <span className="block font-display font-extrabold text-3xl text-black mt-0.5">
                  {fmtUsd(calc.totalFee)}
                </span>
                <span className="block text-[11px] font-mono font-bold text-black/80 mt-1">
                  {calc.feePerContractCents.toFixed(2)}¢ / contract ({calc.effectiveFeePct.toFixed(2)}% of stake)
                </span>
              </div>
              <div className="rounded-xl border-2 border-black bg-[#29C5F6] p-4">
                <span className="block text-[10px] font-mono font-bold uppercase text-black/75">
                  Break-Even Win Rate
                </span>
                <span className="block font-display font-extrabold text-3xl text-black mt-0.5">
                  {calc.breakEvenProb.toFixed(2)}%
                </span>
                <span className="block text-[11px] font-mono font-bold text-black/85 mt-1">
                  +{calc.feeDragPctPts.toFixed(2)} pts above {priceCents}% price
                </span>
              </div>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="text-ink-secondary">Contract Cost ({calc.contracts.toLocaleString()} × {priceCents}¢)</dt>
                <dd className="font-mono font-bold text-ink">{fmtUsd(calc.notionalCost)}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="text-ink-secondary">Total Cost incl. Fee</dt>
                <dd className="font-mono font-extrabold text-ink">{fmtUsd(calc.totalOutlay)}</dd>
              </div>
              <div className="flex justify-between py-1.5 border-b border-black/10">
                <dt className="text-ink-secondary">Gross Payout if Win</dt>
                <dd className="font-mono font-bold text-ink">{fmtUsd(calc.grossWinPayout)}</dd>
              </div>
              <div className="flex justify-between py-1.5">
                <dt className="font-bold text-ink">Net Profit if Win</dt>
                <dd className="font-mono font-extrabold text-ink">
                  {fmtUsd(calc.netProfitIfWin)}{' '}
                  <span className="text-xs font-semibold text-ink-muted">(+{calc.netRoiIfWin.toFixed(1)}% ROI)</span>
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
                onClick={copyFeeReceipt}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-black text-[#C6F23A] border-2 border-black text-xs font-bold hover:bg-black/85 transition-colors"
              >
                {copiedMode === 'receipt' ? <Check className="w-3.5 h-3.5" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                {copiedMode === 'receipt' ? 'Copied Receipt!' : 'Copy X/Reddit Receipt'}
              </button>
            </div>
          </div>

          {/* Pro Quant: +EV & Kelly Sizing Card */}
          <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display font-bold text-sm text-ink">
                Pro Mode: Net Expected Value (+EV) &amp; Kelly Sizing
              </h3>
              <span
                className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border border-black ${
                  calc.netEvUsd > 0 ? 'bg-[#C6F23A] text-black' : 'bg-[#FFE2E2] text-black'
                }`}
              >
                {calc.netEvUsd > 0 ? `+EV EDGE` : `-EV (NO EDGE)`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-ink-secondary">Your True Win %</span>
                  <span className="font-mono font-bold text-black">{trueProbPct}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={99}
                  value={trueProbPct}
                  onChange={(e) => setTrueProbPct(Number(e.target.value))}
                  aria-label="Your estimated true win probability"
                  className="w-full accent-black cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="fee-bankroll" className="block text-xs font-semibold text-ink-secondary mb-1">
                  Bankroll (for Kelly $)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-black">$</span>
                  <input
                    id="fee-bankroll"
                    type="number"
                    min={10}
                    max={10000000}
                    value={bankrollInput}
                    onChange={(e) => setBankrollInput(e.target.value)}
                    className="w-full pl-6 pr-2.5 py-1 rounded-lg bg-white border-2 border-black font-mono font-bold text-xs text-ink"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className={`rounded-xl border-2 border-black p-2.5 ${calc.netEvUsd > 0 ? 'bg-[#C6F23A]/40' : 'bg-[#FFE2E2]/60'}`}>
                <span className="block text-[10px] font-mono font-bold uppercase text-black/70">Net EV</span>
                <span className="block font-display font-extrabold text-base text-black">
                  {calc.netEvUsd >= 0 ? '+' : '-'}{fmtUsd(Math.abs(calc.netEvUsd))}
                </span>
                <span className="block text-[10px] font-mono text-black/75">
                  {calc.edgeVsBreakEven >= 0 ? '+' : ''}{calc.edgeVsBreakEven.toFixed(1)} pts edge
                </span>
              </div>
              <div className="rounded-xl border-2 border-black bg-white p-2.5">
                <span className="block text-[10px] font-mono font-bold uppercase text-black/70">Half-Kelly</span>
                <span className="block font-display font-extrabold text-base text-black">
                  {fmtUsd(calc.halfKellyUsd)}
                </span>
                <span className="block text-[10px] font-mono text-ink-muted">{calc.halfKellyPct.toFixed(1)}% bankroll</span>
              </div>
              <div className="rounded-xl border-2 border-black bg-white p-2.5">
                <span className="block text-[10px] font-mono font-bold uppercase text-black/70">Quarter-Kelly</span>
                <span className="block font-display font-extrabold text-base text-black">
                  {fmtUsd(calc.quarterKellyUsd)}
                </span>
                <span className="block text-[10px] font-mono text-ink-muted">{calc.quarterKellyPct.toFixed(1)}% bankroll</span>
              </div>
            </div>
          </div>

          {/* Quadratic Fee Curve Visualizer */}
          <div className="bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-display font-bold text-sm text-ink flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                Why 50¢ Contracts Cost the Most (Fee Curve)
              </h3>
              <span className="text-[11px] font-mono font-semibold text-ink-muted">Taker ¢ / contract</span>
            </div>
            <div className="grid grid-cols-11 gap-1.5 items-end h-28 pt-3">
              {CURVE_PRICES.map((p) => {
                const pr = p / 100;
                const centsFee = 7 * pr * (1 - pr); // max 1.75¢ at 50¢
                const heightPct = Math.max(12, Math.round((centsFee / 1.75) * 100));
                const isNearest = Math.abs(priceCents - p) <= 4;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriceCents(p)}
                    title={`${p}¢ contract: ${centsFee.toFixed(2)}¢ taker fee/contract`}
                    className="flex flex-col items-center gap-1 group h-full justify-end"
                  >
                    <span className="text-[9px] font-mono font-bold text-black/75 opacity-0 group-hover:opacity-100 transition-opacity">
                      {centsFee.toFixed(2)}¢
                    </span>
                    <div
                      className={`w-full rounded-t-md border-2 border-black transition-all ${
                        isNearest ? 'bg-[#FF00B8]' : 'bg-[#C6F23A] group-hover:bg-[#FFE642]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className={`text-[10px] font-mono ${isNearest ? 'font-extrabold text-black' : 'text-ink-muted'}`}>
                      {p}¢
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Side-by-Side Platform Comparison Table */}
      <section className="mt-8 bg-white border-2 border-black rounded-2xl shadow-pop p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-black" />
            <h2 className="font-display font-bold text-xl text-ink">
              Platform Fee Comparison on Your Trade ({calc.contracts.toLocaleString()} contracts @ {priceCents}¢)
            </h2>
          </div>
          {calc.polySavings > 0 && (
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#C6F23A] border-2 border-black text-black">
              Save up to {fmtUsd(calc.polySavings)} with 0% trading fees
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-xs font-mono uppercase tracking-wider text-black/75">
                <th className="py-2.5 pr-4">Venue / Order</th>
                <th className="py-2.5 px-3">Est. Fee</th>
                <th className="py-2.5 px-3">Break-Even</th>
                <th className="py-2.5 px-3">Net Win Profit</th>
                <th className="py-2.5 px-3">Savings vs. Taker</th>
                <th className="py-2.5 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              <tr>
                <td className="py-3 pr-4 font-bold text-ink">
                  Kalshi (Taker)
                  <span className="block text-[11px] font-normal text-ink-muted">CFTC-regulated USD · Instant fill</span>
                </td>
                <td className="py-3 px-3 font-mono font-bold">{fmtUsd(calc.takerFee)}</td>
                <td className="py-3 px-3 font-mono">{calc.takerBreakEven.toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono font-bold">{fmtUsd(calc.grossWinPayout - calc.notionalCost - calc.takerFee)}</td>
                <td className="py-3 px-3 font-mono text-ink-muted">Baseline</td>
                <td className="py-3 pl-3 text-right">
                  <TrackedLink
                    platform="kalshi"
                    ctx="fee-calculator-taker"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border-2 border-black text-xs font-bold text-black hover:bg-[#FFE642] transition-colors"
                  >
                    Kalshi <ExternalLink className="w-3 h-3" />
                  </TrackedLink>
                </td>
              </tr>
              <tr className="bg-[#FFF7E6]/60">
                <td className="py-3 pr-4 font-bold text-ink">
                  Kalshi (Maker Limit)
                  <span className="block text-[11px] font-normal text-ink-muted">Resting limit order · 75% cheaper than taker</span>
                </td>
                <td className="py-3 px-3 font-mono font-bold">{fmtUsd(calc.makerFee)}</td>
                <td className="py-3 px-3 font-mono">{calc.makerBreakEven.toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono font-bold">{fmtUsd(calc.grossWinPayout - calc.notionalCost - calc.makerFee)}</td>
                <td className="py-3 px-3 font-mono font-bold text-[#0E7A38]">+{fmtUsd(calc.makerSavings)}</td>
                <td className="py-3 pl-3 text-right">
                  <Link
                    href="/platforms/kalshi"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border-2 border-black text-xs font-bold text-black hover:bg-[#FFE642] transition-colors"
                  >
                    Review
                  </Link>
                </td>
              </tr>
              <tr className="bg-[#C6F23A]/20">
                <td className="py-3 pr-4 font-bold text-ink">
                  Polymarket (0% Fee)
                  <span className="block text-[11px] font-normal text-ink-muted">USDC on Polygon · Deepest global books</span>
                </td>
                <td className="py-3 px-3 font-mono font-extrabold text-[#0E7A38]">$0.00</td>
                <td className="py-3 px-3 font-mono font-bold">{calc.polyBreakEven.toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono font-extrabold">{fmtUsd(calc.grossWinPayout - calc.notionalCost)}</td>
                <td className="py-3 px-3 font-mono font-extrabold text-[#0E7A38]">+{fmtUsd(calc.polySavings)}</td>
                <td className="py-3 pl-3 text-right">
                  <TrackedLink
                    platform="polymarket"
                    ctx="fee-calculator-polymarket"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-[#FFE642] border-2 border-black text-xs font-bold hover:bg-black/85 transition-colors"
                  >
                    Polymarket <ExternalLink className="w-3 h-3" />
                  </TrackedLink>
                </td>
              </tr>
              <tr>
                <td className="py-3 pr-4 font-bold text-ink">
                  Pronostyx (0% Fee)
                  <span className="block text-[11px] font-normal text-ink-muted">USDC on Base · Spanish-first sports markets</span>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-[#0E7A38]">$0.00</td>
                <td className="py-3 px-3 font-mono">{calc.polyBreakEven.toFixed(2)}%</td>
                <td className="py-3 px-3 font-mono font-bold">{fmtUsd(calc.grossWinPayout - calc.notionalCost)}</td>
                <td className="py-3 px-3 font-mono font-bold text-[#0E7A38]">+{fmtUsd(calc.polySavings)}</td>
                <td className="py-3 pl-3 text-right">
                  <TrackedLink
                    platform="pronostyx"
                    ctx="fee-calculator-pronostyx"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border-2 border-black text-xs font-bold text-black hover:bg-[#FFE642] transition-colors"
                  >
                    Pronostyx <ExternalLink className="w-3 h-3" />
                  </TrackedLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cross-links */}
        <div className="mt-5 pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/research/kalshi-vs-polymarket-fees"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink hover:text-brand-orange transition-colors"
          >
            Read our full Kalshi vs. Polymarket Fee Breakdown <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tools/kalshi-combo-calculator"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#FFF7E6] border border-black/30 hover:bg-[#FFE642] hover:border-black transition-colors"
            >
              Kalshi Combo Calculator →
            </Link>
            <Link
              href="/tools/arbitrage-scanner"
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#FFF7E6] border border-black/30 hover:bg-[#FFE642] hover:border-black transition-colors"
            >
              Arbitrage Scanner →
            </Link>
          </div>
        </div>
      </section>

      {/* Formula & FAQ */}
      <section className="mt-8 bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <h3 className="font-display font-bold text-base text-ink mb-1.5">Exact Kalshi Fee Formula</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Kalshi rounds every order fee up to the next cent using{' '}
            <code className="font-mono text-black bg-black/10 px-1 rounded">ceil(0.07 × C × P × (1 − P))</code> for
            standard takers and{' '}
            <code className="font-mono text-black bg-black/10 px-1 rounded">ceil(0.0175 × C × P × (1 − P))</code> for
            resting maker orders.
          </p>
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-ink mb-1.5">How to Cut Your Kalshi Fees 75%</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Posting a resting limit order (Maker) instead of crossing the spread (Taker) drops the fee multiplier from
            0.07 to 0.0175 — saving 75% on every fill, and eliminating fees entirely on zero-fee maker promos.
          </p>
        </div>
        <div>
          <h3 className="font-display font-bold text-base text-ink mb-1.5">Why Break-Even Matters</h3>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Buying a 50¢ taker contract requires winning 51.75% of the time just to break even — and 53.50% if you exit
            early on a round-trip trade. Always compare net break-even before scalping tight spreads.
          </p>
        </div>
      </section>
    </div>
  );
}
