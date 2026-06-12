/**
 * Shared template for auto-generated Open Graph / Twitter share images.
 * Matches the site's neo-brutalist "pop" brand: neon-lime canvas, thick
 * black borders, offset shadows, bright accent dots, Space Grotesk type.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const ogSize = { width: 1200, height: 630 };

export const OG_DOTS = ['#FF00B8', '#29C5F6', '#FFE642', '#2BD96E', '#9D5CFF', '#FF6B00'];

export async function loadOgFonts() {
  const [bold, medium] = await Promise.all([
    readFile(join(process.cwd(), 'assets', 'SpaceGrotesk-Bold.woff')),
    readFile(join(process.cwd(), 'assets', 'SpaceGrotesk-Medium.woff')),
  ]);
  return [
    { name: 'Space Grotesk', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Space Grotesk', data: medium, weight: 500 as const, style: 'normal' as const },
  ];
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  return text.length <= max ? text : text.slice(0, max - 1).trimEnd() + '…';
}

interface OgCardProps {
  title: string;
  badge?: string;
  badgeColor?: string;
  metaLeft?: string;
  metaRight?: string;
}

export function OgCard({ title, badge, badgeColor = '#FF00B8', metaLeft, metaRight }: OgCardProps) {
  const safeTitle = truncate(title, 110);
  const titleSize = safeTitle.length > 80 ? 52 : safeTitle.length > 50 ? 60 : 70;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: '#D9F24B',
        padding: 44,
        fontFamily: 'Space Grotesk',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          backgroundColor: '#FFFFFF',
          border: '5px solid #000000',
          borderRadius: 28,
          boxShadow: '14px 14px 0 #000000',
          padding: '44px 52px',
        }}
      >
        {/* Top row: badge + accent dots */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {badge ? (
            <div
              style={{
                display: 'flex',
                backgroundColor: badgeColor,
                color: '#FFFFFF',
                border: '3px solid #000000',
                borderRadius: 999,
                padding: '10px 26px',
                fontSize: 26,
                fontWeight: 700,
                boxShadow: '5px 5px 0 #000000',
              }}
            >
              {truncate(badge, 32)}
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            {OG_DOTS.map((color) => (
              <div
                key={color}
                style={{
                  display: 'flex',
                  width: 26,
                  height: 26,
                  borderRadius: 999,
                  backgroundColor: color,
                  border: '3px solid #000000',
                }}
              />
            ))}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: titleSize,
            fontWeight: 700,
            color: '#000000',
            lineHeight: 1.12,
            letterSpacing: -1,
            paddingRight: 20,
          }}
        >
          {safeTitle}
        </div>

        {/* Bottom row: brand + meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '4px solid #000000',
            paddingTop: 26,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                backgroundColor: '#FF00B8',
                border: '3px solid #000000',
                borderRadius: 12,
                boxShadow: '4px 4px 0 #000000',
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              P
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#000000' }}>
                Predictions Market Fans
              </div>
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 500, color: '#555555' }}>
                predictionsmarketfans.com
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 22, fontWeight: 500, color: '#333333' }}>
            {metaLeft ? <div style={{ display: 'flex' }}>{metaLeft}</div> : null}
            {metaLeft && metaRight ? (
              <div style={{ display: 'flex', width: 8, height: 8, borderRadius: 999, backgroundColor: '#000000' }} />
            ) : null}
            {metaRight ? <div style={{ display: 'flex' }}>{metaRight}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
