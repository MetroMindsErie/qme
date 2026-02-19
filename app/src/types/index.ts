// ===================== Domain Types =====================

export interface QEvent {
  id: string;           // UUID
  name: string;
  slug: string;
  description: string;
  location: string;
  image_url: string;
  event_date: string | null;   // ISO date string
  start_time: string | null;   // HH:MM
  end_time: string | null;
  timezone: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Queue {
  id: string;           // UUID
  event_id: string;     // FK → events.id
  name: string;
  slug: string;
  description: string;
  image_url: string;
  now_serving: number;
  status: 'active' | 'paused' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  queue_id: string | null;
  status: 'waiting' | 'checked_in' | 'left' | 'served';
  created_at: string;
  checked_in_at: string | null;
  left_reason: string | null;
  left_at: string | null;
}

// ===================== Input DTOs =====================

export type CreateEventInput = Pick<
  QEvent,
  'name' | 'slug' | 'description' | 'location' | 'image_url' | 'timezone' | 'status'
> & {
  event_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type CreateQueueInput = Pick<
  Queue,
  'event_id' | 'name' | 'slug' | 'description' | 'image_url'
> & {
  status?: Queue['status'];
};

export type UpdateQueueInput = Partial<Omit<CreateQueueInput, 'event_id'>>;

// ===================== Snapshot =====================

export interface QueueSnapshot {
  now_serving: number;
  counts: {
    total: number;
    waiting: number;
    checked_in: number;
    left: number;
    served: number;
  };
  lastIssued: number;
}
