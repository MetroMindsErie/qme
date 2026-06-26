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
  metadata?: Record<string, unknown>;
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
  join_status?: 'open' | 'paused' | 'closed';
  run_mode?: 'manual' | 'auto';
  standby_threshold?: number;
  max_active_released?: number;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  queue_id: string | null;
  ticket_number?: number | null;
  first_name?: string;
  last_name?: string;
  stage?: 'waiting' | 'standby' | 'released' | 'completed' | 'cancelled' | 'left';
  status: 'waiting' | 'checked_in' | 'left' | 'served';
  created_at: string;
  checked_in_at: string | null;
  left_reason: string | null;
  left_at: string | null;
  stage_updated_at?: string;
  nearby_confirmed_at?: string | null;
  released_at?: string | null;
  completed_at?: string | null;
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
  metadata?: Record<string, unknown>;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type CreateQueueInput = Pick<
  Queue,
  'event_id' | 'name' | 'slug' | 'description' | 'image_url'
> & {
  status?: Queue['status'];
};

export type UpdateQueueInput = Partial<Omit<CreateQueueInput, 'event_id'>> & Partial<Pick<
  Queue,
  'join_status' | 'run_mode' | 'standby_threshold' | 'max_active_released'
>>;

export interface Expie {
  id: string;
  organization_id: string | null;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  type: 'info' | 'check_in' | 'queue' | 'resource' | 'session';
  default_queue_behavior: string;
  default_metadata: Record<string, unknown>;
  status: 'draft' | 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface Ece {
  id: string;
  event_id: string;
  expie_id: string | null;
  org_id: string | null;
  type: 'info' | 'check_in' | 'queue' | 'resource' | 'session';
  queue_id: string | null;
  queue_behavior: string;
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

export interface AdminPrincipal {
  id: string;
  auth_user_id: string | null;
  principal_type: 'person' | 'station' | 'service_provider' | 'support';
  display_name: string;
  email: string | null;
  phone: string | null;
  status: 'invited' | 'active' | 'suspended' | 'archived';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PlatformRole {
  id: string;
  principal_id: string;
  role: 'superadmin' | 'support';
  status: 'active' | 'suspended' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  id: string;
  organization_id: string;
  principal_id: string;
  role: 'org_admin' | 'universal_staff';
  status: 'invited' | 'active' | 'suspended' | 'archived';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EventStaffAssignment {
  id: string;
  event_id: string;
  organization_id: string;
  principal_id: string;
  role: 'event_admin' | 'check_in_staff' | 'service_staff' | 'station_account' | 'service_provider';
  queue_id: string | null;
  ece_id: string | null;
  status: 'invited' | 'active' | 'suspended' | 'archived';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type CreateEceInput = Pick<
  Ece,
  'event_id' | 'name' | 'slug' | 'description' | 'image_url' | 'type' | 'status'
> & {
  expie_id?: string | null;
  org_id?: string | null;
  queue_id?: string | null;
  queue_behavior?: string;
  location?: string;
  sort_order?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  metadata?: Record<string, unknown>;
};

export type UpdateEceInput = Partial<Omit<CreateEceInput, 'event_id' | 'org_id'>>;

export type Experience = Ece;
export type CreateExperienceInput = CreateEceInput;
export type UpdateExperienceInput = UpdateEceInput;

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

export interface EventGuestMark {
  id: string;
  event_id: string;
  ticket_id: number | null;
  check_in_id: string | null;
  mark_key: string;
  mark_value: string;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EventGuestCredit {
  id: string;
  event_id: string;
  ticket_id: number | null;
  check_in_id: string | null;
  credit_key: string;
  quantity: number;
  used_quantity: number;
  source: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

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
