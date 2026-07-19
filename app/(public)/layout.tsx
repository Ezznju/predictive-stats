import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteSettings, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  return (
    <>
      <Navbar siteName={settings.siteName} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} categories={categories} />
    </>
  );
}
