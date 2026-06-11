export interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string;
  title: string;
  avatar: string;
  twitter?: string;
  linkedin?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  authorId: string;
  categorySlug: string;
  tags: string[];
  publishDate: string;
  updatedDate?: string;
  readTime: number;
  featured: boolean;
  status: 'draft' | 'published' | 'scheduled';
  seoTitle?: string;
  metaDescription?: string;
  pullQuote?: string;
}

export interface SiteSettings {
  siteName: string;
  siteTagline: string;
  siteDescription: string;
  siteUrl: string;
  newsletterHeading: string;
  newsletterBody: string;
  missionHeading: string;
  missionBody: string;
  socialTwitter: string;
  socialLinkedin: string;
  socialGithub: string;
}
