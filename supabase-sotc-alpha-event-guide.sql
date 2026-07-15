-- qME SOTC alpha event-guide content.
-- Run after supabase-org-event-foundation.sql, supabase-expie-ece-foundation.sql,
-- and supabase-sotc-queue-pilot.sql.
--
-- This keeps the guest event home generic: sections are driven by expie/eCe
-- metadata instead of hard-coded SOTC UI. Scan-Code Adventure remains available
-- as an internal/demo station, but it is hidden from the July guest home.

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
      'Full Event Schedule',
      'tonights-schedule-guide',
      'Use this quick schedule to orient yourself during the mixer.',
      '/images/sotc-logo.png',
      'session',
      jsonb_build_object(
        'home_section', 'schedule',
        'home_section_title', 'Full Event Schedule',
        'home_section_order', 10,
        'home_items_limit', 6,
        'home_items', jsonb_build_array(
          jsonb_build_object(
            'title', '5:30-7:30 PM',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'Registration', 'value', 'Level 1'),
              jsonb_build_object('label', 'Sponsors', 'value', 'Level 0'),
              jsonb_build_object('label', 'Professional headshots', 'value', 'Level 3')
            )
          ),
          jsonb_build_object(
            'title', '5:30-8:30 PM',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'Resume + LinkedIn reviews', 'value', 'Level 0'),
              jsonb_build_object('label', 'Networking, hors d''oeuvres, mocktail and cocktail bar', 'value', 'Level 1')
            ),
            'note', 'Card only bar; access to lower level gallery'
          ),
          jsonb_build_object(
            'title', '6:15-6:45 PM',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'Welcome & greetings', 'value', 'Level 1')
            )
          ),
          jsonb_build_object(
            'title', '7:00-8:00 PM',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'Pop-up mini workshops at The Garage', 'value', 'Level 2')
            )
          ),
          jsonb_build_object(
            'title', '7:00-8:30 PM',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'All galleries open for viewing', 'value', 'All levels')
            )
          ),
          jsonb_build_object(
            'title', '8:45 PM',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'Close', 'value', 'All levels')
            )
          )
        )
      )
    ),
    (
      'Resume Reviews',
      'resume-review-guide',
      'Meet with a reviewer for resume feedback and career conversation.',
      '/images/sotc-resume-reviews.png',
      'info',
      jsonb_build_object(
        'home_section', 'more_experiences',
        'home_section_title', 'More to Explore',
        'home_section_order', 70,
        'home_badge', 'Career'
      )
    ),
    (
      'Networking',
      'networking-guide',
      'Use the mixer to meet students, professionals, alumni, and employers.',
      '/images/sotc-networking.png',
      'info',
      jsonb_build_object(
        'home_section', 'more_experiences',
        'home_section_title', 'More to Explore',
        'home_section_order', 70,
        'home_badge', 'Mixer'
      )
    ),
    (
      'Featured Speakers',
      'featured-speakers-guide',
      'Pop-up mini workshops at The Garage from 7:00 to 8:00 PM.',
      '/images/sotc-speaker-lectern.png',
      'session',
      jsonb_build_object(
        'home_section', 'speakers',
        'home_section_title', 'Featured Speakers',
        'home_section_order', 40,
        'home_items_layout', 'media_rows',
        'home_items_limit', 6,
        'home_items', jsonb_build_array(
          jsonb_build_object('title', '5 Networks that turn College Connections into Career Gold', 'meta', '7:00-7:20 PM / Garage 1', 'note', 'Megan Vogias, Evlogimenos', 'image_url', '/images/speaker-megan-vogias-temp.svg'),
          jsonb_build_object('title', 'Personal Branding', 'meta', '7:00-7:20 PM / Garage 2', 'note', 'Alex Michaels, Prelude2Cinema Inc.', 'image_url', '/images/speaker-alex-michaels-temp.svg'),
          jsonb_build_object('title', 'Career Tips with McMaster Carr', 'meta', '7:20-7:40 PM / Garage 1', 'note', 'Representative from McMaster Carr', 'image_url', '/images/speaker-mcmaster-temp.svg'),
          jsonb_build_object('title', 'Preparing for Law School and the Legal Field', 'meta', '7:20-7:40 PM / Garage 2', 'note', 'Adam Joines, United States Attorney''s Office', 'image_url', '/images/speaker-adam-joines-temp.svg'),
          jsonb_build_object('title', 'How to decide if grad school is the right move for you', 'meta', '7:40-8:00 PM / Garage 1', 'note', 'Marleni Chavana, UB Greensfelder LLP', 'image_url', '/images/speaker-marleni-chavana-temp.svg'),
          jsonb_build_object('title', 'Planning to buy your first house!', 'meta', '7:40-8:00 PM / Garage 2', 'note', 'Heather Weddle, American Pacific Mortgage', 'image_url', '/images/speaker-heather-weddle-temp.svg')
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
        'home_section_order', 50,
        'home_items_layout', 'media_rows',
        'home_items_limit', 5,
        'home_items', jsonb_build_array(
          jsonb_build_object('title', 'Sherwin-Williams', 'image_url', '/images/sherwin-williams.png', 'image_variant', 'wide'),
          jsonb_build_object('title', 'MetroHealth', 'image_url', '/images/MetroHealth.png', 'image_variant', 'wide'),
          jsonb_build_object('title', 'McMaster-Carr', 'image_url', '/images/mcmaster-carr.png', 'image_variant', 'wide'),
          jsonb_build_object('title', 'Rock & Roll Hall of Fame', 'note', 'Venue partner', 'image_url', '/images/rock&roll-hall-of-fame.png', 'image_variant', 'wide'),
          jsonb_build_object('title', 'Summer on the Cuyahoga', 'note', 'Event host')
        )
      )
    ),
    (
      'Food & Drinks',
      'food-drinks-guide',
      'Hors d''oeuvres and the mocktail/cocktail bar are on Level 1.',
      '/images/sotc-food-drinks.png',
      'resource',
      jsonb_build_object(
        'home_section', 'food_drinks',
        'home_section_title', 'Food & Drinks',
        'home_section_order', 60,
        'home_items_limit', 9,
        'home_items', jsonb_build_array(
          jsonb_build_object('title', 'Bacon Wrapped Brisket with Peach BBQ', 'meta', 'GF'),
          jsonb_build_object('title', 'Garden Fresh Vegetables with Ranch Dip'),
          jsonb_build_object('title', 'Garlic Parmesan Potato Croquette', 'meta', 'VG'),
          jsonb_build_object('title', 'Heirloom Tomato Bruschetta', 'meta', 'VG'),
          jsonb_build_object('title', 'Marinated Cucumber with Edamame Hummus', 'meta', 'VG/GF'),
          jsonb_build_object('title', 'Mini Chicken Meatballs with Mongolian BBQ'),
          jsonb_build_object('title', 'Raspberry and Brie Puff Pastry', 'meta', 'V'),
          jsonb_build_object('title', 'Traditional House Made Hummus with Naan'),
          jsonb_build_object('title', 'Mocktail/Cocktail Bar', 'note', 'Credit card only')
        )
      )
    ),
    (
      'Mixer Resources',
      'resources-guide',
      'Open the SOTC mixer resources page for the digital guide and event materials.',
      '/images/sotc-logo.png',
      'resource',
      jsonb_build_object(
        'home_section', 'resources',
        'home_section_title', 'Event Resources',
        'home_section_order', 30,
        'home_url', 'https://www.canva.com/design/DAHNDWvk1Us/bqgkWOqfYwW2JQWMBB87cg/edit',
        'home_action_label', 'Open',
        'home_items_limit', 2,
        'home_items', jsonb_build_array(
          jsonb_build_object(
            'title', 'Sticker Guide',
            'note', 'Open the guide to sticker colors and guest interests.',
            'detail_presentation', 'modal',
            'details', jsonb_build_array(
              jsonb_build_object('label', 'Communication & Marketing', 'color', '#6a9f1f'),
              jsonb_build_object('label', 'Education', 'color', '#0f4c9a'),
              jsonb_build_object('label', 'Economics & Business', 'color', '#8b5bbd'),
              jsonb_build_object('label', 'Humanities & Art', 'color', '#d84a96'),
              jsonb_build_object('label', 'Healthcare', 'color', '#cf3a26'),
              jsonb_build_object('label', 'Law & Public Policy', 'color', '#f28c1b'),
              jsonb_build_object('label', 'Academia', 'color', '#f5df2e'),
              jsonb_build_object('label', 'Nonprofit & Social Impact', 'color', '#df6f7f'),
              jsonb_build_object('label', 'S.T.E.M', 'color', '#5f6f9f')
            )
          )
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
    when 'tonights-schedule-guide' then 20
    when 'resources-guide' then 50
    when 'featured-speakers-guide' then 60
    when 'sponsors-guide' then 70
    when 'food-drinks-guide' then 80
    when 'resume-review-guide' then 90
    when 'networking-guide' then 95
    else 100
  end,
  expies.default_metadata,
  'active'
from public.events
join public.organizations on organizations.id = events.organization_id
join public.expies on expies.organization_id = organizations.id
  and expies.slug in (
    'tonights-schedule-guide',
    'resume-review-guide',
    'networking-guide',
    'featured-speakers-guide',
    'sponsors-guide',
    'food-drinks-guide',
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
    when 'tonights-schedule-guide' then 20
    when 'resources-guide' then 50
    when 'featured-speakers-guide' then 60
    when 'sponsors-guide' then 70
    when 'food-drinks-guide' then 80
    when 'resume-review-guide' then 90
    when 'networking-guide' then 95
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
    'tonights-schedule-guide',
    'resume-review-guide',
    'networking-guide',
    'featured-speakers-guide',
    'sponsors-guide',
    'food-drinks-guide',
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
    'home_visible', false,
    'home_badge', 'Demo'
  )
from public.events
where eces.event_id = events.id
  and events.slug = 'sotc-test-check-in'
  and eces.slug = 'scan-code-adventure';
