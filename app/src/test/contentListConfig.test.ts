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
        presentation_mode: 'child_cards',
        voting: {
          enabled: false,
          state: 'closed',
          credit_limit: 2,
        },
        items: [
          { name: 'VeeSafe', description: 'Cybersecurity guidance.' },
          { title: 'Quantum Fluent', summary: 'Technical content.' },
        ],
      },
    }))).toEqual({
      enabled: true,
      presentationMode: 'child_cards',
      title: 'i-Pitch Finalists',
      items: [
        { id: 'veesafe', slug: 'veesafe', name: 'VeeSafe', summary: 'Cybersecurity guidance.', description: 'Cybersecurity guidance.', imageUrl: '' },
        { id: 'quantum-fluent', slug: 'quantum-fluent', name: 'Quantum Fluent', summary: 'Technical content.', description: '', imageUrl: '' },
      ],
      voting: {
        enabled: false,
        open: false,
        creditLimit: 2,
      },
    });
  });

  it('parses and formats admin content list text', () => {
    const items = parseContentListItems('VeeSafe | Home summary | Full profile.\nQuantum Fluent | Legacy description | /images/qf.png');

    expect(items).toEqual([
      { id: 'veesafe', slug: 'veesafe', name: 'VeeSafe', summary: 'Home summary', description: 'Full profile.', imageUrl: '' },
      { id: 'quantum-fluent', slug: 'quantum-fluent', name: 'Quantum Fluent', summary: '', description: 'Legacy description', imageUrl: '/images/qf.png' },
    ]);
    expect(formatContentListItems(items)).toBe('VeeSafe | Home summary | Full profile.\nQuantum Fluent |  | Legacy description | /images/qf.png');
  });
});
