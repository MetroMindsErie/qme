import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminEventCheckIns from '../pages/admin/AdminEventCheckIns';
import type { CurrentAdminPrincipal } from '../lib/adminPrincipalService';
import type { EventCheckIn, QEvent } from '../types';

const mockGetEvent = vi.fn();
const mockGetCurrentAdminPrincipal = vi.fn();
const mockListEventCheckIns = vi.fn();
const mockListGuestCreditsForEvent = vi.fn();
const mockPreviewEventbriteRegistrationsForEvent = vi.fn();
const mockImportEventbriteRegistrationsForEvent = vi.fn();
const mockReadEventbriteRegistrationFile = vi.fn();
const mockUpdateEvent = vi.fn();

vi.mock('../components/Header', () => ({
  default: ({ titleLine1, titleLine2, hideMenu }: { titleLine1: string; titleLine2: string; hideMenu?: boolean }) => (
    <header>{titleLine1} {titleLine2}{hideMenu ? null : <button type="button" aria-label="Open menu">Menu</button>}</header>
  ),
}));

vi.mock('../lib/eventService', () => ({
  getEvent: (...args: unknown[]) => mockGetEvent(...args),
  updateEvent: (...args: unknown[]) => mockUpdateEvent(...args),
}));

vi.mock('../lib/adminPrincipalService', () => ({
  canManageEvent: () => true,
  getCurrentAdminPrincipal: () => mockGetCurrentAdminPrincipal(),
}));

vi.mock('../lib/checkInService', () => ({
  adminCancelEventCheckIn: vi.fn(),
  adminCompleteEventCheckIn: vi.fn(),
  adminUpdateEventCheckInTicketType: vi.fn(),
  listEventCheckIns: (...args: unknown[]) => mockListEventCheckIns(...args),
  onEventCheckInsChange: () => () => undefined,
}));

vi.mock('../lib/guestCreditService', () => ({
  adminGrantGuestCreditForCheckIn: vi.fn(),
  listGuestCreditsForEvent: (...args: unknown[]) => mockListGuestCreditsForEvent(...args),
}));

