export const SOTC_PUBLIC_EVENT_SLUG = 'sotc-rockhall';

const SOTC_EVENT_SLUGS = new Set([
  SOTC_PUBLIC_EVENT_SLUG,
  'sotc-rock-hall',
  'sotc-test-check-in',
]);

export function isSotcEventSlug(slug?: string | null): boolean {
  return Boolean(slug && SOTC_EVENT_SLUGS.has(slug));
}
