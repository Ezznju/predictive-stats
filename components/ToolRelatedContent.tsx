import Link from 'next/link';
import { BookOpen, ArrowRight, Layers } from 'lucide-react';

interface ToolRelatedContentProps {
  /** Which tool is this on? Used to show the "other" tool */
  currentTool: 'lp-scanner' | 'arbitrage-scanner';
}

const OTHER_TOOL = {
  'lp-scanner': {
    href: '/tools/arbitrage-scanner',
    name: 'Arbitrage Scanner',
    desc: 'Spot price gaps between Polymarket and Kalshi.',
  },
  'arbitrage-scanner': {
    href: '/tools/lp-scanner',
    name: 'LP Reward Scanner',
    desc: 'Find the highest-paying LP rewards on Polymarket.',
  },
};

const READING_LINKS = {
  'lp-scanner': [
    { href: '/platforms/polymarket', label: 'Polymarket Review — Full Platform Breakdown' },
    { href: '/platforms', label: 'Compare All Prediction Market Platforms' },
    { href: '/articles', label: 'Latest Prediction Market Analysis' },
  ],
  'arbitrage-scanner': [
    { href: '/platforms/polymarket', label: 'Polymarket Review — Full Platform Breakdown' },
    { href: '/platforms/kalshi', label: 'Kalshi Review — Full Platform Breakdown' },
    { href: '/platforms', label: 'Compare All Prediction Market Platforms' },
  ],
};

export function ToolRelatedContent({ currentTool }: ToolRelatedContentProps) {
  const other = OTHER_TOOL[currentTool];
  const reading = READING_LINKS[currentTool];

  return (
    <div className="mt-10 space-y-6">
      {/* Cross-link to other tool */}
      <Link
        href={other.href}
        className="block bg-white rounded-2xl border-2 border-black p-5 shadow-pop-sm hover:-translate-y-0.5 transition-transform group"
      >
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-black flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-sm text-ink group-hover:text-black transition-colors">
              Also try: {other.name}
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">{other.desc}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
        </div>
      </Link>

      {/* Related reading */}
      <div className="bg-black/5 rounded-2xl border border-black/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-ink-secondary" />
          <h3 className="font-display font-bold text-sm text-ink">Related Reading</h3>
        </div>
        <ul className="space-y-2">
          {reading.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-ink-secondary hover:text-black transition-colors flex items-center gap-2"
              >
                <ArrowRight className="w-3 h-3 flex-shrink-0" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
