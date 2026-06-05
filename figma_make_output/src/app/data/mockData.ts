// ─── Types ───────────────────────────────────────────────────────────────────

export type TicketStatus = 'waiting' | 'ready' | 'checked_in' | 'cancelled' | 'no_show';
export type QueueStatus  = 'active' | 'paused' | 'closed';
export type EventStatus  = 'upcoming' | 'live' | 'completed';

export interface Ticket {
  id: string;
  number: number;
  guestName: string;
  position: number;
  status: TicketStatus;
  joinedAt: string;
  calledAt?: string;
  checkedInAt?: string;
  counter?: string;
  notes?: string;
  waitMinutes: number;
  slaBreached: boolean;
  phone: string;
  email?: string;
}

export interface QueueMetrics {
  waiting: number;
  ready: number;
  serving: number;
  completed: number;
  avgWaitMin: number;
  slaBreachCount: number;
  peakHourWait: number;
}

export interface Counter {
  id: string;
  name: string;
  status: 'open' | 'busy' | 'closed';
  currentTicket?: string;
  agent?: string;
}

export interface Queue {
  id: string;
  name: string;
  description: string;
  status: QueueStatus;
  capacity: number;
  slaThresholdMin: number;
  counters: Counter[];
  metrics: QueueMetrics;
  tickets: Ticket[];
}

export interface BusinessHour {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  venue: string;
  status: EventStatus;
  checkInStart: string;
  checkInEnd: string;
  description: string;
  maxCapacity: number;
  notifyOnReady: boolean;
  notifySMS: boolean;
  notifyEmail: boolean;
  businessHours: BusinessHour[];
  queues: Queue[];
}

// ─── Guest ticket data (for prototype flow) ──────────────────────────────────

export const GUEST_TICKET: Ticket = {
  id:          'T-042',
  number:       42,
  guestName:   'Alex Johnson',
  position:     4,
  status:       'waiting',
  joinedAt:    '10:32 AM',
  waitMinutes:  11,
  slaBreached:  false,
  phone:       '+1 555-0142',
  email:       'alex@example.com',
  notes:       'VIP badge required',
};

// ─── Admin: counters ──────────────────────────────────────────────────────────

const generalCounters: Counter[] = [
  { id: 'C1', name: 'Counter 1', status: 'busy',   currentTicket: 'T-038', agent: 'Maria S.' },
  { id: 'C2', name: 'Counter 2', status: 'busy',   currentTicket: 'T-039', agent: 'James P.' },
  { id: 'C3', name: 'Counter 3', status: 'open',   agent: 'Lisa K.' },
];

const vipCounters: Counter[] = [
  { id: 'V1', name: 'VIP Lane 1', status: 'busy', currentTicket: 'V-005', agent: 'Tom R.' },
  { id: 'V2', name: 'VIP Lane 2', status: 'open', agent: 'Nina C.' },
];

const workshopCounters: Counter[] = [
  { id: 'W1', name: 'Desk A', status: 'busy',   currentTicket: 'W-012', agent: 'Paul M.' },
  { id: 'W2', name: 'Desk B', status: 'closed' },
];

// ─── Admin: tickets ───────────────────────────────────────────────────────────

export const GENERAL_TICKETS: Ticket[] = [
  { id:'T-040', number:40, guestName:'Sophie Bell',    position:1, status:'ready',      joinedAt:'10:28 AM', calledAt:'10:46 AM', counter:'Counter 2', waitMinutes:18, slaBreached:false, phone:'+1 555-0140' },
  { id:'T-041', number:41, guestName:'Chris Dunn',     position:2, status:'waiting',    joinedAt:'10:29 AM', waitMinutes:17, slaBreached:false, phone:'+1 555-0141' },
  { id:'T-042', number:42, guestName:'Alex Johnson',   position:3, status:'waiting',    joinedAt:'10:32 AM', waitMinutes:14, slaBreached:false, phone:'+1 555-0142', notes:'VIP badge' },
  { id:'T-043', number:43, guestName:'Priya Nair',     position:4, status:'waiting',    joinedAt:'10:33 AM', waitMinutes:13, slaBreached:false, phone:'+1 555-0143' },
  { id:'T-044', number:44, guestName:'Derek Fox',      position:5, status:'waiting',    joinedAt:'10:35 AM', waitMinutes:11, slaBreached:false, phone:'+1 555-0144' },
  { id:'T-045', number:45, guestName:'Yuna Kim',       position:6, status:'waiting',    joinedAt:'10:36 AM', waitMinutes:10, slaBreached:false, phone:'+1 555-0145' },
  { id:'T-046', number:46, guestName:'Marco Ricci',    position:7, status:'waiting',    joinedAt:'10:37 AM', waitMinutes: 9, slaBreached:false, phone:'+1 555-0146' },
  { id:'T-047', number:47, guestName:'Hana Müller',    position:8, status:'waiting',    joinedAt:'10:14 AM', waitMinutes:32, slaBreached:true,  phone:'+1 555-0147', notes:'Accessibility request' },
  { id:'T-048', number:48, guestName:'Raj Patel',      position:9, status:'waiting',    joinedAt:'10:10 AM', waitMinutes:36, slaBreached:true,  phone:'+1 555-0148' },
  { id:'T-038', number:38, guestName:'Linda Torres',   position:0, status:'checked_in', joinedAt:'10:18 AM', checkedInAt:'10:41 AM', waitMinutes:23, slaBreached:false, phone:'+1 555-0138' },
  { id:'T-039', number:39, guestName:'Ben Carter',     position:0, status:'checked_in', joinedAt:'10:20 AM', checkedInAt:'10:43 AM', waitMinutes:23, slaBreached:false, phone:'+1 555-0139' },
];

