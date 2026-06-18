// ===================== Domain Types =====================

export interface QEvent {
  id: string;           // UUID
  organization_id: string | null;
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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  status: 'active' | 'inactive' | 'archived';
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
  organization_id?: string | null;
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

export interface Experience {
  id: string;
  event_id: string;
  org_id: string | null;
  type: 'info' | 'check_in' | 'queue' | 'resource' | 'session';
  queue_id: string | null;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  location: string;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  metadata: Record<string, unknown>;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export type CreateOrganizationInput = Pick<
  Organization,
  'name' | 'slug' | 'description' | 'logo_url' | 'status'
>;

export type UpdateOrganizationInput = Partial<CreateOrganizationInput>;

export type CreateExperienceInput = Pick<
  Experience,
  'event_id' | 'name' | 'slug' | 'description' | 'image_url' | 'type' | 'status'
> & {
  org_id?: string | null;
  queue_id?: string | null;
  location?: string;
  sort_order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateExperienceInput = Partial<Omit<CreateExperienceInput, 'event_id' | 'org_id'>>;

export interface EventCheckIn {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  code: string | null;
  ticket_type: 'general' | 'flowers' | null;
  status: 'waiting' | 'called' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export type CreateEventCheckInInput = Pick<
  EventCheckIn,
  'event_id' | 'first_name' | 'last_name'
> & {
  code?: string | null;
};

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
