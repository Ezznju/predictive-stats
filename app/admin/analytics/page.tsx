'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  MousePointerClick,
  Link2,
  Mail,
  Inbox,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface PlatformRow { platform_slug: string; clicks: number; affiliate_clicks: number }
interface DayClicks { day: string; clicks: number }
interface DaySignups { day: string; signups: number }
interface CtxRow { ctx: string; clicks: number }
interface CountryRow { country: string; clicks: number }
interface RefererRow { referer: string; clicks: number }
interface RecentClick { platform_slug: string; ctx: string | null; is_affiliate: boolean; country: string | null; referer: string | null; created_at: string }
interface RecentSub { email: string; source: string | null; created_at: string }

interface Analytics {
  days: number;
  clicks: {
    total_all_time: number;
    total_period: number;
    affiliate_period: number;
    by_platform: PlatformRow[];
    by_day: DayClicks[];
    by_ctx: CtxRow[];
    by_country: CountryRow[];
    top_referers: RefererRow[];
    recent: RecentClick[];
  };
  subscribers: {
    total: number;
    new_period: number;
    by_day: DaySignups[];
    by_source: { source: string; signups: number }[];
    recent: RecentSub[];
  };
  contact_messages: { total: number; unread: number };
}

const RANGES = [7, 30, 90];

const PLATFORM_COLORS: Record<string, string> = {
  polymarket: '#4845F0',
  kalshi: '#2ECC71',
  manifold: '#7C3AED',
  metaculus: '#29C5F6',
};

function platformColor(slug: string, i: number) {
  const fallback = ['#FF7900', '#4A6CF7', '#EC4899', '#FFBF00'];
  return PLATFORM_COLORS[slug] ?? fallback[i % fallback.length];
}

