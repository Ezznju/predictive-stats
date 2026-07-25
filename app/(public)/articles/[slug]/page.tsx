import { redirect } from 'next/navigation';
import { getArticleBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export default async function ArticleRedirect({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    redirect('/');
  }
  redirect(`/${article.categorySlug}/${article.slug}`);
}
