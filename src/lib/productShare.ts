/**
 * Shareable product links.
 *
 * vibecodedit.com is a static SPA, so social crawlers only ever see the site-wide
 * card in index.html. Product shares therefore go through the `og-share` edge
 * function, which serves per-product Open Graph tags (using the product's first
 * screenshot) to crawlers and 302s real visitors to the product destination.
 */
const FUNCTIONS_ORIGIN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const buildProductShareUrl = (product: { id: string; slug?: string }) => {
  const params = new URLSearchParams();
  if (product.slug) params.set('slug', product.slug);
  else params.set('id', product.id);
  return `${FUNCTIONS_ORIGIN}/og-share?${params.toString()}`;
};
