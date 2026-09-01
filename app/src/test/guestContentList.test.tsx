import { render, screen } from '@testing-library/react';
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

function renderContentList() {
  return render(
    <MemoryRouter initialEntries={['/events/ipitch-092026/content/ipitch-finalists']}>
      <Routes>
        <Route path="/events/:eventSlug/content/:eceSlug" element={<GuestContentList />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GuestContentList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEventBySlug.mockResolvedValue(event);
    mockListActiveEcesForEvent.mockResolvedValue([finalistsEce]);
  });

  it('renders configured informational finalists content', async () => {
    renderContentList();

    expect(await screen.findByText('i-Pitch Finalists')).toBeInTheDocument();
    expect(screen.getByText("Meet tonight's four finalists.")).toBeInTheDocument();
    expect(screen.getByText('VeeSafe')).toBeInTheDocument();
    expect(screen.getByText('Cybersecurity guidance.')).toBeInTheDocument();
    expect(screen.getByText('Quantum Fluent')).toBeInTheDocument();
  });
});
