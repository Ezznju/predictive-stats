'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PolymarketWidget } from '@/components/PolymarketWidget';

interface Mount {
  el: HTMLElement;
  market?: string;
  event?: string;
}

/**
 * Hydrates [data-polymarket-market] / [data-polymarket-event] placeholders
 * inside the server-rendered article HTML into live odds widgets.
 *
 * Authors write `[polymarket:market-slug]` or `[polymarket-event:event-slug]`
 * on its own line in the editor; the article page converts that shortcode
 * into a placeholder div which this component fills via React portals.
 */
export function PolymarketEmbeds() {
  const [mounts, setMounts] = useState<Mount[]>([]);

  useEffect(() => {
    const found: Mount[] = [];
    document.querySelectorAll<HTMLElement>('[data-polymarket-market]').forEach(el => {
      const market = el.getAttribute('data-polymarket-market');
      if (market) found.push({ el, market });
    });
    document.querySelectorAll<HTMLElement>('[data-polymarket-event]').forEach(el => {
      const event = el.getAttribute('data-polymarket-event');
      if (event) found.push({ el, event });
    });
    setMounts(found);
  }, []);

  return (
    <>
      {mounts.map((m, i) =>
        createPortal(<PolymarketWidget market={m.market} event={m.event} />, m.el, `pm-embed-${i}`)
      )}
    </>
  );
}
