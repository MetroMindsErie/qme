import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/Header';
import { createEce, getEce, updateEce } from '../../lib/eceService';
import { formatContentListItems, getContentListConfig, parseContentListItems } from '../../lib/contentListConfig';
import { getEvent } from '../../lib/eventService';
import { listExpiesForOrganization } from '../../lib/expieService';
import { createQueue, listQueuesForEvent } from '../../lib/queueService';
import { isSotcEventSlug } from '../../lib/sotc';
import { slugify } from '../../lib/utils';
import type { CreateEceInput, Expie, QEvent, Queue } from '../../types';
import '../../styles/shared.css';
import '../../styles/admin.css';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export default function AdminEceForm() {
  const navigate = useNavigate();
  const { eventId, eceId } = useParams<{ eventId: string; eceId: string }>();
  const isEdit = Boolean(eceId);

  const [event, setEvent] = useState<QEvent | null>(null);
  const [expies, setExpies] = useState<Expie[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [form, setForm] = useState<Omit<CreateEceInput, 'event_id'>>({
    expie_id: null,
    org_id: null,
    name: '',
    slug: '',
    description: '',
    image_url: '',
    type: 'info',
    queue_id: null,
    queue_behavior: '',
    location: '',
    sort_order: 100,
    starts_at: null,
    ends_at: null,
    status: 'active',
    metadata: {},
  });
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      try {
        const [ev, qs] = await Promise.all([
          getEvent(eventId),
          listQueuesForEvent(eventId),
        ]);
        setEvent(ev);
        setQueues(qs);
        setForm((prev) => ({ ...prev, org_id: ev.organization_id }));

        if (ev.organization_id) {
          setExpies(await listExpiesForOrganization(ev.organization_id));
        }

        if (eceId) {
          const ece = await getEce(eceId);
          setForm({
            expie_id: ece.expie_id,
            org_id: ece.org_id,
            name: ece.name,
            slug: ece.slug,
            description: ece.description,
            image_url: ece.image_url,
            type: ece.type,
            queue_id: ece.queue_id,
            queue_behavior: ece.queue_behavior,
            location: ece.location,
            sort_order: ece.sort_order,
            starts_at: ece.starts_at,
            ends_at: ece.ends_at,
            status: ece.status,
            metadata: ece.metadata || {},
          });
          setAutoSlug(false);
        }
      } catch (error) {
        console.error('Failed to load eCe form', error);
        alert('Could not load eCe form.');
        navigate(eventId ? `/admin/events/${eventId}` : '/admin/events');
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, eceId, navigate]);

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => {
      const nullableFields = new Set<keyof typeof form>([
        'expie_id',
        'org_id',
        'queue_id',
        'starts_at',
        'ends_at',
      ]);
      const next = {
        ...prev,
        [field]:
          field === 'sort_order'
            ? Number(value) || 100
            : nullableFields.has(field)
            ? value || null
            : value,
      };
      if (field === 'name' && autoSlug) {
        next.slug = slugify(value);
      }
      if (field === 'expie_id') {
        const selectedExpie = expies.find((expie) => expie.id === value);
        if (selectedExpie) {
          next.name = selectedExpie.name;
          next.slug = selectedExpie.slug;
          next.description = selectedExpie.description;
          next.image_url = selectedExpie.image_url;
          next.type = selectedExpie.type;
          next.queue_behavior = selectedExpie.default_queue_behavior;
          next.metadata = selectedExpie.default_metadata;
          setAutoSlug(false);
        }
      }
      if (field === 'type' && value !== 'queue') {
        next.queue_id = null;
        next.queue_behavior = '';
      }
      return next;
    });
    if (field === 'slug') setAutoSlug(false);
  }

  function updateContentListSettings(
    patch: Partial<{
      enabled: boolean;
      presentationMode: 'detail_list' | 'expanded_home' | 'child_cards';
      title: string;
      actionLabel: string;
      itemsText: string;
      votingEnabled: boolean;
      votingOpen: boolean;
      votingCreditLimit: number;
    }>
  ) {
    setForm((prev) => {
      const metadata = asRecord(prev.metadata);
      const existingContentList = asRecord(metadata.content_list);
      const currentConfig = getContentListConfig({
        id: '',
        event_id: eventId || '',
        expie_id: prev.expie_id ?? null,
        org_id: prev.org_id ?? null,
        type: prev.type,
        queue_id: prev.queue_id ?? null,
        queue_behavior: prev.queue_behavior || '',
        name: prev.name,
        slug: prev.slug,
        description: prev.description,
        image_url: prev.image_url,
        location: prev.location || '',
        sort_order: prev.sort_order ?? 100,
        starts_at: prev.starts_at ?? null,
        ends_at: prev.ends_at ?? null,
        metadata,
        status: prev.status ?? 'active',
        created_at: '',
        updated_at: '',
      });
      const enabled = patch.enabled ?? currentConfig.enabled;
      return {
        ...prev,
        metadata: {
          ...metadata,
          interaction_mode: enabled ? 'content_list' : metadata.interaction_mode === 'content_list' ? '' : metadata.interaction_mode,
          home_action_label: patch.actionLabel ?? (typeof metadata.home_action_label === 'string' ? metadata.home_action_label : ''),
          content_list: {
            ...existingContentList,
            enabled,
            presentation_mode: patch.presentationMode ?? currentConfig.presentationMode,
            title: patch.title ?? currentConfig.title,
            items: patch.itemsText !== undefined
              ? parseContentListItems(patch.itemsText)
              : currentConfig.items,
            voting: {
              ...asRecord(existingContentList.voting),
              enabled: patch.votingEnabled ?? currentConfig.voting.enabled,
              state: patch.votingOpen ?? currentConfig.voting.open ? 'open' : 'closed',
              credit_limit: patch.votingCreditLimit ?? currentConfig.voting.creditLimit,
            },
          },
        },
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventId || !form.expie_id || !form.name.trim() || !form.slug?.trim()) {
      alert('Choose an expie, and confirm name and slug are filled in.');
      return;
    }

    setSaving(true);
    try {
      let queueId = form.queue_id;

      if (form.type === 'queue' && !queueId) {
        const existingQueue = queues.find((queue) => queue.slug === form.slug);

        if (existingQueue) {
          queueId = existingQueue.id;
        } else {
          const queue = await createQueue({
            event_id: eventId,
            name: form.name.trim(),
            slug: form.slug.trim(),
            description: form.description || '',
            image_url: form.image_url || '',
            status: 'active',
          });
          queueId = queue.id;
        }
      }

      const payload = {
        ...form,
        queue_id: form.type === 'queue' ? queueId : null,
      };

      if (isEdit && eceId) {
        await updateEce(eceId, payload);
      } else {
        await createEce({
          ...payload,
          event_id: eventId,
        });
      }
      navigate(`/admin/events/${eventId}`);
    } catch (error) {
      console.error('Save failed', error);
      alert('Save failed. Check console for details.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>
      </div>
    );
  }

  const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '0.8rem',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    marginBottom: 5,
    color: '#2f3e4f',
  };
  const inputStyle: React.CSSProperties = {
    padding: '0.55rem 0.65rem',
    border: '1.5px solid #d1d5db',
    borderRadius: 8,
    fontSize: '0.95rem',
    width: '100%',
    boxSizing: 'border-box',
  };
  const eventLogoSrc = isSotcEventSlug(event?.slug)
    ? '/images/sotc-logo.png'
    : event?.image_url || '/images/qmeFirstLogo.jpg';
  const contentListConfig = getContentListConfig({
    id: '',
    event_id: eventId || '',
    expie_id: form.expie_id ?? null,
    org_id: form.org_id ?? null,
    type: form.type,
    queue_id: form.queue_id ?? null,
    queue_behavior: form.queue_behavior || '',
    name: form.name,
    slug: form.slug,
    description: form.description,
    image_url: form.image_url,
    location: form.location || '',
    sort_order: form.sort_order ?? 100,
    starts_at: form.starts_at ?? null,
    ends_at: form.ends_at ?? null,
    metadata: form.metadata ?? {},
    status: form.status ?? 'active',
    created_at: '',
    updated_at: '',
  });
  const formMetadata = asRecord(form.metadata);
  const contentListItemsText = formatContentListItems(contentListConfig.items);

  return (
    <div className="card card-scrollable" style={{ minHeight: '600px', maxHeight: '90vh' }}>
      <Header logoSrc={eventLogoSrc} titleLine1="ADMIN" titleLine2="eCe" />

      <div style={{ padding: '0 1.25rem 0.75rem', borderBottom: '2px solid #e0e0e0' }}>
        <h1 className="headline" style={{ fontSize: '1.35rem', margin: 0, fontWeight: 800 }}>
          {isEdit ? 'Edit Event eCe' : 'Add Event eCe'}
        </h1>
        <p style={{ color: '#666', margin: '0.35rem 0 0' }}>
          {event?.name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="scrollable-content" style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Reusable Expie *</label>
          <select
            style={inputStyle}
            value={form.expie_id || ''}
            onChange={(e) => handleChange('expie_id', e.target.value)}
            required
          >
            <option value="">Choose an expie</option>
            {expies.map((expie) => (
              <option key={expie.id} value={expie.id}>
                {expie.name} ({expie.type.replace('_', '-')})
              </option>
            ))}
          </select>
          {expies.length === 0 && (
            <span style={{ color: '#B71C1C', fontSize: '0.82rem', marginTop: 6 }}>
              This organization needs a reusable expie before you can add an eCe.
            </span>
          )}
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>eCe Name *</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Registration Check-In"
            required
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Slug *</label>
          <input
            style={inputStyle}
            value={form.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            placeholder="registration-check-in"
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Type</label>
            <select
              style={inputStyle}
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="info">Info</option>
              <option value="check_in">Check-In</option>
              <option value="queue">Queue</option>
              <option value="resource">Resource</option>
              <option value="session">Session</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Status</label>
            <select
              style={inputStyle}
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Sort</label>
            <input
              style={inputStyle}
              type="number"
              value={form.sort_order ?? 100}
              onChange={(e) => handleChange('sort_order', e.target.value)}
            />
          </div>
        </div>

        {form.type === 'queue' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Queue Behavior</label>
              <select
                style={inputStyle}
                value={form.queue_behavior || ''}
                onChange={(e) => handleChange('queue_behavior', e.target.value)}
              >
                <option value="">Choose later</option>
                <option value="numbered">Numbered queue</option>
                <option value="check_in_service">Check-in/service queue</option>
                <option value="standby_gather">Standby/gather queue</option>
              </select>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Linked Queue Engine</label>
              <select
                style={inputStyle}
                value={form.queue_id || ''}
                onChange={(e) => handleChange('queue_id', e.target.value)}
              >
                <option value="">No queue linked yet</option>
                {queues.map((queue) => (
                  <option key={queue.id} value={queue.id}>
                    {queue.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="What should guests know?"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Location at Event</label>
          <input
            style={inputStyle}
            value={form.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Level 1 registration table"
          />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Image URL</label>
          <input
            style={inputStyle}
            value={form.image_url || ''}
            onChange={(e) => handleChange('image_url', e.target.value)}
            placeholder="/images/example.jpg"
          />
        </div>

        {(form.type === 'info' || form.type === 'resource' || form.type === 'session') && (
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', marginTop: '0.25rem', background: '#f8fafc' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#2f3e4f' }}>Guest Detail List</h2>
            <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: '#334155', fontWeight: 700, lineHeight: 1.4 }}>
              <input
                type="checkbox"
                checked={contentListConfig.enabled}
                onChange={(e) => updateContentListSettings({ enabled: e.target.checked })}
                style={{ marginTop: 3 }}
              />
              Open this eCe as a guest-facing list
            </label>
            <div style={{ ...fieldStyle, marginTop: '0.85rem' }}>
              <label style={labelStyle}>Guest Presentation</label>
              <select
                style={inputStyle}
                value={contentListConfig.presentationMode}
                onChange={(e) => updateContentListSettings({
                  presentationMode: e.target.value as 'detail_list' | 'expanded_home' | 'child_cards',
                  enabled: true,
                })}
              >
                <option value="detail_list">Single card opens detail list</option>
                <option value="expanded_home">Expanded list on event home</option>
                <option value="child_cards">Child cards on event home</option>
              </select>
            </div>
            <div style={{ ...fieldStyle, marginTop: '0.85rem' }}>
              <label style={labelStyle}>Detail View Title</label>
              <input
                style={inputStyle}
                value={contentListConfig.title}
                onChange={(e) => updateContentListSettings({ title: e.target.value, enabled: true })}
                placeholder="i-Pitch Finalists"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Card Action Label</label>
              <input
                style={inputStyle}
                value={typeof formMetadata.home_action_label === 'string' ? formMetadata.home_action_label : ''}
                onChange={(e) => updateContentListSettings({ actionLabel: e.target.value, enabled: true })}
                placeholder="Open"
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>List Items</label>
              <textarea
                style={{ ...inputStyle, minHeight: 160, resize: 'vertical' }}
                value={contentListItemsText}
                onChange={(e) => updateContentListSettings({ itemsText: e.target.value, enabled: true })}
                placeholder="Name | Description | optional image URL"
              />
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.35, marginTop: 6 }}>
                Enter one item per line as: Name | Summary | Full detail | optional image URL. Existing Name | Description | optional image URL lines remain supported.
              </span>
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem' }}>
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: '#334155', fontWeight: 700, lineHeight: 1.4 }}>
                <input
                  type="checkbox"
                  checked={contentListConfig.voting.enabled}
                  onChange={(e) => updateContentListSettings({ votingEnabled: e.target.checked, enabled: true })}
                  style={{ marginTop: 3 }}
                />
                Enable prototype voting controls on child detail pages
              </label>
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: '#334155', fontWeight: 700, lineHeight: 1.4, marginTop: '0.65rem' }}>
                <input
                  type="checkbox"
                  checked={contentListConfig.voting.open}
                  onChange={(e) => updateContentListSettings({ votingOpen: e.target.checked, enabled: true })}
                  disabled={!contentListConfig.voting.enabled}
                  style={{ marginTop: 3 }}
                />
                Voting open for controlled testing
              </label>
              <div style={{ ...fieldStyle, marginTop: '0.85rem', marginBottom: 0 }}>
                <label style={labelStyle}>Vote Credits</label>
                <input
                  style={inputStyle}
                  type="number"
                  min={1}
                  max={10}
                  value={contentListConfig.voting.creditLimit}
                  onChange={(e) => updateContentListSettings({ votingCreditLimit: Number(e.target.value) || 2, enabled: true })}
                  disabled={!contentListConfig.voting.enabled}
                />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
          <button
            type="submit"
            className="actionBtn actionBtn-primary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create eCe'}
          </button>
          <button
            type="button"
            className="actionBtn actionBtn-secondary"
            style={{ margin: 0, flex: 1, padding: '0.75rem' }}
            onClick={() => navigate(`/admin/events/${eventId}`)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
