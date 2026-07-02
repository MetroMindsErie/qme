-- qME SOTC alpha event-guide content.
-- Run after supabase-org-event-foundation.sql, supabase-expie-ece-foundation.sql,
-- and supabase-sotc-queue-pilot.sql.
--
-- This keeps the guest event home generic: sections are driven by expie/eCe
-- metadata instead of hard-coded SOTC UI. Scan-Code Adventure remains available
-- as an optional demo station, but Headshots becomes the primary featured item.

insert into public.expies (
  organization_id,
  name,
  slug,
  description,
  image_url,
  type,
  default_queue_behavior,
  default_metadata,
  status
)
select
  organizations.id,
  guide.name,
  guide.slug,
  guide.description,
  guide.image_url,
  guide.type,
  '',
  guide.metadata,
  'active'
from public.organizations
cross join (
  values
    (
      'Resume Reviews',
      'resume-review-guide',
      'Meet with a reviewer for resume feedback and career conversation.',
      '/images/qmeFirstLogo.jpg',
      'info',
      jsonb_build_object(
        'home_section', 'featured_experiences',
        'home_section_title', 'Featured Experiences',
        'home_section_order', 20,
        'home_badge', 'Career'
      )
    ),
    (
      'Networking',
      'networking-guide',
      'Use the mixer to meet students, professionals, alumni, and employers.',
      '/images/sotc-logo.png',
      'info',
      jsonb_build_object(
        'home_section', 'featured_experiences',
        'home_section_title', 'Featured Experiences',
        'home_section_order', 20,
        'home_badge', 'Mixer'
      )
    ),
    (
      'Featured Speakers',
      'featured-speakers-guide',
      'See the light program moments and featured conversations for tonight.',
      '/images/sotc-logo.png',
      'session',
      jsonb_build_object(
        'home_section', 'speakers',
        'home_section_title', 'Featured Speakers',
        'home_section_order', 30,
        'home_items', jsonb_build_array(
          jsonb_build_object('title', 'Welcome and SOTC remarks', 'meta', '7:00 PM', 'note', 'Main program'),
          jsonb_build_object('title', 'Career and community conversations', 'meta', 'During mixer', 'note', 'Watch for host updates')
        )
      )
    ),
    (
      'Sponsors',
      'sponsors-guide',
      'Thanks to the organizations helping make tonight possible.',
      '/images/sotc-logo.png',
      'resource',
      jsonb_build_object(
        'home_section', 'sponsors',
        'home_section_title', 'Sponsors',
        'home_section_order', 40,
        'home_items', jsonb_build_array(
          jsonb_build_object('title', 'Summer on the Cuyahoga', 'note', 'Event host'),
          jsonb_build_object('title', 'Rock & Roll Hall of Fame', 'note', 'Venue partner')
        )
      )
    ),
    (
      'Resources',
      'resources-guide',
      'Helpful links, program notes, and things to explore during the event.',
      '/images/qmeFirstLogo.jpg',
      'resource',
      jsonb_build_object(
        'home_section', 'resources',
        'home_section_title', 'Resources',
        'home_section_order', 50,
        'home_items', jsonb_build_array(
          jsonb_build_object('title', 'Event program', 'note', 'Use this as your companion for the night'),
          jsonb_build_object('title', 'Gallery and venue highlights', 'note', 'Look for spaces worth exploring'),
          jsonb_build_object('title', 'Career resources', 'note', 'Keep useful links and follow-ups here')
        )
      )
    )
) as guide(name, slug, description, image_url, type, metadata)
where organizations.slug = 'summer-on-the-cuyahoga'
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  type = excluded.type,
  default_queue_behavior = excluded.default_queue_behavior,
  default_metadata = excluded.default_metadata,
  status = excluded.status,
  updated_at = now();

insert into public.eces (
  event_id,
  expie_id,
  org_id,
  name,
  slug,
  description,
  image_url,
  type,
  queue_behavior,
  location,
  sort_order,
  metadata,
  status
)
select
  events.id,
  expies.id,
  organizations.id,
  expies.name,
  expies.slug,
  expies.description,
  expies.image_url,
  expies.type,
  '',
  '',
  case expies.slug
    when 'resume-review-guide' then 30
    when 'networking-guide' then 40
    when 'featured-speakers-guide' then 50
    when 'sponsors-guide' then 60
    when 'resources-guide' then 70
    else 100
  end,
  expies.default_metadata,
  'active'
from public.events
join public.organizations on organizations.id = events.organization_id
join public.expies on expies.organization_id = organizations.id
  and expies.slug in (
    'resume-review-guide',
    'networking-guide',
    'featured-speakers-guide',
    'sponsors-guide',
    'resources-guide'
  )
where events.slug = 'sotc-test-check-in'
  and not exists (
    select 1
    from public.eces existing
    where existing.event_id = events.id
      and existing.slug = expies.slug
  );

update public.eces
set
  expie_id = expies.id,
  name = expies.name,
  description = expies.description,
  image_url = expies.image_url,
  type = expies.type,
  sort_order = case expies.slug
    when 'resume-review-guide' then 30
    when 'networking-guide' then 40
    when 'featured-speakers-guide' then 50
    when 'sponsors-guide' then 60
    when 'resources-guide' then 70
    else eces.sort_order
  end,
  metadata = expies.default_metadata,
  status = 'active'
from public.events
join public.organizations on organizations.id = events.organization_id
join public.expies on expies.organization_id = organizations.id
where eces.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and expies.slug = eces.slug
  and eces.slug in (
    'resume-review-guide',
    'networking-guide',
    'featured-speakers-guide',
    'sponsors-guide',
    'resources-guide'
  );

update public.eces
set
  sort_order = 10,
  metadata = coalesce(eces.metadata, '{}'::jsonb) || jsonb_build_object(
    'home_section', 'featured_experiences',
    'home_section_title', 'Featured Experiences',
    'home_section_order', 20,
    'home_badge', 'Featured'
  )
from public.events
where eces.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and eces.slug = 'headshot-photo-station';

update public.eces
set
  sort_order = 80,
  metadata = coalesce(eces.metadata, '{}'::jsonb) || jsonb_build_object(
    'home_section', 'optional_demo',
    'home_section_title', 'Optional Demo Station',
    'home_section_order', 80,
    'home_badge', 'Demo'
  )
from public.events
where eces.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and eces.slug = 'scan-code-adventure';
