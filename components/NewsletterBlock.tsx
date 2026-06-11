'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { siteSettings } from '@/lib/data';

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
      <div className="bg-surface-overlay rounded-2xl p-6 border border-surface-border">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-brand-amber" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-amber">Newsletter</span>
        </div>
        <h3 className="font-display font-bold text-ink text-lg">{siteSettings.newsletterHeading}</h3>
        <p className="text-sm text-ink-secondary mt-1">{siteSettings.newsletterBody}</p>
        {submitted ? (
          <div className="flex items-center gap-2 mt-4 text-brand-green text-sm">
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
              className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber/30"
              required
            />
            <button type="submit" className="bg-brand-orange hover:bg-brand-orange/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
              Subscribe
            </button>
          </form>
        )}
      </div>
    );
  }

  // Banner variant
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-brand-amber/10 via-brand-yellow/10 to-brand-orange/10" />
      {/* Decorative shapes */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-yellow opacity-[0.08]" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-brand-orange opacity-[0.06]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-amber/15 px-4 py-1.5 rounded-full mb-4">
          <Mail className="w-3.5 h-3.5 text-brand-amber" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-amber">Free Weekly Briefing</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-ink">{siteSettings.newsletterHeading}</h2>
        <p className="text-ink-secondary mt-3 max-w-xl mx-auto">{siteSettings.newsletterBody}</p>
        {submitted ? (
          <div className="flex items-center justify-center gap-2 mt-6 text-brand-green text-lg">
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
              className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-amber focus:ring-2 focus:ring-brand-amber/20 transition-colors shadow-sm"
              required
            />
            <button type="submit" className="bg-brand-orange hover:bg-brand-orange/90 text-white px-6 py-3 rounded-xl font-display font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm">
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
