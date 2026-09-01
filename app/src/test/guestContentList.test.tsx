import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GuestContentList from '../pages/guest/GuestContentList';
import type { Ece, QEvent } from '../types';

const event: QEvent = {
  id: 'event-1',
  organization_id: null,
  name: 'i-Pitch',
  slug: 'ipitch-092026',
  description: '',
  location: '',
  image_url: '/images/i-pitch.png',
  event_date: '2026-09-03',
  start_time: '17:00',
  end_time: '20:00',
  timezone: 'ET',
  status: 'active',
  metadata: {},
  created_at: '',
  updated_at: '',
};

const finalistsEce: Ece = {
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
  metadata: {
    interaction_mode: 'content_list',
    content_list: {
      title: 'i-Pitch Finalists',
      items: [
        { name: 'VeeSafe', description: 'Cybersecurity guidance.' },
        { name: 'Quantum Fluent', description: 'Technical content.' },
      ],
    },
  },
  status: 'active',
  created_at: '',
  updated_at: '',
};

const mockGetEventBySlug = vi.fn();
const mockListActiveEcesForEvent = vi.fn();
const mockGetEventCheckIn = vi.fn();

vi.mock('../components/Header', () => ({
  default: ({ titleLine1, titleLine2 }: { titleLine1: string; titleLine2: string }) => (
    <header>{titleLine1} {titleLine2}</header>
  ),
}));

vi.mock('../lib/eventService', () => ({
  getEventBySlug: (...args: unknown[]) => mockGetEventBySlug(...args),
}));

vi.mock('../lib/eceService', () => ({
  listActiveEcesForEvent: (...args: unknown[]) => mockListActiveEcesForEvent(...args),
}));

vi.mock('../lib/checkInService', () => ({
  getEventCheckIn: (...args: unknown[]) => mockGetEventCheckIn(...args),
}));

function renderContentList(path = '/events/ipitch-092026/content/ipitch-finalists') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/events/:eventSlug/content/:eceSlug" element={<GuestContentList />} />
        <Route path="/events/:eventSlug/content/:eceSlug/:itemSlug" element={<GuestContentList />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestContentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockGetEventBySlug.mockResolvedValue(event);
    mockListActiveEcesForEvent.mockResolvedValue([finalistsEce]);
    mockGetEventCheckIn.mockResolvedValue({
      id: 'check-in-1',
      event_id: event.id,
      first_name: 'Test',
      last_name: 'Guest',
      code: null,
      ticket_type: 'general',
      status: 'completed',
      metadata: {},
      created_at: '',
      updated_at: '',
    });
  });

  it('renders configured informational finalists content', async () => {
    renderContentList();

    expect(await screen.findByText('i-Pitch Finalists')).toBeInTheDocument();
    expect(screen.getByText("Meet tonight's four finalists.")).toBeInTheDocument();
    expect(screen.getByText('VeeSafe')).toBeInTheDocument();
    expect(screen.getByText('Cybersecurity guidance.')).toBeInTheDocument();
    expect(screen.getByText('Quantum Fluent')).toBeInTheDocument();
  });

  it('opens an individual child detail without showing inactive voting controls', async () => {
    mockListActiveEcesForEvent.mockResolvedValue([{
      ...finalistsEce,
      metadata: {
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
            { name: 'VeeSafe', summary: 'Cybersecurity guidance.', description: 'Full VeeSafe profile.' },
          ],
        },
      },
    }]);

    renderContentList('/events/ipitch-092026/content/ipitch-finalists/veesafe');

    expect(await screen.findByText('VeeSafe')).toBeInTheDocument();
    expect(screen.getByText('Full VeeSafe profile.')).toBeInTheDocument();
    expect(screen.queryByText(/votes remaining/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /vote/i })).not.toBeInTheDocument();
  });

  it('renders full child detail without summary text or optional image placeholders', async () => {
    mockListActiveEcesForEvent.mockResolvedValue([{
      ...finalistsEce,
      metadata: {
        interaction_mode: 'content_list',
        content_list: {
          title: 'i-Pitch Finalists',
          presentation_mode: 'child_cards',
          items: [
            { name: 'VeeSafe', summary: 'Home-card summary only.', description: 'Full detail for the child page.' },
          ],
        },
      },
    }]);

    renderContentList('/events/ipitch-092026/content/ipitch-finalists/veesafe');

    expect(await screen.findByText('Full detail for the child page.')).toBeInTheDocument();
    expect(screen.queryByText('Home-card summary only.')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Event' })).toHaveStyle({ marginTop: '1rem' });
  });

  it('commits child-attached prototype votes only after confirmation', async () => {
    mockListActiveEcesForEvent.mockResolvedValue([{
      ...finalistsEce,
      metadata: {
        interaction_mode: 'content_list',
        content_list: {
          title: 'i-Pitch Finalists',
          presentation_mode: 'child_cards',
          voting: {
            enabled: true,
            state: 'open',
            credit_limit: 2,
          },
          items: [
            { name: 'Vettor', summary: 'Car-buying advocate.', description: 'Full Vettor profile.' },
          ],
        },
      },
    }]);
    localStorage.setItem(`qme:eventCheckIn:${event.id}`, JSON.stringify({ id: 'check-in-1' }));

    renderContentList('/events/ipitch-092026/content/ipitch-finalists/vettor');

    expect(await screen.findByText('2 votes remaining')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Give Vettor a vote' }));
    expect(await screen.findByText('Give Vettor a vote?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Vote' }));

    expect(await screen.findByText('1 vote remaining')).toBeInTheDocument();
    expect(screen.getByText('Your vote')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Give Vettor a vote' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Vote' }));

    expect(await screen.findByText('0 votes remaining')).toBeInTheDocument();
    expect(screen.getByText('Your vote x2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No votes remaining' })).toBeDisabled();
  });
});
