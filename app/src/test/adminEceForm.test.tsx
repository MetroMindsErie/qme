import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEceForm from '../pages/admin/AdminEceForm';
import type { Ece, Expie, QEvent } from '../types';

const mockNavigate = vi.fn();
const mockCreateEce = vi.fn();
const mockGetEce = vi.fn();
const mockUpdateEce = vi.fn();
const mockGetEvent = vi.fn();
const mockListExpiesForOrganization = vi.fn();
const mockCreateQueue = vi.fn();
const mockListQueuesForEvent = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../components/Header', () => ({
  default: ({ titleLine1, titleLine2, hideMenu }: { titleLine1: string; titleLine2: string; hideMenu?: boolean }) => (
    <header>{titleLine1} {titleLine2}{hideMenu ? null : <button type="button" aria-label="Open menu">Menu</button>}</header>
  ),
}));

vi.mock('../lib/eceService', () => ({
  createEce: (...args: unknown[]) => mockCreateEce(...args),
  getEce: (...args: unknown[]) => mockGetEce(...args),
  updateEce: (...args: unknown[]) => mockUpdateEce(...args),
}));

vi.mock('../lib/eventService', () => ({
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
}));

vi.mock('../lib/expieService', () => ({
  listExpiesForOrganization: (...args: unknown[]) => mockListExpiesForOrganization(...args),
}));

vi.mock('../lib/queueService', () => ({
  createQueue: (...args: unknown[]) => mockCreateQueue(...args),
  listQueuesForEvent: (...args: unknown[]) => mockListQueuesForEvent(...args),
}));

const event: QEvent = {
  id: 'event-1',
  organization_id: 'org-1',
  name: 'i-Pitch',
  slug: 'ipitch-092026',
  description: '',
  location: '',
  image_url: '',
  event_date: '2026-09-03',
  start_time: '17:00',
  end_time: '20:00',
  timezone: 'ET',
  status: 'active',
  metadata: {},
  created_at: '',
  updated_at: '',
};

const expie: Expie = {
  id: 'expie-1',
  organization_id: 'org-1',
  name: 'Event Content List',
  slug: 'event-content-list',
  description: '',
  image_url: '',
  type: 'info',
  default_queue_behavior: '',
  default_metadata: {},
  status: 'active',
  created_at: '',
  updated_at: '',
};

const ece: Ece = {
  id: 'ece-finalists',
  event_id: event.id,
  expie_id: expie.id,
  org_id: 'org-1',
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
      enabled: true,
      title: 'i-Pitch Finalists',
      presentation_mode: 'detail_list',
      items: [
        { name: 'VeeSafe', description: 'Cybersecurity guidance.' },
      ],
    },
  },
  status: 'active',
  created_at: '',
  updated_at: '',
};

function renderForm() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/event-1/eces/ece-finalists/edit']}>
      <Routes>
        <Route path="/admin/events/:eventId/eces/:eceId/edit" element={<AdminEceForm />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminEceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEvent.mockResolvedValue(event);
    mockListQueuesForEvent.mockResolvedValue([]);
    mockListExpiesForOrganization.mockResolvedValue([expie]);
    mockGetEce.mockResolvedValue(ece);
    mockUpdateEce.mockResolvedValue(ece);
  });

  it('persists edits to reusable Event Feature collection presentation', async () => {
    renderForm();

    const nameInputs = await screen.findAllByDisplayValue('i-Pitch Finalists');
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Event' })).toBeInTheDocument();
    fireEvent.change(nameInputs[0], { target: { value: 'Meet the Founders' } });
    fireEvent.change(screen.getByDisplayValue('Single card opens detail list'), { target: { value: 'child_cards' } });
    fireEvent.change(screen.getByPlaceholderText('Open'), { target: { value: 'Meet' } });
    fireEvent.change(screen.getByDisplayValue(/VeeSafe/), {
      target: {
        value: 'Quantum Fluent | Technical content | Full Quantum Fluent profile. | /images/qf.png',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(mockUpdateEce).toHaveBeenCalledWith('ece-finalists', expect.objectContaining({
        name: 'Meet the Founders',
        metadata: expect.objectContaining({
          interaction_mode: 'content_list',
          home_action_label: 'Meet',
          content_list: expect.objectContaining({
            enabled: true,
            presentation_mode: 'child_cards',
            items: [
              expect.objectContaining({
                name: 'Quantum Fluent',
                summary: 'Technical content',
                description: 'Full Quantum Fluent profile.',
                imageUrl: '/images/qf.png',
              }),
            ],
          }),
        }),
      }));
    });
    expect(mockNavigate).toHaveBeenCalledWith('/admin/events/event-1');
  });
});
