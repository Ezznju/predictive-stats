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
      <div className="bg-surface-overlay rounded-xl p-6 border border-surface-border">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="w-4 h-4 text-brand-yellow" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow">Newsletter</span>
        </div>
        <h3 className="font-display font-bold text-white text-lg">{siteSettings.newsletterHeading}</h3>
        <p className="text-sm text-slate-400 mt-1">{siteSettings.newsletterBody}</p>
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
              className="flex-1 bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red"
              required
            />
            <button type="submit" className="bg-brand-red hover:bg-brand-red/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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
      <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 via-brand-yellow/5 to-brand-green/10" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-yellow/10 px-4 py-1.5 rounded-full mb-4">
          <Mail className="w-3.5 h-3.5 text-brand-yellow" />
          <span className="text-xs font-bold uppercase tracking-wider text-brand-yellow">Free Weekly Briefing</span>
        </div>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-white">{siteSettings.newsletterHeading}</h2>
        <p className="text-slate-400 mt-3 max-w-xl mx-auto">{siteSettings.newsletterBody}</p>
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
              className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors"
              required
            />
            <button type="submit" className="bg-brand-red hover:bg-brand-red/90 text-white px-6 py-3 rounded-xl font-display font-semibold transition-colors flex items-center justify-center gap-2">
              Subscribe <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
