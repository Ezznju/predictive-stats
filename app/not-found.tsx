import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-12">
      <div className="text-center bg-white border-2 border-black rounded-2xl shadow-pop-lg p-8 sm:p-12 max-w-lg w-full">
        <span className="inline-block px-4 py-1 rounded-xl bg-brand-yellow border-2 border-black shadow-pop-sm text-5xl sm:text-6xl font-display font-extrabold text-black">
          404
        </span>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-6">Page not found</h1>
        <p className="text-ink-secondary mt-2 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <Link
            href="/"
            className="bg-black text-white px-5 py-2.5 rounded-xl font-display font-bold text-sm btn-pop"
          >
            Go Home
          </Link>
          <Link
            href="/articles"
            className="bg-neon-lime text-black px-5 py-2.5 rounded-xl font-display font-bold text-sm btn-pop"
          >
            Browse Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
