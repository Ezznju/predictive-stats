'use client';

import { MascotCreature } from './MascotCreature';

const MASCOTS = [
  {
    seed: 11,
    bodyColor: '#FF00B8',
    accentColor: '#FFE642',
    darkColor: '#0b1120',
    eyeBg: '#FFFDF7',
    hornType: 'star' as const,
    mouthType: 'up' as const,
    oddsText: '72\u00A2 YES',
    bubbleColor: '#FF00B8',
  },
  {
    seed: 29,
    bodyColor: '#29C5F6',
    accentColor: '#FF7900',
    darkColor: '#0b1120',
    eyeBg: '#FFFDF7',
    hornType: 'bolt' as const,
    mouthType: 'smile' as const,
    oddsText: '2.4\u00A2 SPREAD',
    bubbleColor: '#29C5F6',
  },
  {
    seed: 47,
    bodyColor: '#2BD96E',
    accentColor: '#FF00B8',
    darkColor: '#0b1120',
    eyeBg: '#FFFDF7',
    hornType: 'diamond' as const,
    mouthType: 'open' as const,
    oddsText: '34.7% APR',
    bubbleColor: '#2BD96E',
  },
  {
    seed: 63,
    bodyColor: '#9D5CFF',
    accentColor: '#C9B8F5',
    darkColor: '#0b1120',
    eyeBg: '#FFFDF7',
    hornType: 'star' as const,
    mouthType: 'smile' as const,
    oddsText: '54\u00A2 YES',
    bubbleColor: '#9D5CFF',
  },
  {
    seed: 81,
    bodyColor: '#FFE642',
    accentColor: '#FF00B8',
    darkColor: '#0b1120',
    eyeBg: '#FFFDF7',
    hornType: 'bolt' as const,
    mouthType: 'up' as const,
    oddsText: 'FOLLOW WHALES',
    bubbleColor: '#FFE642',
  },
];

export function MascotBand() {
  return (
    <div className="overflow-x-auto scrollbar-hide border-b-2 border-black bg-[#0B132B]">
      <div className="flex items-end justify-center gap-4 sm:gap-6 px-4 sm:px-6 py-3 sm:py-4 min-w-max sm:min-w-0">
        {MASCOTS.map((m) => (
          <div key={m.seed} className="w-[70px] sm:w-[80px] lg:w-[90px] shrink-0">
            <MascotCreature {...m} />
          </div>
        ))}
      </div>
    </div>
  );
}
