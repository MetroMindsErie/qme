/**
 * Routing tests: verifies all new routes resolve to the correct pages.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Stub every page component to a simple marker
vi.mock('../pages/AdminDashboard', () => ({ default: () => <div data-testid="legacy-admin" /> }));
vi.mock('../pages/GuestSingleView', () => ({ default: () => <div data-testid="legacy-guest" /> }));
vi.mock('../pages/GuestQueueTicket', () => ({ default: () => <div data-testid="legacy-ticket" /> }));

vi.mock('../pages/admin/AdminEventList', () => ({ default: () => <div data-testid="admin-event-list" /> }));
vi.mock('../pages/admin/AdminEventForm', () => ({ default: () => <div data-testid="admin-event-form" /> }));
vi.mock('../pages/admin/AdminEventDetail', () => ({ default: () => <div data-testid="admin-event-detail" /> }));
vi.mock('../pages/admin/AdminQueueForm', () => ({ default: () => <div data-testid="admin-queue-form" /> }));
vi.mock('../pages/admin/AdminQueueDashboard', () => ({ default: () => <div data-testid="admin-queue-dashboard" /> }));

vi.mock('../pages/guest/GuestEventList', () => ({ default: () => <div data-testid="guest-event-list" /> }));
vi.mock('../pages/guest/GuestEventDetail', () => ({ default: () => <div data-testid="guest-event-detail" /> }));
vi.mock('../pages/guest/GuestQueueLanding', () => ({ default: () => <div data-testid="guest-queue-landing" /> }));
vi.mock('../pages/guest/GuestQueueTicket', () => ({ default: () => <div data-testid="guest-queue-ticket" /> }));

// Import App AFTER mocks – we wrap with MemoryRouter ourselves
// so we need to strip BrowserRouter from App. Instead, let's just
// import the routes definition from App.tsx.
// Since App exports a component with BrowserRouter, render it with MemoryRouter
// by mocking react-router-dom's BrowserRouter.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    // Make BrowserRouter a pass-through so MemoryRouter controls
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

import App from '../App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== Guest event/queue routes =====
  it('/events renders GuestEventList', () => {
    renderAt('/events');
    expect(screen.getByTestId('guest-event-list')).toBeInTheDocument();
  });

  it('/events/:slug renders GuestEventDetail', () => {
    renderAt('/events/food-truck-fest');
    expect(screen.getByTestId('guest-event-detail')).toBeInTheDocument();
  });

  it('/events/:slug/q/:qSlug renders GuestQueueLanding', () => {
    renderAt('/events/food-truck-fest/q/tacos');
    expect(screen.getByTestId('guest-queue-landing')).toBeInTheDocument();
  });

  it('/events/:slug/q/:qSlug/ticket renders GuestQueueTicket', () => {
    renderAt('/events/food-truck-fest/q/tacos/ticket');
    expect(screen.getByTestId('guest-queue-ticket')).toBeInTheDocument();
  });

  // ===== Admin event/queue routes =====
  it('/admin/events renders AdminEventList', () => {
    renderAt('/admin/events');
    expect(screen.getByTestId('admin-event-list')).toBeInTheDocument();
  });

  it('/admin/events/new renders AdminEventForm', () => {
    renderAt('/admin/events/new');
    expect(screen.getByTestId('admin-event-form')).toBeInTheDocument();
  });

  it('/admin/events/:id renders AdminEventDetail', () => {
    renderAt('/admin/events/abc-123');
    expect(screen.getByTestId('admin-event-detail')).toBeInTheDocument();
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

  // ===== Legacy routes =====
  it('/ renders legacy GuestSingleView', () => {
    renderAt('/');
    expect(screen.getByTestId('legacy-guest')).toBeInTheDocument();
  });

  it('/ticket renders legacy GuestQueueTicket', () => {
    renderAt('/ticket');
    expect(screen.getByTestId('legacy-ticket')).toBeInTheDocument();
  });

  it('/admin renders legacy AdminDashboard', () => {
    renderAt('/admin');
    expect(screen.getByTestId('legacy-admin')).toBeInTheDocument();
  });
});
