import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// ----- Admin: Event & Queue CRUD (kept for operator use during demo) -----
import AdminEventList from './pages/admin/AdminEventList';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminEventCheckIns from './pages/admin/AdminEventCheckIns';
import AdminQueueForm from './pages/admin/AdminQueueForm';
import AdminQueueDashboard from './pages/admin/AdminQueueDashboard';

// ----- Demo pages -----
import GuestEventDetail from './pages/guest/GuestEventDetail';
import GuestEventCheckIn from './pages/guest/GuestEventCheckIn';
import GuestQueueTicket from './pages/guest/GuestQueueTicket';
import KioskDisplay from './pages/demo/KioskDisplay';

import './styles/shared.css';

// Demo constants — all guest routes funnel through these
const DEMO_EVENT = 'peony-festival';

// Guard: only allow the demo event slug, else redirect to /demo
function DemoEventGuard() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  if (eventSlug !== DEMO_EVENT) return <Navigate to="/demo" replace />;
  return <GuestEventDetail />;
}

function DemoCheckInGuard() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  if (eventSlug !== DEMO_EVENT) return <Navigate to="/demo" replace />;
  return <GuestEventCheckIn />;
}

// Skip the queue landing page — go directly to ticket claim
function DemoQueueSkip() {
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  if (eventSlug !== DEMO_EVENT || !queueSlug) {
    return <Navigate to="/demo" replace />;
  }
  return <Navigate to={`/events/${eventSlug}/q/${queueSlug}/ticket`} replace />;
}

// Guard: allow any queue under the demo event
function DemoTicketGuard() {
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  if (eventSlug !== DEMO_EVENT || !queueSlug) {
    return <Navigate to="/demo" replace />;
  }
  return <GuestQueueTicket />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Demo entry points ===== */}
        {/* /demo and / both land on the I-Pitch event */}
        <Route path="/demo" element={<Navigate to={`/events/${DEMO_EVENT}`} replace />} />
        <Route path="/" element={<Navigate to="/demo" replace />} />

        {/* ===== Kiosk tablet display ===== */}
        <Route path="/kiosk/:eventSlug/:queueSlug" element={<KioskDisplay />} />

        {/* ===== Guest demo flow ===== */}
        {/* Event detail — guarded to ipitch-2026 only */}
        <Route path="/events/:eventSlug" element={<DemoEventGuard />} />
        <Route path="/events/:eventSlug/check-in" element={<DemoCheckInGuard />} />
        {/* Queue landing skipped — jumps straight to ticket */}
        <Route path="/events/:eventSlug/q/:queueSlug" element={<DemoQueueSkip />} />
        {/* Ticket page — guarded to demo queue only */}
        <Route path="/events/:eventSlug/q/:queueSlug/ticket" element={<DemoTicketGuard />} />

        {/* ===== Admin: kept for operator use ===== */}
        <Route path="/admin/events" element={<AdminEventList />} />
        <Route path="/admin/events/new" element={<AdminEventForm />} />
        <Route path="/admin/events/:eventId" element={<AdminEventDetail />} />
        <Route path="/admin/events/:eventId/check-ins" element={<AdminEventCheckIns />} />
        <Route path="/admin/events/:eventId/edit" element={<AdminEventForm />} />
        <Route path="/admin/events/:eventId/queues/new" element={<AdminQueueForm />} />
        <Route path="/admin/events/:eventId/queues/:queueId" element={<AdminQueueDashboard />} />
        <Route path="/admin/events/:eventId/queues/:queueId/edit" element={<AdminQueueForm />} />

        {/* Everything else → /demo */}
        <Route path="*" element={<Navigate to="/demo" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
