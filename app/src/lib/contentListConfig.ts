import type { Ece } from '../types';

export interface ContentListItem {
  name: string;
  description: string;
  imageUrl: string;
}

export interface ContentListConfig {
  enabled: boolean;
  title: string;
  items: ContentListItem[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function getContentListConfig(ece: Ece | null | undefined): ContentListConfig {
  const metadata = asRecord(ece?.metadata);
  const contentList = asRecord(metadata.content_list || metadata.contentList);
  const rawItems = Array.isArray(contentList.items) ? contentList.items : [];

  return {
    enabled: metadata.interaction_mode === 'content_list' || contentList.enabled === true,
    title: asString(contentList.title) || ece?.name || '',
    items: rawItems
      .map((item) => {
        const record = asRecord(item);
        return {
          name: asString(record.name || record.title),
          description: asString(record.description || record.summary || record.note),
          imageUrl: asString(record.image_url || record.imageUrl),
        };
      })
      .filter((item) => item.name || item.description || item.imageUrl),
  };
}

export function parseContentListItems(value: string): ContentListItem[] {
  return value
    .split(/\r?\n/)
    .map((line) => {
      const [name = '', description = '', imageUrl = ''] = line.split('|');
      return {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
      };
    })
    .filter((item) => item.name || item.description || item.imageUrl);
}

export function formatContentListItems(items: ContentListItem[]): string {
  return items
    .map((item) => [item.name, item.description, item.imageUrl].map((value) => value.trim()).join(' | ').replace(/\s+\|\s+$/, ''))
    .join('\n');
}