vi.mock('../lib/eventbriteRegistrationImport', () => ({
  EVENTBRITE_IMPORT_ACCEPT: '.csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  readEventbriteRegistrationFile: (...args: unknown[]) => mockReadEventbriteRegistrationFile(...args),
  previewEventbriteRegistrationsForEvent: (...args: unknown[]) => mockPreviewEventbriteRegistrationsForEvent(...args),
  importEventbriteRegistrationsForEvent: (...args: unknown[]) => mockImportEventbriteRegistrationsForEvent(...args),
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

const admin: CurrentAdminPrincipal = {
  principal: {
    id: 'principal-1',
    auth_user_id: 'auth-1',
    principal_type: 'person',
    display_name: 'Admin',
    email: 'admin@example.com',
    phone: null,
    status: 'active',
    metadata: {},
    created_at: '',
    updated_at: '',
  },
  platformRoles: [],
  organizationMemberships: [],
  eventStaffAssignments: [],
  isSuperadmin: true,
};

const untouchedCsv = [
  'Order Date,Last Name,Registration Answers,Email Address,Tickets,Company,Order ID,First Name,Attendee Status,Ticket Class',
  '2026-08-31,One,"How did you hear?,Partner",paul@example.com,1,UARF,1001,Paul,Attending,General Admission',
  '2026-09-01,Four,,pat@example.com,4,Vettor,1004,Pat,Attending,General Admission',
].join('\n');

const untouchedFileData = {
  sourceFileName: 'uarf-eventbrite.csv',
  format: 'csv' as const,
  rows: [
    ['Order Date', 'Last Name', 'Registration Answers', 'Email Address', 'Tickets', 'Company', 'Order ID', 'First Name', 'Attendee Status', 'Ticket Class'],
    ['2026-08-31', 'One', 'How did you hear?,Partner', 'paul@example.com', '1', 'UARF', '1001', 'Paul', 'Attending', 'General Admission'],
    ['2026-09-01', 'Four', '', 'pat@example.com', '4', 'Vettor', '1004', 'Pat', 'Attending', 'General Admission'],
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/events/event-1/check-ins']}>
      <Routes>
        <Route path="/admin/events/:eventId/check-ins" element={<AdminEventCheckIns />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminEventCheckIns Eventbrite import workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEvent.mockResolvedValue(event);
    mockGetCurrentAdminPrincipal.mockResolvedValue(admin);
    mockUpdateEvent.mockImplementation((_id: string, input: Partial<QEvent>) => Promise.resolve({ ...event, ...input }));
    mockListEventCheckIns.mockResolvedValue([]);
    mockListGuestCreditsForEvent.mockResolvedValue([]);
    mockReadEventbriteRegistrationFile.mockResolvedValue(untouchedFileData);
    mockPreviewEventbriteRegistrationsForEvent.mockResolvedValue({
      headers: ['Order Date', 'Last Name', 'Registration Answers', 'Email Address', 'Tickets', 'Company', 'Order ID', 'First Name', 'Attendee Status', 'Ticket Class'],
      headerMapping: {
        firstName: 'First Name',
        lastName: 'Last Name',
        email: 'Email Address',
        orderId: 'Order ID',
        tickets: 'Tickets',
        ticketType: 'Ticket Class',
      },
      recognized: {
        firstName: true,
        lastName: true,
        email: true,
        orderId: true,
        tickets: true,
        ticketType: true,
      },
      rows: [{ orderId: '1001' }, { orderId: '1004' }],
      invalidRows: [],
      rowCount: 2,
      sourceRowCount: 2,
      canonicalRegistrationCount: 2,
      totalGuestsRepresented: 5,
      newRegistrationCount: 1,
      skippedExistingCount: 1,
      skippedExistingOrderIds: ['1001'],
    });
    mockImportEventbriteRegistrationsForEvent.mockResolvedValue({
      processedCount: 2,
      insertedCount: 1,
      skippedExistingCount: 1,
      skippedExistingOrderIds: ['1001'],
      invalidRows: [],
      rows: [],
      headers: [],
      headerMapping: {},
      rowCount: 2,
      sourceRowCount: 2,
      canonicalRegistrationCount: 2,
      importBatchId: 'batch-1',
    });
  });

  it('previews an untouched Eventbrite CSV before explicit import', async () => {
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    const input = screen.getByLabelText('Eventbrite CSV or Excel');
    expect(input).toHaveAttribute('accept', expect.stringContaining('.xls'));
    expect(input).toHaveAttribute('accept', expect.stringContaining('.xlsx'));
    const file = new File([untouchedCsv], 'uarf-eventbrite.csv', { type: 'text/csv' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockReadEventbriteRegistrationFile).toHaveBeenCalledWith(file);
      expect(mockPreviewEventbriteRegistrationsForEvent).toHaveBeenCalledWith({
        eventId: event.id,
        fileData: untouchedFileData,
      });
    });
    expect(mockImportEventbriteRegistrationsForEvent).not.toHaveBeenCalled();
    expect(await screen.findByText('Eventbrite registration file recognized')).toBeInTheDocument();
    expect(screen.getByText('Source rows: 2')).toBeInTheDocument();
    expect(screen.getByText('Registrations / orders found: 2')).toBeInTheDocument();
    expect(screen.getByText('Email: recognized')).toBeInTheDocument();
    expect(screen.getByText('Order ID: recognized')).toBeInTheDocument();
    expect(screen.getByText('Tickets / party size: recognized')).toBeInTheDocument();
    expect(screen.getByText('Total registered guests represented: 5')).toBeInTheDocument();
    expect(screen.getByText('New registrations: 1')).toBeInTheDocument();
    expect(screen.getByText('Already imported/skipped: 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Import Registrations' }));

    await waitFor(() => {
      expect(mockImportEventbriteRegistrationsForEvent).toHaveBeenCalledWith({
        eventId: event.id,
        sourceFileName: 'uarf-eventbrite.csv',
        fileData: untouchedFileData,
      });
    });
    expect(await screen.findByText('Imported 1; skipped 1; invalid orders 0.')).toBeInTheDocument();
  });

  it('shows persisted additional attendees within one primary history entry', async () => {
    const completedParty: EventCheckIn = {
      id: 'check-in-party',
      event_id: event.id,
      first_name: 'Pat',
      last_name: 'Four',
      code: null,
      ticket_type: 'general',
      status: 'completed',
      metadata: {
        imported_registration_id: 'registration-party',
        external_order_id: '123456789',
        registered_party_size: 4,
        actual_party_size: 3,
        party_size: 3,
        tickets: 4,
        additional_attendees: [
          { role: 'additional_attendee', position: 1, external_order_id: '123456789-1', first_name: 'Ava', last_name: 'One' },
          { role: 'additional_attendee', position: 3, external_order_id: '123456789-3', first_name: 'Zed', last_name: 'Three' },
        ],
      },
      created_at: '',
      updated_at: '',
    };
    mockListEventCheckIns.mockResolvedValue([completedParty]);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'History' }));

    expect(await screen.findByText('Check-In History (1)')).toBeInTheDocument();
    expect(screen.getByText('Pat Four')).toBeInTheDocument();
    expect(screen.getByText(/Actual party size: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Registered tickets: 4/)).toBeInTheDocument();
    expect(screen.getByText(/Guest 1: Ava One/)).toBeInTheDocument();
    expect(screen.getByText(/123456789-1/)).toBeInTheDocument();
    expect(screen.getByText(/Guest 3: Zed Three/)).toBeInTheDocument();
    expect(screen.getByText(/123456789-3/)).toBeInTheDocument();
    expect(screen.queryByText('Guest 2:')).not.toBeInTheDocument();
  });

  it('persists check-in availability controls and exposes authenticated admin test link', async () => {
    mockGetEvent.mockResolvedValue({
      ...event,
      metadata: {
        check_in: {
          enabled: true,
          completion_mode: 'auto',
          availability_mode: 'closed',
          scheduled_open_time: '16:30',
          scheduled_close_time: '20:00',
        },
      },
    });
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
    expect(screen.getByText('Currently closed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Test Shared iPad' })).toHaveAttribute('href', '/events/ipitch-092026/check-in?mode=shared&adminTest=1');

    fireEvent.change(screen.getByDisplayValue('Closed'), { target: { value: 'scheduled' } });

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith('event-1', expect.objectContaining({
        metadata: expect.objectContaining({
          check_in: expect.objectContaining({
            availability_mode: 'scheduled',
            scheduled_open_time: '16:30',
            scheduled_close_time: '20:00',
            manual_opened_at: '',
            manual_closed_at: '',
          }),
        }),
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Open now' }));
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenLastCalledWith('event-1', expect.objectContaining({
        metadata: expect.objectContaining({
          check_in: expect.objectContaining({
            availability_mode: 'manual_open',
            manual_opened_at: expect.any(String),
            manual_closed_at: '',
          }),
        }),
      }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close now' }));
    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenLastCalledWith('event-1', expect.objectContaining({
        metadata: expect.objectContaining({
          check_in: expect.objectContaining({
            availability_mode: 'closed',
            manual_closed_at: expect.any(String),
          }),
        }),
      }));
    });
  });
});
