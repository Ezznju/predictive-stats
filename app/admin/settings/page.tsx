'use client';

import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { siteSettings } from '@/lib/data';

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({ ...siteSettings });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateField = (key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Site Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure your publication.</p>
        </div>
        <button onClick={handleSave} className="bg-brand-red hover:bg-brand-red/90 text-white px-4 py-2.5 rounded-lg font-display font-semibold text-sm transition-colors flex items-center gap-2">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* General */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5 space-y-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            General
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Site Name</label>
            <input type="text" value={settings.siteName} onChange={(e) => updateField('siteName', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tagline</label>
            <input type="text" value={settings.siteTagline} onChange={(e) => updateField('siteTagline', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Site Description</label>
            <textarea value={settings.siteDescription} onChange={(e) => updateField('siteDescription', e.target.value)} rows={3} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Site URL</label>
            <input type="url" value={settings.siteUrl} onChange={(e) => updateField('siteUrl', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors font-mono" />
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5 space-y-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow" />
            Newsletter
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Heading</label>
            <input type="text" value={settings.newsletterHeading} onChange={(e) => updateField('newsletterHeading', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Body Text</label>
            <textarea value={settings.newsletterBody} onChange={(e) => updateField('newsletterBody', e.target.value)} rows={3} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors resize-none" />
          </div>
        </div>

        {/* Mission */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5 space-y-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            Mission Section
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Heading</label>
            <input type="text" value={settings.missionHeading} onChange={(e) => updateField('missionHeading', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Body Text</label>
            <textarea value={settings.missionBody} onChange={(e) => updateField('missionBody', e.target.value)} rows={4} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors resize-none" />
          </div>
        </div>

        {/* Social */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-5 space-y-4">
          <h2 className="font-display font-semibold text-white flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
            Social Links
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Twitter / X</label>
            <input type="url" value={settings.socialTwitter} onChange={(e) => updateField('socialTwitter', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">LinkedIn</label>
            <input type="url" value={settings.socialLinkedin} onChange={(e) => updateField('socialLinkedin', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">GitHub</label>
            <input type="url" value={settings.socialGithub} onChange={(e) => updateField('socialGithub', e.target.value)} className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
