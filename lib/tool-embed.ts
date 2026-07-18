/**
 * Replaces [tool:xxx] markers in article HTML with styled tool CTA cards.
 *
 * Usage in article content (Supabase editor):
 *   [tool:lp-scanner]
 *   [tool:arbitrage-scanner]
 *
 * These get rendered as styled, clickable cards that link to the tool pages.
 * Works inside dangerouslySetInnerHTML — pure HTML output, no React needed.
 */

const TOOL_CARDS: Record<string, { href: string; title: string; subtitle: string; description: string; color: string }> = {
  'lp-scanner': {
    href: '/tools/lp-scanner',
    title: 'LP Reward Scanner',
    subtitle: 'Polymarket',
    description: 'Find the highest-paying liquidity provider rewards across all active Polymarket markets. Real-time data, sorted by profitability.',
    color: '#D9F24B',
  },
  'arbitrage-scanner': {
    href: '/tools/arbitrage-scanner',
    title: 'Arbitrage Scanner',
    subtitle: 'Polymarket × Kalshi',
    description: 'Spot cross-platform price gaps between Polymarket and Kalshi. See exploitable spreads in real time.',
    color: '#2BD96E',
  },
};

function toolCardHtml(tool: string): string {
  const config = TOOL_CARDS[tool];
  if (!config) return '';

  return `
<div class="tool-embed-card not-prose" data-tool="${tool}" style="margin:2rem 0;">
  <a href="${config.href}" class="group" style="display:block;background:#fff;border:2px solid #000;border-radius:1rem;padding:1.25rem;box-shadow:4px 4px 0 #000;text-decoration:none;transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='4px 6px 0 #000'" onmouseout="this.style.transform='';this.style.boxShadow='4px 4px 0 #000'">
    <div style="display:flex;align-items:flex-start;gap:1rem;">
      <div style="background:${config.color};width:3rem;height:3rem;border-radius:0.75rem;border:2px solid #000;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
          <span style="font-size:10px;font-weight:700;color:#000;background:#D9F24B;border:1px solid #000;border-radius:9999px;padding:2px 8px;">FREE TOOL</span>
          <span style="font-size:10px;font-weight:700;color:#000;background:#2BD96E;border:1px solid #000;border-radius:9999px;padding:2px 8px;">LIVE DATA</span>
        </div>
        <h3 style="font-family:system-ui,-apple-system,sans-serif;font-weight:700;font-size:1rem;color:#000;margin:0;display:flex;align-items:center;gap:0.5rem;">
          ${config.title}
          <span style="font-weight:400;font-size:0.75rem;color:#666;">${config.subtitle}</span>
        </h3>
        <p style="font-size:0.875rem;color:#555;margin:0.25rem 0 0;line-height:1.5;">
          ${config.description}
        </p>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:0.25rem;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </div>
  </a>
</div>`;
}

/**
 * Process article HTML content, replacing [tool:xxx] markers with cards.
 */
export function embedTools(html: string): string {
  return html.replace(
    /\[tool:([a-z-]+)\]/g,
    (_, tool) => toolCardHtml(tool)
  );
}
