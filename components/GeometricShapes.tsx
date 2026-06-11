/**
 * Bold, colorful geometric shape components inspired by the reference design.
 * Used as decorative elements throughout the site.
 */

// ─── Flower/Petal Burst ─────────────────────────────────────────────
export function FlowerShape({
  size = 120,
  color = '#7C3AED',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <ellipse
          key={angle}
          cx="60"
          cy="60"
          rx="18"
          ry="35"
          fill={color}
          opacity="0.85"
          transform={`rotate(${angle} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" r="12" fill={color} />
    </svg>
  );
}

// ─── Daisy Flower (circles around center) ───────────────────────────
export function DaisyShape({
  size = 100,
  petalColor = '#B4A0E5',
  centerColor = '#FFE642',
  className = '',
}: {
  size?: number;
  petalColor?: string;
  centerColor?: string;
  className?: string;
}) {
  const petals = 6;
  const petalR = 16;
  const dist = 22;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: petals }).map((_, i) => {
        const angle = (i * 360) / petals;
        const rad = (angle * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={50 + Math.cos(rad) * dist}
            cy={50 + Math.sin(rad) * dist}
            r={petalR}
            fill={petalColor}
          />
        );
      })}
      <circle cx="50" cy="50" r="10" fill={centerColor} />
    </svg>
  );
}

// ─── U-Shape / Arch ─────────────────────────────────────────────────
export function UShape({
  size = 160,
  color = '#4A6CF7',
  strokeWidth = 24,
  className = '',
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 180"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M30 20 L30 110 Q30 150 80 150 Q130 150 130 110 L130 20"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Rounded Square with Corner Dots ────────────────────────────────
export function DottedSquare({
  size = 100,
  color = '#2ECC71',
  dotColor = '#7C3AED',
  className = '',
}: {
  size?: number;
  color?: string;
  dotColor?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <rect x="10" y="10" width="80" height="80" rx="8" fill={color} />
      <circle cx="12" cy="12" r="6" fill={dotColor} />
      <circle cx="88" cy="12" r="6" fill={dotColor} />
      <circle cx="12" cy="88" r="6" fill={dotColor} />
      <circle cx="88" cy="88" r="6" fill={dotColor} />
    </svg>
  );
}

// ─── Bold Arrow ─────────────────────────────────────────────────────
export function ArrowShape({
  width = 160,
  height = 60,
  bodyColor = '#00D4FF',
  headColor = '#1A1207',
  className = '',
}: {
  width?: number;
  height?: number;
  bodyColor?: string;
  headColor?: string;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 60"
      className={className}
      aria-hidden="true"
    >
      <rect x="0" y="12" width="120" height="36" rx="4" fill={bodyColor} />
      <polygon points="110,0 160,30 110,60" fill={headColor} />
    </svg>
  );
}

// ─── Rainbow Arc (concentric U-shapes) ──────────────────────────────
export function RainbowArc({
  size = 200,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  const colors = ['#EC4899', '#FF7900', '#EC4899', '#FF7900', '#EC4899'];
  const baseWidth = 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
    >
      {colors.map((color, i) => {
        const radius = 90 - i * baseWidth;
        if (radius <= 0) return null;
        return (
          <path
            key={i}
            d={`M${100 - radius} 100 A${radius} ${radius} 0 0 1 ${100 + radius} 100 L${100 + radius} 200 Q${100 + radius} ${100 + radius * 0.4} 100 ${100 + radius * 0.4} Q${100 - radius} ${100 + radius * 0.4} ${100 - radius} 200 Z`}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

// ─── Large Circle ───────────────────────────────────────────────────
export function BoldCircle({
  size = 120,
  color = '#4A6CF7',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="58" fill={color} />
    </svg>
  );
}

// ─── Wavy Blob ──────────────────────────────────────────────────────
export function BlobShape({
  size = 140,
  color = '#FFE642',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M44.7,-76.4C58.8,-69.2,71.8,-58.1,79.6,-44.2C87.4,-30.3,90,-13.7,88.2,2.1C86.4,18,80.3,33.1,70.6,44.8C60.9,56.5,47.7,64.8,33.6,70.7C19.5,76.6,4.5,80.1,-10.5,79.4C-25.5,78.7,-40.5,73.8,-53.2,65C-65.9,56.2,-76.3,43.5,-82.2,28.6C-88.1,13.7,-89.5,-3.4,-85.3,-18.8C-81.1,-34.2,-71.3,-47.9,-58.4,-55.7C-45.5,-63.5,-29.5,-65.4,-14.7,-68.3C0.1,-71.2,30.6,-83.6,44.7,-76.4Z"
        transform="translate(100 100)"
        fill={color}
        opacity="0.6"
      />
    </svg>
  );
}

// ─── Half-Circle ────────────────────────────────────────────────────
export function HalfCircle({
  size = 100,
  color = '#FF7900',
  direction = 'right',
  className = '',
}: {
  size?: number;
  color?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  className?: string;
}) {
  const rotations = { right: 0, down: 90, left: 180, up: 270 };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ transform: `rotate(${rotations[direction]}deg)` }}
    >
      <path d="M50 0 A50 50 0 0 1 50 100 Z" fill={color} />
    </svg>
  );
}

// ─── Concentric Rings ───────────────────────────────────────────────
export function ConcentricRings({
  size = 120,
  colors = ['#EC4899', '#FF7900', '#FFE642'],
  className = '',
}: {
  size?: number;
  colors?: string[];
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      aria-hidden="true"
    >
      {colors.map((color, i) => (
        <circle
          key={i}
          cx="60"
          cy="60"
          r={55 - i * 16}
          fill="none"
          stroke={color}
          strokeWidth="12"
        />
      ))}
    </svg>
  );
}

// ─── Zigzag Line ────────────────────────────────────────────────────
export function ZigzagLine({
  width = 200,
  height = 40,
  color = '#FFBF00',
  className = '',
}: {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 40"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points="0,20 20,5 40,35 60,5 80,35 100,5 120,35 140,5 160,35 180,5 200,20"
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Diamond ────────────────────────────────────────────────────────
export function DiamondShape({
  size = 80,
  color = '#FFE642',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  const half = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-hidden="true"
    >
      <polygon
        points={`${half},0 ${size},${half} ${half},${size} 0,${half}`}
        fill={color}
      />
    </svg>
  );
}
