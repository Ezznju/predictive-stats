import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <span className="text-8xl font-display font-bold gradient-text">404</span>
        <h1 className="font-display font-bold text-2xl text-white mt-4">Page not found</h1>
        <p className="text-slate-400 mt-2">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link href="/" className="bg-brand-red hover:bg-brand-red/90 text-white px-5 py-2.5 rounded-lg font-display font-semibold text-sm transition-colors">
            Go Home
          </Link>
          <Link href="/articles" className="bg-surface-raised border border-surface-border text-white px-5 py-2.5 rounded-lg font-display font-semibold text-sm hover:border-brand-red/30 transition-colors">
            Browse Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
