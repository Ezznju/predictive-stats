'use client';

/**
 * Procedurally-generated blob creature mascot.
 * Each unique `seed` produces a deterministic body shape.
 */

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blobPath(rng: () => number, cx: number, cy: number, r: number, pts: number, wob: number): string {
  const start = rng() * Math.PI * 2;
  const step = (Math.PI * 2) / pts;
  const P: [number, number][] = [];
  for (let k = 0; k < pts; k++) {
    const rad = r * (1 - wob + rng() * wob * 2);
    const a = start + step * k;
    P.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let k = 1; k <= pts; k++) {
    const cur = P[k % pts];
    const prev = P[k - 1];
    const mx = (prev[0] + cur[0]) / 2;
    const my = (prev[1] + cur[1]) / 2;
    d += ` Q${prev[0].toFixed(1)},${prev[1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  return d + ' Z';
}

export interface MascotCreatureProps {
  seed: number;
  bodyColor?: string;
  accentColor?: string;
  darkColor?: string;
  eyeBg?: string;
  hornType?: 'star' | 'bolt' | 'diamond';
  mouthType?: 'smile' | 'open' | 'up';
  oddsText?: string;
  bubbleColor?: string;
  className?: string;
}

export function MascotCreature({
  seed,
  bodyColor = '#FF00B8',
  accentColor = '#FFE642',
  darkColor = '#0b1120',
  eyeBg = '#FFFDF7',
  hornType = 'star',
  mouthType = 'smile',
  oddsText,
  bubbleColor = '#FFFDF7',
  className = '',
}: MascotCreatureProps) {
  const rng = mulberry32(seed);
  const bodyD = blobPath(rng, 75, 72, 42, 10, 0.14);
  const armL = blobPath(rng, 26, 80, 11, 7, 0.2);
  const armR = blobPath(rng, 124, 80, 11, 7, 0.2);
  const footL = blobPath(rng, 54, 116, 13, 7, 0.18);
  const footR = blobPath(rng, 96, 116, 13, 7, 0.18);

  const horn =
    hornType === 'star'
      ? `M75,0 L78,8 L86,9 L80,14 L82,22 L75,17 L68,22 L70,14 L64,9 L72,8 Z`
      : hornType === 'bolt'
      ? `M79,0 L69,13 L75,13 L71,27 L82,10 L76,10 Z`
      : `M68,0 L75,-7 L82,0 L75,7 Z`;

  const mouthD =
    mouthType === 'smile'
      ? `M65,84 Q75,93 85,84`
      : mouthType === 'open'
      ? ''
      : `M66,87 Q75,78 84,87`;

  const swayDur = 5 + (seed % 4) * 0.7;
  const blinkDur = 4 + (seed % 3) * 0.8;
  const tailDur = 3 + (seed % 3) * 0.6;

  return (
    <div
      className={`mascot-creature ${className}`}
      style={{ '--sway': `${swayDur}s`, '--blink': `${blinkDur}s`, '--tail': `${tailDur}s` } as React.CSSProperties}
    >
      <svg viewBox="0 0 150 140" width="100%" height="100%" aria-hidden="true">
        {/* feet */}
        <g className="mascot-foot">
          <path d={footL} fill={darkColor} />
        </g>
        <g className="mascot-foot" style={{ animationDelay: `${tailDur * 0.4}s` }}>
          <path d={footR} fill={darkColor} />
        </g>

        {/* arms */}
        <path d={armL} fill={bodyColor} />
        <path d={armR} fill={bodyColor} />

        {/* body */}
        <path d={bodyD} fill={bodyColor} />
        <ellipse cx="75" cy="82" rx="22" ry="16" fill={darkColor} opacity=".08" />

        {/* eyes */}
        <circle cx="60" cy="62" r="11" fill={eyeBg} />
        <circle cx="62" cy="63" r="5" fill={darkColor} />
        <ellipse className="mascot-lid" cx="60" cy="62" rx="11.5" ry="11.5" fill={bodyColor} />
        <circle cx="90" cy="62" r="11" fill={eyeBg} />
        <circle cx="92" cy="63" r="5" fill={darkColor} />
        <ellipse className="mascot-lid" cx="90" cy="62" rx="11.5" ry="11.5" fill={bodyColor} />

        {/* mouth */}
        {mouthType === 'open' ? (
          <ellipse cx="75" cy="87" rx="9" ry="7" fill={darkColor} />
        ) : (
          <path d={mouthD} fill="none" stroke={darkColor} strokeWidth="3.4" strokeLinecap="round" />
        )}

        {/* cheeks */}
        <circle cx="48" cy="78" r="5" fill={accentColor} opacity=".55" />
        <circle cx="102" cy="78" r="5" fill={accentColor} opacity=".55" />

        {/* antenna + horn */}
        <g className="mascot-neck">
          <line x1="75" y1="32" x2="75" y2="10" stroke={darkColor} strokeWidth="3" strokeLinecap="round" />
          <path d={horn} fill={accentColor} transform="translate(0, 2)" />
        </g>

        {/* odds bubble */}
        {oddsText && (
          <g className="mascot-bubble">
            <rect x="15" y="-18" width="120" height="26" rx="8" fill={darkColor} />
            <polygon points="65,8 72,18 79,8" fill={darkColor} />
            <text x="75" y="0" textAnchor="middle" fontFamily="'Sora',system-ui,sans-serif" fontSize="13" fontWeight="700" fill={bubbleColor}>
              {oddsText}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
