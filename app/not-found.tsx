import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <span className="text-8xl font-display font-bold gradient-text">404</span>
        <h1 className="font-display font-bold text-2xl text-ink mt-4">Page not found</h1>
        <p className="text-ink-secondary mt-2">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link href="/" className="bg-black hover:bg-black/90 text-white px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors shadow-sm">
            Go Home
          </Link>
          <Link href="/articles" className="bg-white border border-white/20 text-ink px-5 py-2.5 rounded-xl font-display font-semibold text-sm hover:border-black/20 transition-colors">
            Browse Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
