import { describe, expect, it } from 'vitest';
import { formatContentListItems, getContentListConfig, parseContentListItems } from '../lib/contentListConfig';
import type { Ece } from '../types';

function ece(metadata: Record<string, unknown>): Ece {
  return {
    id: 'ece-1',
    event_id: 'event-1',
    expie_id: null,
    org_id: null,
    type: 'info',
    queue_id: null,
    queue_behavior: '',
    name: 'i-Pitch Finalists',
    slug: 'ipitch-finalists',
    description: "Meet tonight's four finalists.",
    image_url: '',
    location: '',
    sort_order: 20,
    starts_at: null,
    ends_at: null,
    metadata,
    status: 'active',
    created_at: '',
    updated_at: '',
  };
}

describe('contentListConfig', () => {
  it('reads reusable content-list metadata', () => {
    expect(getContentListConfig(ece({
      interaction_mode: 'content_list',
      content_list: {
        title: 'i-Pitch Finalists',
        items: [
          { name: 'VeeSafe', description: 'Cybersecurity guidance.' },
          { title: 'Quantum Fluent', summary: 'Technical content.' },
        ],
      },
    }))).toEqual({
      enabled: true,
      title: 'i-Pitch Finalists',
      items: [
        { name: 'VeeSafe', description: 'Cybersecurity guidance.', imageUrl: '' },
        { name: 'Quantum Fluent', description: 'Technical content.', imageUrl: '' },
      ],
    });
  });

  it('parses and formats admin content list text', () => {
    const items = parseContentListItems('VeeSafe | Cybersecurity guidance.\nQuantum Fluent | Technical content. | /images/qf.png');

    expect(items).toEqual([
      { name: 'VeeSafe', description: 'Cybersecurity guidance.', imageUrl: '' },
      { name: 'Quantum Fluent', description: 'Technical content.', imageUrl: '/images/qf.png' },
    ]);
    expect(formatContentListItems(items)).toBe('VeeSafe | Cybersecurity guidance.\nQuantum Fluent | Technical content. | /images/qf.png');
  });
});
