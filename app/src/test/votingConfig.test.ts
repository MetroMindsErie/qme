import { describe, expect, it } from 'vitest';
import { getVoteAllocationConfig, normalizeVoteAllocation, totalAllocatedVotes } from '../lib/votingConfig';
import type { Ece } from '../types';

function ece(metadata: Record<string, unknown>): Ece {
  return {
    id: 'ece-1',
    event_id: 'event-1',
    expie_id: null,
    org_id: null,
    type: 'resource',
    queue_id: null,
    queue_behavior: '',
    name: 'Voting',
    slug: 'voting',
    description: '',
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

describe('votingConfig', () => {
  it('reads reusable vote-allocation metadata', () => {
    expect(getVoteAllocationConfig(ece({
      interaction_mode: 'vote_allocation',
      voting: {
        state: 'open',
        results_visibility: 'hidden',
        credit_limit: 2,
        choices: [
          { id: 'one', name: 'One', description: 'First choice' },
          { id: 'two', name: 'Two', description: 'Second choice' },
        ],
      },
    }))).toEqual({
      enabled: true,
      open: true,
      resultsVisible: false,
      creditLimit: 2,
      choices: [
        { id: 'one', name: 'One', description: 'First choice' },
        { id: 'two', name: 'Two', description: 'Second choice' },
      ],
    });
  });

  it('caps allocation to the configured credit limit and known choices', () => {
    const choices = [
      { id: 'one', name: 'One', description: '' },
      { id: 'two', name: 'Two', description: '' },
    ];

    expect(normalizeVoteAllocation({ one: 2, two: 2, unknown: 5 }, choices, 2)).toEqual({ one: 2 });
  });

  it('totals allocated votes', () => {
    expect(totalAllocatedVotes({ one: 1, two: 1 })).toBe(2);
  });
});
