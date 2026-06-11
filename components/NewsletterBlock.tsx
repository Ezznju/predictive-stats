'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { siteSettings } from '@/lib/data';
import {
  FlowerShape,
  DaisyShape,
  DottedSquare,
  HalfCircle,
  ConcentricRings,
  ArrowShape,
} from '@/components/GeometricShapes';

interface NewsletterBlockProps {
  variant?: 'banner' | 'inline' | 'full';
}

export function NewsletterBlock({ variant = 'banner' }: NewsletterBlockProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  if (variant === 'inline') {
    return (
      <div className="bg-white/20 rounded-2xl p-6 border border-white/20 relative overflow-hidden">
        <DaisyShape size={50} className="absolute -top-3 -right-3 opacity-40" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">Newsletter</span>
          </div>
          <h3 className="font-display font-bold text-black text-lg">{siteSettings.newsletterHeading}</h3>
          <p className="text-sm text-black/70 mt-1">{siteSettings.newsletterBody}</p>
          {submitted ? (
            <div className="flex items-center gap-2 mt-4 text-black text-sm">
              <Check className="w-4 h-4" />
              <span>You&apos;re subscribed!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-white border border-white/40 rounded-xl px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:border-black/30 focus:ring-1 focus:ring-black/20"
                required
              />
              <button type="submit" className="bg-black hover:bg-black/80 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Banner variant
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-black/10" />

      {/* Bold geometric decorations */}
      <FlowerShape size={100} color="#E01FFF" className="absolute -top-6 -left-6 opacity-40" />
      <HalfCircle size={120} color="#FF0066" direction="right" className="absolute -right-14 top-1/2 -translate-y-1/2 opacity-35" />
      <DottedSquare size={60} color="#00E676" dotColor="#0055FF" className="absolute bottom-4 left-[12%] opacity-50" />
      <ConcentricRings size={80} className="absolute top-2 right-[20%] opacity-35" />
      <ArrowShape width={90} height={34} className="absolute bottom-8 right-[10%] opacity-35" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center z-10">
        <div className="inline-flex items-center gap-2 bg-black/10 px-4 py-1.5 rounded-full mb-4">
          <Mail className="w-3.5 h-3.5 text-black" />
          <span className="text-xs font-bold uppercase tracking-wider text-black">Free Weekly Briefing</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-black">{siteSettings.newsletterHeading}</h2>
        <p className="text-black/70 mt-3 max-w-xl mx-auto">{siteSettings.newsletterBody}</p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 mt-6 text-black text-lg">
            <Check className="w-5 h-5" />
            <span className="font-display font-semibold">You&apos;re on the list!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mt-6 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white border border-white/40 rounded-xl px-4 py-3 text-black placeholder:text-black/40 focus:outline-none focus:border-black/30 focus:ring-2 focus:ring-black/10 transition-colors shadow-sm"
              required
            />
            <button type="submit" className="bg-black hover:bg-black/80 text-white px-6 py-3 rounded-xl font-display font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