export const VIP_TICKETS: Ticket[] = [
  { id:'V-006', number:6, guestName:'Diana Prince',    position:1, status:'waiting', joinedAt:'10:39 AM', waitMinutes:7,  slaBreached:false, phone:'+1 555-0200' },
  { id:'V-007', number:7, guestName:'Oliver Stone',    position:2, status:'waiting', joinedAt:'10:40 AM', waitMinutes:6,  slaBreached:false, phone:'+1 555-0201' },
  { id:'V-005', number:5, guestName:'Elena Vasquez',   position:0, status:'checked_in', joinedAt:'10:30 AM', checkedInAt:'10:44 AM', waitMinutes:14, slaBreached:false, phone:'+1 555-0202' },
];

export const WORKSHOP_TICKETS: Ticket[] = [
  { id:'W-013', number:13, guestName:'Frank Lee',      position:1, status:'waiting', joinedAt:'10:25 AM', waitMinutes:21, slaBreached:true,  phone:'+1 555-0300', notes:'Seat reservation #12' },
  { id:'W-014', number:14, guestName:'Grace Hopper',   position:2, status:'waiting', joinedAt:'10:31 AM', waitMinutes:15, slaBreached:false, phone:'+1 555-0301' },
  { id:'W-012', number:12, guestName:'Ian Walsh',      position:0, status:'checked_in', joinedAt:'10:15 AM', checkedInAt:'10:40 AM', waitMinutes:25, slaBreached:false, phone:'+1 555-0302' },
];

// ─── Admin: queues ────────────────────────────────────────────────────────────

export const MOCK_QUEUES: Queue[] = [
  {
    id: 'q-general',
    name: 'General Check-in',
    description: 'Main entrance check-in for all attendees',
    status: 'active',
    capacity: 250,
    slaThresholdMin: 20,
    counters: generalCounters,
    metrics: {
      waiting:       8,
      ready:         1,
      serving:       2,
      completed:     52,
      avgWaitMin:    14,
      slaBreachCount: 2,
      peakHourWait:  22,
    },
    tickets: GENERAL_TICKETS,
  },
  {
    id: 'q-vip',
    name: 'VIP & Speakers',
    description: 'Priority lane for VIP guests and speakers',
    status: 'active',
    capacity: 50,
    slaThresholdMin: 10,
    counters: vipCounters,
    metrics: {
      waiting:       2,
      ready:         0,
      serving:       1,
      completed:     18,
      avgWaitMin:     6,
      slaBreachCount: 0,
      peakHourWait:   9,
    },
    tickets: VIP_TICKETS,
  },
  {
    id: 'q-workshop',
    name: 'Workshop Registration',
    description: 'Pre-registered workshop & lab sessions',
    status: 'active',
    capacity: 80,
    slaThresholdMin: 15,
    counters: workshopCounters,
    metrics: {
      waiting:       2,
      ready:         0,
      serving:       1,
      completed:     24,
      avgWaitMin:    18,
      slaBreachCount: 1,
      peakHourWait:  23,
    },
    tickets: WORKSHOP_TICKETS,
  },
];

// ─── Admin: event ─────────────────────────────────────────────────────────────

export const MOCK_EVENT: Event = {
  id:          'evt-2026-tc',
  name:        'TechConf 2026',
  date:        '2026-04-25',
  venue:       'Convention Center, Hall B',
  status:      'live',
  checkInStart:'08:00',
  checkInEnd:  '17:00',
  description: 'Annual technology conference featuring keynotes, workshops, and networking.',
  maxCapacity:  380,
  notifyOnReady: true,
  notifySMS:   true,
  notifyEmail: false,
  businessHours: [
    { day: 'Monday',    enabled: false, open: '09:00', close: '17:00' },
    { day: 'Tuesday',   enabled: false, open: '09:00', close: '17:00' },
    { day: 'Wednesday', enabled: false, open: '09:00', close: '17:00' },
    { day: 'Thursday',  enabled: false, open: '09:00', close: '17:00' },
    { day: 'Friday',    enabled: true,  open: '08:00', close: '18:00' },
    { day: 'Saturday',  enabled: true,  open: '08:00', close: '18:00' },
    { day: 'Sunday',    enabled: false, open: '09:00', close: '17:00' },
  ],
  queues: MOCK_QUEUES,
};

// ─── Token export JSON (for Components page) ─────────────────────────────────

export const TOKEN_JSON = {
  color: {
    primary: { default: '#0D9488', hover: '#0F766E', light: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4' },
    admin:   { default: '#1E3A5F', hover: '#152A47', light: '#2D5282', muted: '#4A6FA5' },
    success: { default: '#16A34A', bg: '#F0FDF4', border: '#86EFAC' },
    warning: { default: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
    danger:  { default: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
    info:    { default: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    neutral: {
      50:'#F8FAFC', 100:'#F1F5F9', 200:'#E2E8F0', 300:'#CBD5E1',
      400:'#94A3B8', 500:'#64748B', 600:'#475569', 700:'#334155',
      800:'#1E293B', 900:'#0F172A',
    },
  },
  radius: { xs:'4px', sm:'6px', md:'8px', lg:'10px', xl:'12px', '2xl':'16px', '3xl':'24px', full:'9999px' },
  shadow: {
    xs: '0 1px 2px rgba(15,23,42,0.05)',
    sm: '0 1px 3px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)',
    md: '0 4px 8px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
    lg: '0 6px 16px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)',
    xl: '0 12px 32px rgba(15,23,42,0.12), 0 4px 12px rgba(15,23,42,0.06)',
  },
  font: { family: "'Inter', system-ui, sans-serif", sizeBase: '16px' },
  motion: {
    durationFast: '150ms', duration: '220ms', durationSlow: '350ms',
    ease: 'cubic-bezier(0.4,0,0.2,1)',
  },
};
