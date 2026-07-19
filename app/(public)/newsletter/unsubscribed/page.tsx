import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Unsubscribed',
  robots: { index: false, follow: false },
};

export default function UnsubscribedPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams?.status;

  const copy =
    status === 'invalid'
      ? {
          emoji: '🤔',
          title: 'Link not recognized',
          body: "This unsubscribe link is invalid or was already used. If you're still getting emails, reach out via the contact page and we'll sort it out.",
        }
      : status === 'error'
        ? {
            emoji: '😅',
            title: 'Something went wrong',
            body: 'We could not process your unsubscribe request. Please try the link again, or contact us and we will remove you manually.',
          }
        : {
            emoji: '👋',
            title: "You're unsubscribed",
            body: "You won't receive The Weekly Signal anymore. Changed your mind? You can re-subscribe anytime.",
          };

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <span className="text-7xl">{copy.emoji}</span>
        <h1 className="font-display font-bold text-2xl text-ink mt-4">{copy.title}</h1>
        <p className="text-ink-secondary mt-2">{copy.body}</p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <Link
            href="/"
            className="bg-black hover:bg-black/90 text-white px-5 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors shadow-sm"
          >
            Go Home
          </Link>
          <Link
            href="/newsletter"
            className="bg-white border border-white/20 text-ink px-5 py-2.5 rounded-xl font-display font-semibold text-sm hover:border-black/20 transition-colors"
          >
            Re-subscribe
          </Link>
        </div>
      </div>
    </div>
  );
}
