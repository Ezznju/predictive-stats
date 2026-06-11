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

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your publication.</p>
        </div>
        <button onClick={handleSave} className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm">
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* General */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
            General
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Site Name</label>
            <input type="text" value={settings.siteName} onChange={(e) => updateField('siteName', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Tagline</label>
            <input type="text" value={settings.siteTagline} onChange={(e) => updateField('siteTagline', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Site Description</label>
            <textarea value={settings.siteDescription} onChange={(e) => updateField('siteDescription', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Site URL</label>
            <input type="url" value={settings.siteUrl} onChange={(e) => updateField('siteUrl', e.target.value)} className={`${inputClass} font-mono`} />
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-amber" />
            Newsletter
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Heading</label>
            <input type="text" value={settings.newsletterHeading} onChange={(e) => updateField('newsletterHeading', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Body Text</label>
            <textarea value={settings.newsletterBody} onChange={(e) => updateField('newsletterBody', e.target.value)} rows={3} className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
            Mission Section
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Heading</label>
            <input type="text" value={settings.missionHeading} onChange={(e) => updateField('missionHeading', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Body Text</label>
            <textarea value={settings.missionBody} onChange={(e) => updateField('missionBody', e.target.value)} rows={4} className={`${inputClass} resize-none`} />
          </div>
        </div>

        {/* Social */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
            Social Links
          </h2>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Twitter / X</label>
            <input type="url" value={settings.socialTwitter} onChange={(e) => updateField('socialTwitter', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">LinkedIn</label>
            <input type="url" value={settings.socialLinkedin} onChange={(e) => updateField('socialLinkedin', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">GitHub</label>
            <input type="url" value={settings.socialGithub} onChange={(e) => updateField('socialGithub', e.target.value)} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
}
