'use client';

import { useEffect, useState } from 'react';
import { Save, Check, Loader2 } from 'lucide-react';

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteName: '',
    siteTagline: '',
    siteDescription: '',
    siteUrl: '',
    newsletterHeading: '',
    newsletterBody: '',
    missionHeading: '',
    missionBody: '',
    socialTwitter: '',
    socialLinkedin: '',
    socialGithub: '',
  });

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          siteName: data.site_name || '',
          siteTagline: data.site_tagline || '',
          siteDescription: data.site_description || '',
          siteUrl: data.site_url || '',
          newsletterHeading: data.newsletter_heading || '',
          newsletterBody: data.newsletter_body || '',
          missionHeading: data.mission_heading || '',
          missionBody: data.mission_body || '',
          socialTwitter: data.social_twitter || '',
          socialLinkedin: data.social_linkedin || '',
          socialGithub: data.social_github || '',
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('Failed to save settings');
    }
    setSaving(false);
  };

  const updateField = (key: keyof typeof settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-orange-300 focus:ring-1 focus:ring-orange-200 transition-colors";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Site Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your publication.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-600/90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600" /> General
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Newsletter
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Mission Section
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

        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Social Links
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
