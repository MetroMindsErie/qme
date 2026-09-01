-- qME i-Pitch September 3, 2026 event setup.
-- Run with an authenticated event/organization admin or superadmin database context.
--
-- Intent:
-- - create/configure the actual i-Pitch production event for registration/check-in
-- - add a bounded voting prototype eCe using reusable vote-allocation metadata
-- - do not import attendees here; map the real Eventbrite export when supplied

do $$
declare
  target_event_id uuid;
  target_org_id uuid;
  target_ece_id uuid;
  voting_metadata jsonb := jsonb_build_object(
    'interaction_mode', 'vote_allocation',
    'home_section', 'interactive',
    'home_section_title', 'Interactive',
    'home_action_label', 'Vote',
    'voting', jsonb_build_object(
      'enabled', true,
      'state', 'open',
      'results_visibility', 'hidden',
      'credit_limit', 2,
      'choices', jsonb_build_array(
        jsonb_build_object(
          'id', 'veesafe',
          'name', 'VeeSafe',
          'description', 'VeeSafe Technology provides practical cybersecurity and compliance guidance for small businesses, startups, and technical founders. Our goal is to make security make sense by turning confusing requirements into clear actions businesses can actually use.'
        ),
        jsonb_build_object(
          'id', 'quantum-fluent',
          'name', 'Quantum Fluent',
          'description', 'Technical leaders and developers often struggle to find content that is both easy to understand and technically useful. Quantum Fluent helps them move forward with clear executive summaries for decision-makers and practical, hands-on technical content for builders.'
        ),
        jsonb_build_object(
          'id', 'vettor',
          'name', 'Vettor',
          'description', 'What if you walked into the dealership already knowing more than the salesperson? Vettor is the AI powered car-buying advocate in your pocket. Snap a photo of any offer and in seconds see every hidden fee, plus a deal score that shows exactly how your price stacks up against what real buyers actually paid. No more guessing. Know the price, skip the haggle, and save thousands.'
        ),
        jsonb_build_object(
          'id', 'corvita',
          'name', 'corVita',
          'description', 'corVita is a medical device startup developing corConnect, a universal adapter designed to improve compatibility between AED and defibrillator electrode pads. By reducing equipment-change delays during cardiac emergencies, corConnect aims to support faster, more seamless continuity of care from EMS arrival through hospital treatment.'
        )
      )
    )
  );
begin
  select id, organization_id
    into target_event_id, target_org_id
  from public.events
  where slug = 'ipitch-2026'
  order by created_at
  limit 1;

  if target_event_id is null then
    insert into public.events (
      name,
      slug,
      description,
      location,
      image_url,
      event_date,
      start_time,
      end_time,
      timezone,
      status,
      metadata
    )
    values (
      'i-Pitch',
      'ipitch-2026',
      'Registration/check-in for i-Pitch.',
      'Missing Falls Brewery, Akron',
      '',
      '2026-09-03',
      '17:00',
      '20:00',
      'ET',
      'active',
      jsonb_build_object(
        'check_in', jsonb_build_object(
          'enabled', true,
          'completion_mode', 'auto',
          'imported_registration_lookup_enabled', true,
          'self_registration', jsonb_build_object(
            'enabled', true,
            'required_fields', jsonb_build_array('first_name', 'last_name', 'email')
          ),
          'require_completed_for_participation', true
        )
      )
    )
    returning id, organization_id into target_event_id, target_org_id;
  else
    update public.events
    set
      name = 'i-Pitch',
      description = 'Registration/check-in for i-Pitch.',
      location = 'Missing Falls Brewery, Akron',
      event_date = '2026-09-03',
      start_time = '17:00',
      end_time = '20:00',
      timezone = 'ET',
      status = 'active',
      metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
        'check_in', jsonb_build_object(
          'enabled', true,
          'completion_mode', 'auto',
          'imported_registration_lookup_enabled', true,
          'self_registration', jsonb_build_object(
            'enabled', true,
            'required_fields', jsonb_build_array('first_name', 'last_name', 'email')
          ),
          'require_completed_for_participation', true
        )
      ),
      updated_at = now()
    where id = target_event_id;
  end if;

  select id
    into target_ece_id
  from public.eces
  where event_id = target_event_id
    and slug = 'ipitch-voting'
  order by created_at
  limit 1;

  if target_ece_id is null then
    insert into public.eces (
      event_id,
      expie_id,
      org_id,
      name,
      slug,
      description,
      image_url,
      type,
      queue_id,
      queue_behavior,
      sort_order,
      location,
      metadata,
      status
    )
    values (
      target_event_id,
      null,
      target_org_id,
      'i-Pitch Voting',
      'ipitch-voting',
      'Use two digital balls to vote for the competitors.',
      '',
      'resource',
      null,
      '',
      20,
      'Missing Falls Brewery',
      voting_metadata,
      'active'
    );
  else
    update public.eces
    set
      org_id = target_org_id,
      name = 'i-Pitch Voting',
      description = 'Use two digital balls to vote for the competitors.',
      image_url = '',
      type = 'resource',
      queue_id = null,
      queue_behavior = '',
      sort_order = 20,
      location = 'Missing Falls Brewery',
      metadata = voting_metadata,
      status = 'active',
      updated_at = now()
    where id = target_ece_id;
  end if;
end;
$$;
