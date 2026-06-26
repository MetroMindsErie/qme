/**
 * Routing tests for the current demo-focused app shell.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../pages/admin/AdminEventList', () => ({ default: () => <div data-testid="admin-event-list" /> }));
vi.mock('../pages/admin/AdminEventForm', () => ({ default: () => <div data-testid="admin-event-form" /> }));
vi.mock('../pages/admin/AdminEventDetail', () => ({ default: () => <div data-testid="admin-event-detail" /> }));
vi.mock('../pages/admin/AdminEventCheckIns', () => ({ default: () => <div data-testid="admin-event-check-ins" /> }));
vi.mock('../pages/admin/AdminQueueForm', () => ({ default: () => <div data-testid="admin-queue-form" /> }));
vi.mock('../pages/admin/AdminQueueDashboard', () => ({ default: () => <div data-testid="admin-queue-dashboard" /> }));

vi.mock('../pages/guest/GuestEventDetail', () => ({ default: () => <div data-testid="guest-event-detail" /> }));
vi.mock('../pages/guest/GuestEventCheckIn', () => ({ default: () => <div data-testid="guest-event-check-in" /> }));
vi.mock('../pages/guest/GuestQueueTicket', () => ({ default: () => <div data-testid="guest-queue-ticket" /> }));
vi.mock('../pages/demo/KioskDisplay', () => ({ default: () => <div data-testid="kiosk-display" /> }));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import App from '../App';

function renderAt(path: string, options?: { adminUnlocked?: boolean }) {
  sessionStorage.clear();
  const shouldUnlockAdmin = options?.adminUnlocked ?? path.startsWith('/admin');
  if (shouldUnlockAdmin) {
    sessionStorage.setItem('qme:adminAccess', '1');
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('/ and /demo land on the demo event', () => {
    renderAt('/');
    expect(screen.getByTestId('guest-event-detail')).toBeInTheDocument();
  });

  it('/events/peony-festival renders the guest event detail', () => {
    renderAt('/events/peony-festival');
    expect(screen.getByTestId('guest-event-detail')).toBeInTheDocument();
  });

  it('/events/:slug redirects non-demo events to the demo event', () => {
    renderAt('/events/food-truck-fest');
    expect(screen.getByTestId('guest-event-detail')).toBeInTheDocument();
  });

  it('/events/peony-festival/check-in renders event check-in', () => {
    renderAt('/events/peony-festival/check-in');
    expect(screen.getByTestId('guest-event-check-in')).toBeInTheDocument();
  });

  it('/events/peony-festival/q/:queueSlug redirects to the ticket page', () => {
    renderAt('/events/peony-festival/q/bouquets');
    expect(screen.getByTestId('guest-queue-ticket')).toBeInTheDocument();
  });

  it('/events/peony-festival/q/:queueSlug/ticket renders the queue ticket', () => {
    renderAt('/events/peony-festival/q/bouquets/ticket');
    expect(screen.getByTestId('guest-queue-ticket')).toBeInTheDocument();
  });

  it('/kiosk/:eventSlug/:queueSlug renders the kiosk display', () => {
    renderAt('/kiosk/peony-festival/bouquets');
    expect(screen.getByTestId('kiosk-display')).toBeInTheDocument();
  });

  it('/admin/events renders AdminEventList', () => {
    renderAt('/admin/events');
    expect(screen.getByText('Temporary admin access')).toBeInTheDocument();
    expect(screen.getByTestId('admin-event-list')).toBeInTheDocument();
  });

  it('/admin/events is hidden behind the admin gate when locked', async () => {
    renderAt('/admin/events', { adminUnlocked: false });
    expect(await screen.findByText('Sign in')).toBeInTheDocument();
    expect(screen.queryByTestId('admin-event-list')).not.toBeInTheDocument();
  });

  it('/admin/events/new renders AdminEventForm', () => {
    renderAt('/admin/events/new');
    expect(screen.getByTestId('admin-event-form')).toBeInTheDocument();
  });

  it('/admin/events/:id renders AdminEventDetail', () => {
    renderAt('/admin/events/abc-123');
    expect(screen.getByTestId('admin-event-detail')).toBeInTheDocument();
  });

  it('/admin/events/:id/check-ins renders AdminEventCheckIns', () => {
    renderAt('/admin/events/abc-123/check-ins');
    expect(screen.getByTestId('admin-event-check-ins')).toBeInTheDocument();
  });

  it('/admin/events/:id/edit renders AdminEventForm', () => {
    renderAt('/admin/events/abc-123/edit');
    expect(screen.getByTestId('admin-event-form')).toBeInTheDocument();
  });

  it('/admin/events/:id/queues/new renders AdminQueueForm', () => {
    renderAt('/admin/events/abc-123/queues/new');
    expect(screen.getByTestId('admin-queue-form')).toBeInTheDocument();
  });

  it('/admin/events/:id/queues/:qid renders AdminQueueDashboard', () => {
    renderAt('/admin/events/abc-123/queues/q-456');
    expect(screen.getByTestId('admin-queue-dashboard')).toBeInTheDocument();
  });

  it('/admin/events/:id/queues/:qid/edit renders AdminQueueForm', () => {
    renderAt('/admin/events/abc-123/queues/q-456/edit');
    expect(screen.getByTestId('admin-queue-form')).toBeInTheDocument();
  });
});
