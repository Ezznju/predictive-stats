'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, Check, Loader2, ArrowRight } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const fd = new FormData(e.currentTarget as HTMLFormElement);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website: fd.get('website') || '' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message.');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-ink mb-4">Contact Us</h1>
      <p className="text-ink-secondary mb-8">Have a tip, correction, or pitch? We read everything.</p>

      {submitted ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-white/20 shadow-sm">
          <Check className="w-12 h-12 text-brand-green mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-ink">Message sent!</h2>
          <p className="text-ink-secondary mt-2">We&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors"
            >
              <option value="general">General Inquiry</option>
              <option value="pitch">Article Pitch</option>
              <option value="correction">Correction</option>
              <option value="partnership">Partnership</option>
              <option value="advertise">Advertise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Message</label>
            <textarea
              required
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors resize-none"
              placeholder="Your message..."
            />
          </div>
          {/* Honeypot — invisible to humans, bots fill it and get silently dropped */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            defaultValue=""
            className="absolute -left-[9999px] top-auto w-px h-px opacity-0"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-black hover:bg-black/90 disabled:bg-black/50 text-white px-6 py-3 rounded-xl font-display font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Message</>
            )}
          </button>
        </form>
      )}

      <div className="mt-12 p-6 bg-white rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-black" />
          <span className="font-display font-semibold text-ink">Direct Email</span>
        </div>
        <p className="text-ink-secondary text-sm">For press inquiries, pitch submissions, and partnership proposals:</p>
        <a href="mailto:ezzekielnjuguna.en@gmail.com" className="text-black hover:text-black/80 text-sm mt-1 inline-block">ezzekielnjuguna.en@gmail.com</a>
      </div>

      {/* While you're here */}
      <div className="mt-12">
        <h2 className="font-display font-bold text-xl text-ink mb-4">While you&apos;re here</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/articles" className="p-4 bg-white rounded-xl border border-white/20 shadow-sm hover:border-black/20 hover:shadow-md transition-all group">
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-black transition-colors flex items-center gap-2">Latest Analysis <ArrowRight className="w-3 h-3" /></h3>
            <p className="text-xs text-ink-secondary mt-1">Data-driven articles on prediction markets.</p>
          </Link>
          <Link href="/tools" className="p-4 bg-white rounded-xl border border-white/20 shadow-sm hover:border-black/20 hover:shadow-md transition-all group">
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-black transition-colors flex items-center gap-2">Free Tools <ArrowRight className="w-3 h-3" /></h3>
            <p className="text-xs text-ink-secondary mt-1">LP scanner and arbitrage finder.</p>
          </Link>
          <Link href="/platforms" className="p-4 bg-white rounded-xl border border-white/20 shadow-sm hover:border-black/20 hover:shadow-md transition-all group">
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-black transition-colors flex items-center gap-2">Platform Reviews <ArrowRight className="w-3 h-3" /></h3>
            <p className="text-xs text-ink-secondary mt-1">Compare Polymarket, Kalshi &amp; more.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
