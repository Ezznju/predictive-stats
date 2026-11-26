import { notFound, permanentRedirect } from 'next/navigation';
import { getArticleBySlug } from '@/lib/db';
import { getConsolidatedRedirect } from '@/lib/seo-lifecycle';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default async function ArticleRedirect({ params }: Props) {
  // Single-hop 308 straight to the consolidated winner (avoids redirect chains & D1 reads)
  const consolidated = getConsolidatedRedirect(params.slug);
  if (consolidated) {
    permanentRedirect(consolidated);
  }

  const article = await getArticleBySlug(params.slug);
  if (!article) {
    notFound();
  }
  permanentRedirect(`/${article.categorySlug}/${article.slug}`);
}
