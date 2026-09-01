import type { Ece } from '../types';

export interface ContentListItem {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  imageUrl: string;
}

export type ContentListPresentationMode = 'detail_list' | 'expanded_home' | 'child_cards';

export interface ContentListConfig {
  enabled: boolean;
  presentationMode: ContentListPresentationMode;
  title: string;
  items: ContentListItem[];
  voting: {
    enabled: boolean;
    open: boolean;
    creditLimit: number;
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function asPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

function looksLikeImageUrl(value: string): boolean {
  return /^(https?:\/\/|\/|\.\/|\.\.\/|data:image\/)/i.test(value)
    || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(value);
}

function getPresentationMode(value: unknown): ContentListPresentationMode {
  return value === 'expanded_home' || value === 'child_cards' ? value : 'detail_list';
}

export function getContentListConfig(ece: Ece | null | undefined): ContentListConfig {
  const metadata = asRecord(ece?.metadata);
  const contentList = asRecord(metadata.content_list || metadata.contentList);
  const voting = asRecord(contentList.voting || metadata.voting);
  const rawItems = Array.isArray(contentList.items) ? contentList.items : [];

  return {
    enabled: metadata.interaction_mode === 'content_list' || contentList.enabled === true,
    presentationMode: getPresentationMode(contentList.presentation_mode || contentList.presentationMode),
    title: asString(contentList.title) || ece?.name || '',
    items: rawItems
      .map((item, index) => {
        const record = asRecord(item);
        const name = asString(record.name || record.title);
        const rawDescription = asString(record.description || record.detail || record.full_description || record.fullDescription || record.note);
        const rawSummary = asString(record.summary || record.short_summary || record.shortSummary || record.subtitle);
        const rawImageUrl = asString(record.image_url || record.imageUrl);
        const imageUrl = looksLikeImageUrl(rawImageUrl) ? rawImageUrl : '';
        const recoveredFullDetail = rawImageUrl && !imageUrl && (!rawSummary || rawDescription === rawSummary) ? rawImageUrl : '';
        const description = recoveredFullDetail || rawDescription;
        const summary = rawSummary || (recoveredFullDetail ? rawDescription : description);
        const slug = asString(record.slug) || slugify(name || `item-${index + 1}`);
        return {
          id: asString(record.id) || slug || `item-${index + 1}`,
          slug: slug || `item-${index + 1}`,
          name,
          summary,
          description,
          imageUrl,
        };
      })
      .filter((item) => item.name || item.summary || item.description || item.imageUrl),
    voting: {
      enabled: voting.enabled === true,
      open: voting.state === 'open' || voting.open === true,
      creditLimit: asPositiveInteger(voting.credit_limit ?? voting.creditLimit, 2),
    },
  };
}

export function parseContentListItems(value: string): ContentListItem[] {
  return value
    .split(/\r?\n/)
    .map((line, index) => {
      const parts = line.split('|').map((part) => part.trim());
      const [name = '', second = '', third = '', fourth = ''] = parts;
      const hasSeparateSummary = parts.length >= 4;
      const usesLegacyImageSlot = parts.length === 3 && looksLikeImageUrl(third);
      const summary = hasSeparateSummary || (third && !usesLegacyImageSlot) ? second : '';
      const description = hasSeparateSummary || (third && !usesLegacyImageSlot) ? third : second;
      const imageUrl = hasSeparateSummary ? fourth : usesLegacyImageSlot ? third : '';
      const slug = slugify(name || `item-${index + 1}`);
      return {
        id: slug || `item-${index + 1}`,
        slug: slug || `item-${index + 1}`,
        name,
        summary,
        description,
        imageUrl,
      };
    })
    .filter((item) => item.name || item.summary || item.description || item.imageUrl);
}

export function formatContentListItems(items: ContentListItem[]): string {
  return items
    .map((item) => [item.name, item.summary, item.description, item.imageUrl].map((value) => value.trim()).join(' | ').replace(/(?:\s+\|\s*)+$/, ''))
    .join('\n');
}
