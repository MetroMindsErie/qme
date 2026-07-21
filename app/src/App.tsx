import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// ----- Admin: Event & Queue CRUD (kept for operator use during demo) -----
import AdminEventList from './pages/admin/AdminEventList';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminEventCheckIns from './pages/admin/AdminEventCheckIns';
import AdminGroupOrderDashboard from './pages/admin/AdminGroupOrderDashboard';
import AdminLanding from './pages/admin/AdminLanding';
import AdminQueueForm from './pages/admin/AdminQueueForm';
import AdminQueueDashboard from './pages/admin/AdminQueueDashboard';
import AdminOrganizationList from './pages/admin/AdminOrganizationList';
import AdminOrganizationDetail from './pages/admin/AdminOrganizationDetail';
import AdminPrincipalList from './pages/admin/AdminPrincipalList';
import AdminExpieForm from './pages/admin/AdminExpieForm';
import AdminEceForm from './pages/admin/AdminEceForm';
import AdminGate from './components/AdminGate';

// ----- Demo pages -----
import GuestEventDetail from './pages/guest/GuestEventDetail';
import GuestEventCheckIn from './pages/guest/GuestEventCheckIn';
import GuestGroupOrder from './pages/guest/GuestGroupOrder';
import GuestQueueTicket from './pages/guest/GuestQueueTicket';
import GuestEventList from './pages/guest/GuestEventList';
import SotcEntrySign from './pages/guest/SotcEntrySign';
import KioskDisplay from './pages/demo/KioskDisplay';
import { SOTC_PUBLIC_EVENT_SLUG } from './lib/sotc';

import './styles/shared.css';

// Public route aliases: keep demo links stable while root becomes the platform portal.
const DEMO_EVENT = 'peony-festival';

// Event routes render any event slug resolved by Supabase.
function EventPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  if (!eventSlug) return <Navigate to="/demo" replace />;
  return <GuestEventDetail />;
}

function EventCheckInPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  if (!eventSlug) return <Navigate to="/demo" replace />;
  return <GuestEventCheckIn />;
}

function EventGroupOrderPage() {
  const { eventSlug } = useParams<{ eventSlug: string }>();
  if (!eventSlug) return <Navigate to="/demo" replace />;
  return <GuestGroupOrder />;
}

function SotcRockHallPage() {
  return <GuestEventDetail eventSlugOverride={SOTC_PUBLIC_EVENT_SLUG} />;
}

// Skip the queue landing page — go directly to ticket claim
function QueueSkip() {
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  if (!eventSlug || !queueSlug) {
    return <Navigate to="/demo" replace />;
  }
  return <Navigate to={`/events/${eventSlug}/q/${queueSlug}/ticket?join=1`} replace />;
}

// Guard: allow any queue under the demo event
function QueueTicketPage() {
  const { eventSlug, queueSlug } = useParams<{ eventSlug: string; queueSlug: string }>();
  if (!eventSlug || !queueSlug) {
    return <Navigate to="/demo" replace />;
  }
  return <GuestQueueTicket />;
}

function AdminPage({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Demo entry points ===== */}
        {/* /demo preserves the Peony demo; / is the qME event portal. */}
        <Route path="/demo" element={<Navigate to={`/events/${DEMO_EVENT}`} replace />} />
        <Route path="/" element={<GuestEventList />} />
        <Route path="/sotc/rockhall/sign" element={<SotcEntrySign />} />
        <Route path="/sotc/rockhall" element={<SotcRockHallPage />} />
        <Route path="/sotc/:sotcSlug" element={<SotcRockHallPage />} />
        <Route path="/events/sotc-rockhall/sign" element={<SotcEntrySign />} />
        <Route path="/events/sotc-rockhall" element={<SotcRockHallPage />} />
        <Route path="/events/sotc-rock-hall" element={<SotcRockHallPage />} />

        {/* ===== Kiosk tablet display ===== */}
        <Route path="/kiosk/:eventSlug/:queueSlug" element={<KioskDisplay />} />

        {/* ===== Guest demo flow ===== */}
        {/* Event detail — guarded to ipitch-2026 only */}
        <Route path="/events/:eventSlug" element={<EventPage />} />
        <Route path="/events/:eventSlug/check-in" element={<EventCheckInPage />} />
        <Route path="/events/:eventSlug/group-order" element={<EventGroupOrderPage />} />
        {/* Queue landing skipped — jumps straight to ticket */}
        <Route path="/events/:eventSlug/q/:queueSlug" element={<QueueSkip />} />
        {/* Ticket page — guarded to demo queue only */}
        <Route path="/events/:eventSlug/q/:queueSlug/ticket" element={<QueueTicketPage />} />

        {/* ===== Admin: kept for operator use ===== */}
        <Route path="/admin" element={<AdminPage><AdminLanding /></AdminPage>} />
        <Route path="/admin/organizations" element={<AdminPage><AdminOrganizationList /></AdminPage>} />
        <Route path="/admin/organizations/:organizationId" element={<AdminPage><AdminOrganizationDetail /></AdminPage>} />
        <Route path="/admin/organizations/:organizationId/expies/new" element={<AdminPage><AdminExpieForm /></AdminPage>} />
        <Route path="/admin/organizations/:organizationId/expies/:expieId/edit" element={<AdminPage><AdminExpieForm /></AdminPage>} />
        <Route path="/admin/principals" element={<AdminPage><AdminPrincipalList /></AdminPage>} />
        <Route path="/admin/events" element={<AdminPage><AdminEventList /></AdminPage>} />
        <Route path="/admin/events/new" element={<AdminPage><AdminEventForm /></AdminPage>} />
        <Route path="/admin/events/:eventId" element={<AdminPage><AdminEventDetail /></AdminPage>} />
        <Route path="/admin/events/:eventId/check-ins" element={<AdminPage><AdminEventCheckIns /></AdminPage>} />
        <Route path="/admin/events/:eventId/group-order" element={<AdminPage><AdminGroupOrderDashboard /></AdminPage>} />
        <Route path="/admin/events/:eventId/edit" element={<AdminPage><AdminEventForm /></AdminPage>} />
        <Route path="/admin/events/:eventId/eces/new" element={<AdminPage><AdminEceForm /></AdminPage>} />
        <Route path="/admin/events/:eventId/eces/:eceId/edit" element={<AdminPage><AdminEceForm /></AdminPage>} />
        <Route path="/admin/events/:eventId/experiences/new" element={<AdminPage><AdminEceForm /></AdminPage>} />
        <Route path="/admin/events/:eventId/experiences/:eceId/edit" element={<AdminPage><AdminEceForm /></AdminPage>} />
        <Route path="/admin/events/:eventId/queues/new" element={<AdminPage><AdminQueueForm /></AdminPage>} />
        <Route path="/admin/events/:eventId/queues/:queueId" element={<AdminPage><AdminQueueDashboard /></AdminPage>} />
        <Route path="/admin/events/:eventId/queues/:queueId/edit" element={<AdminPage><AdminQueueForm /></AdminPage>} />

        {/* Everything else returns to the platform event portal. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
