import type { Ece } from '../types';

export interface VoteChoice {
  id: string;
  name: string;
  description: string;
}

export interface VoteAllocationConfig {
  enabled: boolean;
  open: boolean;
  resultsVisible: boolean;
  creditLimit: number;
  choices: VoteChoice[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asPositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? Math.floor(value)
    : fallback;
}

export function getVoteAllocationConfig(ece: Ece | null | undefined): VoteAllocationConfig {
  const metadata = asRecord(ece?.metadata);
  const voting = asRecord(metadata.voting);
  const rawChoices = Array.isArray(voting.choices) ? voting.choices : [];

  return {
    enabled: metadata.interaction_mode === 'vote_allocation' || voting.enabled === true,
    open: voting.state !== 'closed',
    resultsVisible: voting.results_visibility === 'visible',
    creditLimit: asPositiveInteger(voting.credit_limit, 2),
    choices: rawChoices
      .map((choice) => {
        const record = asRecord(choice);
        return {
          id: asString(record.id || record.slug || record.name),
          name: asString(record.name || record.title),
          description: asString(record.description || record.summary),
        };
      })
      .filter((choice) => choice.id && choice.name),
  };
}

export function normalizeVoteAllocation(
  allocation: Record<string, number>,
  choices: VoteChoice[],
  creditLimit: number
): Record<string, number> {
  const allowedChoiceIds = new Set(choices.map((choice) => choice.id));
  const next: Record<string, number> = {};
  let remaining = Math.max(0, creditLimit);

  for (const choice of choices) {
    if (!allowedChoiceIds.has(choice.id) || remaining <= 0) continue;
    const value = Math.max(0, Math.floor(allocation[choice.id] ?? 0));
    const accepted = Math.min(value, remaining);
    if (accepted > 0) next[choice.id] = accepted;
    remaining -= accepted;
  }

  return next;
}

export function totalAllocatedVotes(allocation: Record<string, number>): number {
  return Object.values(allocation).reduce((total, value) => total + Math.max(0, Math.floor(value)), 0);
}
