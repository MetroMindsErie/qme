import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ----- Legacy (single-queue) pages -----
import AdminDashboard from './pages/AdminDashboard';
import GuestSingleView from './pages/GuestSingleView';
import LegacyGuestQueueTicket from './pages/GuestQueueTicket';

// ----- Admin: Event & Queue CRUD -----
import AdminEventList from './pages/admin/AdminEventList';
import AdminEventForm from './pages/admin/AdminEventForm';
import AdminEventDetail from './pages/admin/AdminEventDetail';
import AdminQueueForm from './pages/admin/AdminQueueForm';
import AdminQueueDashboard from './pages/admin/AdminQueueDashboard';

// ----- Guest: Multi-event / multi-queue -----
import GuestEventList from './pages/guest/GuestEventList';
import GuestEventDetail from './pages/guest/GuestEventDetail';
import GuestQueueLanding from './pages/guest/GuestQueueLanding';
import GuestQueueTicket from './pages/guest/GuestQueueTicket';

import './styles/shared.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Guest: event / queue flow ===== */}
        <Route path="/events" element={<GuestEventList />} />
        <Route path="/events/:eventSlug" element={<GuestEventDetail />} />
        <Route path="/events/:eventSlug/q/:queueSlug" element={<GuestQueueLanding />} />
        <Route path="/events/:eventSlug/q/:queueSlug/ticket" element={<GuestQueueTicket />} />

        {/* ===== Admin: event / queue CRUD ===== */}
        <Route path="/admin/events" element={<AdminEventList />} />
        <Route path="/admin/events/new" element={<AdminEventForm />} />
        <Route path="/admin/events/:eventId" element={<AdminEventDetail />} />
        <Route path="/admin/events/:eventId/edit" element={<AdminEventForm />} />
        <Route path="/admin/events/:eventId/queues/new" element={<AdminQueueForm />} />
        <Route path="/admin/events/:eventId/queues/:queueId" element={<AdminQueueDashboard />} />
        <Route path="/admin/events/:eventId/queues/:queueId/edit" element={<AdminQueueForm />} />

        {/* ===== Legacy single-queue pages ===== */}
        <Route path="/" element={<GuestSingleView />} />
        <Route path="/ticket" element={<LegacyGuestQueueTicket />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Fallback → event list */}
        <Route path="*" element={<Navigate to="/events" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
