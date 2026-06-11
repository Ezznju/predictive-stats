'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { Mail, Send, Check } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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
        <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Name</label>
              <input type="text" required className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Email</label>
              <input type="email" required className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors" placeholder="your@email.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Subject</label>
            <select className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors">
              <option value="general">General Inquiry</option>
              <option value="pitch">Article Pitch</option>
              <option value="correction">Correction</option>
              <option value="partnership">Partnership</option>
              <option value="advertise">Advertise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Message</label>
            <textarea required rows={6} className="w-full bg-white border border-white/20 rounded-xl px-4 py-3 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-1 focus:ring-black/15 transition-colors resize-none" placeholder="Your message..." />
          </div>
          <button type="submit" className="bg-black hover:bg-black/90 text-white px-6 py-3 rounded-xl font-display font-semibold transition-colors flex items-center gap-2 shadow-sm">
            <Send className="w-4 h-4" /> Send Message
          </button>
        </form>
      )}

      <div className="mt-12 p-6 bg-white rounded-2xl border border-white/20 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-4 h-4 text-black" />
          <span className="font-display font-semibold text-ink">Direct Email</span>
        </div>
        <p className="text-ink-secondary text-sm">For press inquiries, pitch submissions, and partnership proposals:</p>
        <a href="mailto:contact@predictaview.com" className="text-black hover:text-black/80 text-sm mt-1 inline-block">contact@predictaview.com</a>
      </div>
    </div>
  );
}
