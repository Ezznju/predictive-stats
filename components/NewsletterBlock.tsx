'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import {
  FlowerShape,
  DaisyShape,
  HalfCircle,
  ConcentricArches,
  CornerDotSquare,
  ArrowBanner,
  PinwheelTile,
  QuatrefoilFlower,
} from '@/components/GeometricShapes';

interface NewsletterBlockProps {
  variant?: 'banner' | 'inline' | 'full';
  heading?: string;
  body?: string;
}

export function NewsletterBlock({
  variant = 'banner',
  heading = 'Stay Ahead of the Markets',
  body = 'Get weekly prediction market analysis, forecasting insights, and data-driven commentary delivered to your inbox.',
}: NewsletterBlockProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData(e.currentTarget as HTMLFormElement);
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: variant, website: fd.get('website') || '' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Subscription failed. Please try again.');
      }
    } catch {
      setError('Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="bg-white rounded-2xl p-6 card-pop relative overflow-hidden">
        <DaisyShape size={50} petalColor="#C9B8F5" centerColor="#FFE642" className="absolute -top-3 -right-3 opacity-80" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">Newsletter</span>
          </div>
          <h3 className="font-display font-bold text-black text-lg">{heading}</h3>
          <p className="text-sm text-black/70 mt-1">{body}</p>
          {submitted ? (
            <div className="flex items-center gap-2 mt-4 text-black text-sm">
              <Check className="w-4 h-4" />
              <span>You&apos;re subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
              {/* Honeypot — invisible to humans, bots fill it and get silently dropped */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" className="absolute -left-[9999px] top-auto w-px h-px opacity-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white border-2 border-black rounded-xl px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-black/20"
                required
              />
              <button type="submit" disabled={submitting} className="bg-black disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-bold btn-pop">
                {submitting ? '...' : 'Subscribe'}
              </button>
            </form>
          )}
          {error && !submitted && <p className="text-xs text-red-700 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Banner variant
  return (
    <section className="relative overflow-hidden bg-neon-lime border-y-2 border-black">
      {/* Bold geometric decorations — solid & bright */}
      <FlowerShape size={110} color="#FF00B8" className="absolute -top-8 -left-8 opacity-90" />
      <HalfCircle size={130} color="#4845F0" direction="right" className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-90" />
      <CornerDotSquare size={64} color="#2BD96E" dotColor="#9D5CFF" className="absolute bottom-5 left-[10%] -rotate-6 hidden md:block" />
      <QuatrefoilFlower size={70} petalColor="#C9B8F5" holeColor="#D9F24B" className="absolute top-3 right-[20%] hidden md:block" />
      <ArrowBanner width={110} height={44} barColor="#29C5F6" className="absolute bottom-8 right-[8%] hidden lg:block" />
      <PinwheelTile size={64} bladeColor="#9D5CFF" className="absolute top-6 left-[22%] rotate-12 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center z-10">
        <div className="inline-flex items-center gap-2 bg-white border-2 border-black shadow-pop-sm px-4 py-1.5 rounded-full mb-4">
          <Mail className="w-3.5 h-3.5 text-black" />
          <span className="text-xs font-bold uppercase tracking-wider text-black">Free Weekly Briefing</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-black">{heading}</h2>
        <p className="text-black/70 mt-3 max-w-xl mx-auto">{body}</p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 mt-6 text-black text-lg">
            <Check className="w-5 h-5" />
            <span className="font-display font-semibold">You&apos;re on the list!</span>
          </div>
        ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-6 max-w-md mx-auto">
            {/* Honeypot — invisible to humans, bots fill it and get silently dropped */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" defaultValue="" className="absolute -left-[9999px] top-auto w-px h-px opacity-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white border-2 border-black rounded-xl px-4 py-3 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors shadow-pop-sm"
              required
            />
            <button type="submit" disabled={submitting} className="bg-neon-magenta disabled:opacity-60 text-white px-6 py-3 rounded-xl font-display font-bold btn-pop flex items-center justify-center gap-2">
              {submitting ? 'Subscribing…' : 'Subscribe'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
        {error && !submitted && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>
    </section>
  );
}