function fmtDay(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function refererLabel(ref: string) {
  if (ref === '(direct)') return ref;
  try {
    const u = new URL(ref);
    return u.pathname === '/' ? u.hostname : u.pathname;
  } catch {
    return ref;
  }
}

/** Fill missing days so the chart shows a continuous range. */
function fillDays<T extends { day: string }>(
  rows: T[],
  days: number,
  key: 'clicks' | 'signups'
): { day: string; value: number }[] {
  const map = new Map(rows.map(r => [r.day, (r as any)[key] as number]));
  const out: { day: string; value: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    out.push({ day: iso, value: map.get(iso) ?? 0 });
  }
  return out;
}

function BarChart({ data, color }: { data: { day: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...data.map(d => d.value));
  const W = 600;
  const H = 140;
  const gap = 2;
  const bw = (W - gap * (data.length - 1)) / data.length;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Daily chart">
        {data.map((d, i) => {
          const h = d.value === 0 ? 2 : Math.max(4, (d.value / max) * (H - 10));
          return (
            <rect
              key={d.day}
              x={i * (bw + gap)}
              y={H - h}
              width={bw}
              height={h}
              rx={Math.min(3, bw / 3)}
              fill={d.value === 0 ? '#E5E7EB' : color}
            >
              <title>{`${fmtDay(d.day)}: ${d.value}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-gray-400 mt-1">
        <span>{fmtDay(data[0].day)}</span>
        <span>{fmtDay(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}

function HBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-gray-900 capitalize truncate">{label}</span>
        <span className="text-gray-500 tabular-nums ml-3 shrink-0">
          {value}{sub ? <span className="text-gray-400"> · {sub}</span> : null}
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(2, (value / Math.max(1, max)) * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-5 ${className}`}>
      <h2 className="font-display font-semibold text-sm text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${d}`, { cache: 'no-store' });
      if (!res.ok) throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
        <p className="font-semibold mb-1">Couldn&apos;t load analytics</p>
        <p>{error}</p>
        <p className="mt-2 text-red-500">
          Make sure the D1 tables (<code>outbound_clicks</code>, <code>newsletter_subscribers</code>,{' '}
          <code>contact_messages</code> — see <code>d1/schema.sql</code>) exist and
          <code> ADMIN_API_TOKEN</code> is set.
        </p>
      </div>
    );
  }

  if (!data) return null;

  const clickDays = fillDays(data.clicks.by_day, data.days, 'clicks');
  const subDays = fillDays(data.subscribers.by_day, data.days, 'signups');
  const maxPlatform = Math.max(1, ...data.clicks.by_platform.map(p => p.clicks));
  const maxCtx = Math.max(1, ...data.clicks.by_ctx.map(c => c.clicks));

  const stats = [
    { label: `Clicks (${data.days}d)`, value: data.clicks.total_period, extra: `${data.clicks.total_all_time} all-time`, icon: MousePointerClick, color: '#FF7900' },
    { label: `Affiliate clicks (${data.days}d)`, value: data.clicks.affiliate_period, extra: data.clicks.total_period > 0 ? `${Math.round((data.clicks.affiliate_period / data.clicks.total_period) * 100)}% of clicks` : '—', icon: Link2, color: '#4845F0' },
    { label: 'Subscribers', value: data.subscribers.total, extra: `+${data.subscribers.new_period} in ${data.days}d`, icon: Mail, color: '#2ECC71' },
    { label: 'Unread messages', value: data.contact_messages.unread, extra: `${data.contact_messages.total} total`, icon: Inbox, color: '#7C3AED' },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Outbound clicks, subscriber growth, and what&apos;s converting.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {RANGES.map(r => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${days === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            className="p-2 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-xl transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}1A` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <span className="text-xs text-gray-500 font-medium">{s.label}</span>
            </div>
            <p className="font-display font-bold text-3xl text-gray-900 tabular-nums">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.extra}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title={`Outbound clicks per day (last ${data.days} days)`}>
          <BarChart data={clickDays} color="#FF7900" />
        </Card>
        <Card title={`Newsletter signups per day (last ${data.days} days)`}>
          <BarChart data={subDays} color="#2ECC71" />
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card title="Clicks by platform">
          {data.clicks.by_platform.length === 0 ? (
            <p className="text-sm text-gray-400">No clicks in this period yet.</p>
          ) : (
            <div className="space-y-4">
              {data.clicks.by_platform.map((p, i) => (
                <HBar
                  key={p.platform_slug}
                  label={p.platform_slug}
                  value={p.clicks}
                  max={maxPlatform}
                  color={platformColor(p.platform_slug, i)}
                  sub={`${p.affiliate_clicks} affiliate`}
                />
              ))}
            </div>
          )}
        </Card>
        <Card title="Clicks by placement (ctx)">
          {data.clicks.by_ctx.length === 0 ? (
            <p className="text-sm text-gray-400">No clicks in this period yet.</p>
          ) : (
            <div className="space-y-4">
              {data.clicks.by_ctx.map((c, i) => (
                <HBar key={c.ctx} label={c.ctx} value={c.clicks} max={maxCtx} color="#4A6CF7" />
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <Card title="Top click sources (pages)">
          {data.clicks.top_referers.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.clicks.top_referers.map(r => (
                <li key={r.referer} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-gray-700 truncate" title={r.referer}>{refererLabel(r.referer)}</span>
                  <span className="text-gray-400 tabular-nums shrink-0">{r.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Clicks by country">
          {data.clicks.by_country.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.clicks.by_country.map(c => (
                <li key={c.country} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.country}</span>
                  <span className="text-gray-400 tabular-nums">{c.clicks}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Signups by source">
          {data.subscribers.by_source.length === 0 ? (
            <p className="text-sm text-gray-400">No subscribers yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.subscribers.by_source.map(s => (
                <li key={s.source} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{s.source}</span>
                  <span className="text-gray-400 tabular-nums">{s.signups}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Recent clicks">
          {data.clicks.recent.length === 0 ? (
            <p className="text-sm text-gray-400">No clicks recorded yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400">
                    <th className="px-1 pb-2 font-medium">Platform</th>
                    <th className="px-1 pb-2 font-medium">Placement</th>
                    <th className="px-1 pb-2 font-medium">Country</th>
                    <th className="px-1 pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.clicks.recent.map((c, i) => (
                    <tr key={i}>
                      <td className="px-1 py-2 font-medium text-gray-900 capitalize">
                        {c.platform_slug}
                        {c.is_affiliate && (
                          <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">AFF</span>
                        )}
                      </td>
                      <td className="px-1 py-2 text-gray-500">{c.ctx ?? '—'}</td>
                      <td className="px-1 py-2 text-gray-500">{c.country ?? '—'}</td>
                      <td className="px-1 py-2 text-gray-400 whitespace-nowrap">{fmtDateTime(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Recent subscribers">
          {data.subscribers.recent.length === 0 ? (
            <p className="text-sm text-gray-400">No subscribers yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.subscribers.recent.map(s => (
                <li key={s.email} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-900 truncate">{s.email}</span>
                  <span className="text-gray-400 text-xs whitespace-nowrap shrink-0">
                    {s.source ?? 'site'} · {fmtDateTime(s.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
