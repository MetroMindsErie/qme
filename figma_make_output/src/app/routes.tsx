import { createBrowserRouter, Navigate } from 'react-router';
import { Root } from './layouts/Root';
import { GuestTicketPage }    from './pages/GuestTicketPage';
import { GuestViewPage }      from './pages/GuestViewPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminEventPage }     from './pages/AdminEventPage';
import { ComponentsPage }     from './pages/ComponentsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, element: <Navigate to="/guest/ticket" replace /> },
      { path: 'guest/ticket',    Component: GuestTicketPage    },
      { path: 'guest/view',      Component: GuestViewPage      },
      { path: 'admin/dashboard', Component: AdminDashboardPage },
      { path: 'admin/event',     Component: AdminEventPage     },
      { path: 'components',      Component: ComponentsPage     },
      { path: '*',               element: <Navigate to="/guest/ticket" replace /> },
    ],
  },
]);
