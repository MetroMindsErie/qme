import React, { useState } from 'react';
import {
  CalendarDays, MapPin, Clock, Users, Bell, Mail, Phone,
  Save, Eye, ChevronRight, Plus, Trash2, Info, CheckCircle2,
  Settings, LayoutList, Shield, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { QmeButton } from '../components/qme/QmeButton';
import { QueueStatusBadge } from '../components/qme/QmeBadge';
import { FormField, QmeInput, QmeSelect, QmeTextarea, QmeToggle } from '../components/qme/DisplayField';
import { MOCK_EVENT, type BusinessHour } from '../data/mockData';

// ─── Staff alert toggle row ───────────────────────────────────────────────────

function StaffAlertRow({ label, hint, defaultChecked }: { label: string; hint: string; defaultChecked: boolean }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'3px' }}>
      <QmeToggle checked={checked} onChange={setChecked} label={label} />
      <p style={{ margin:'0 0 0 52px', fontSize:'12px', color:'var(--qme-gray-400)' }}>{hint}</p>
    </div>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────��──────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: 'var(--qme-r-xl)',
      border:       '1px solid var(--qme-gray-200)',
      boxShadow:    'var(--qme-shadow-xs)',
      overflow:     'hidden',
    }}>
      <div style={{
        padding:     '14px 22px',
        borderBottom:'1px solid var(--qme-gray-100)',
        display:     'flex',
        alignItems:  'center',
        gap:         '10px',
        background:  'var(--qme-gray-50)',
      }}>
        <span style={{ color:'var(--qme-primary)' }} aria-hidden="true">{icon}</span>
        <h2 style={{ margin:0, fontSize:'15px', fontWeight:700, color:'var(--qme-gray-800)' }}>{title}</h2>
      </div>
      <div style={{ padding:'22px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Business hours row ───────────────────────────────────────────────────────

function HoursRow({
  hour, onChange,
}: {
  hour: BusinessHour;
  onChange: (updated: BusinessHour) => void;
}) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'100px 1fr 1fr 1fr',
      alignItems:'center',
      gap:'12px',
      padding:'8px 0',
      borderBottom:'1px solid var(--qme-gray-100)',
    }}>
      <span style={{ fontSize:'14px', color: hour.enabled ? 'var(--qme-gray-700)' : 'var(--qme-gray-400)', fontWeight:500 }}>
        {hour.day.slice(0,3)}
      </span>
      <QmeToggle
        checked={hour.enabled}
        onChange={v => onChange({ ...hour, enabled: v })}
        label=""
        size="sm"
      />
      <QmeInput
        type="time"
        value={hour.open}
        disabled={!hour.enabled}
        onChange={e => onChange({ ...hour, open: e.target.value })}
        style={{ opacity: hour.enabled ? 1 : 0.4 }}
      />
      <QmeInput
        type="time"
        value={hour.close}
        disabled={!hour.enabled}
        onChange={e => onChange({ ...hour, close: e.target.value })}
        style={{ opacity: hour.enabled ? 1 : 0.4 }}
      />
    </div>
  );
}

// ─── Queue setting row ────────────────────────────────────────────────────────

function QueueRow({ queue, onEdit }: { queue: any; onEdit: () => void }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'12px',
      padding:'12px 0', borderBottom:'1px solid var(--qme-gray-100)',
      flexWrap:'wrap',
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'var(--qme-gray-800)' }}>{queue.name}</p>
        <p style={{ margin:'2px 0 0', fontSize:'12px', color:'var(--qme-gray-500)' }}>{queue.description}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
        <QueueStatusBadge status={queue.status} />
        <span style={{ fontSize:'12px', color:'var(--qme-gray-500)' }}>
          Cap: <strong>{queue.capacity}</strong> · SLA: <strong>{queue.slaThresholdMin}m</strong> · Counters: <strong>{queue.counters.length}</strong>
        </span>
        <QmeButton variant="ghost" size="sm" icon={<Settings size={13}/>} onClick={onEdit}>
          Configure
        </QmeButton>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'details' | 'queues' | 'hours' | 'notifications';

export function AdminEventPage() {
  const [event, setEvent]         = useState(MOCK_EVENT);
  const [hours, setHours]         = useState<BusinessHour[]>(MOCK_EVENT.businessHours);
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [saving, setSaving]       = useState(false);
  const [saved,  setSaved]        = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
    setSaved(true);
    toast.success('Event saved successfully!', { description: 'All settings have been updated.' });
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key:'details',       label:'Event Details',    icon:<CalendarDays size={14}/> },
    { key:'queues',        label:'Queue Settings',   icon:<LayoutList size={14}/> },
    { key:'hours',         label:'Business Hours',   icon:<Clock size={14}/> },
    { key:'notifications', label:'Notifications',    icon:<Bell size={14}/> },
  ];

  return (
    <div style={{
      minHeight:  'calc(100vh - 57px)',
      background: 'var(--qme-gray-50)',
      fontFamily: 'var(--qme-font)',
    }}>
      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'24px 20px 48px' }}>

        {/* Page header */}
        <div style={{
          display:'flex', alignItems:'flex-start', justifyContent:'space-between',
          flexWrap:'wrap', gap:'12px', marginBottom:'20px',
        }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
              <span style={{ fontSize:'12px', color:'var(--qme-gray-400)', fontWeight:500 }}>
                Events
              </span>
              <ChevronRight size={12} color="var(--qme-gray-400)" />
              <span style={{ fontSize:'12px', color:'var(--qme-primary)', fontWeight:600 }}>
                TechConf 2026
              </span>
            </div>
            <h1 style={{ margin:0, fontSize:'24px', fontWeight:800, color:'var(--qme-gray-900)', lineHeight:1 }}>
              Event Setup
            </h1>
            <p style={{ margin:'5px 0 0', fontSize:'14px', color:'var(--qme-gray-500)' }}>
              Configure event details, queues, hours, and notification settings.
            </p>
          </div>

          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            <QmeButton variant="ghost" size="md" icon={<Eye size={15}/>}
              onClick={() => toast.info('Opening event preview…')}>
              Preview
            </QmeButton>
            <QmeButton
              variant={saved ? 'ghost' : 'primary'}
              size="md"
              icon={saved ? <CheckCircle2 size={15}/> : <Save size={15}/>}
              loading={saving}
              onClick={handleSave}
              style={saved ? { background:'var(--qme-success-bg)', color:'var(--qme-success)', borderColor:'var(--qme-success-border)' } : {}}
            >
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </QmeButton>
          </div>
        </div>

        {/* Status banner */}
        <div style={{
          background:'var(--qme-success-bg)', border:'1px solid var(--qme-success-border)',
          borderRadius:'var(--qme-r-lg)', padding:'10px 16px',
          display:'flex', alignItems:'center', gap:'10px',
          marginBottom:'20px',
        }}>
          <CheckCircle2 size={16} color="var(--qme-success)" />
          <p style={{ margin:0, fontSize:'13px', color:'var(--qme-success)', fontWeight:600 }}>
            Event is <strong>LIVE</strong> — Check-in is open. 3 of 3 queues are active. 94 tickets issued today.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', gap:'2px',
          borderBottom:'2px solid var(--qme-gray-200)',
          marginBottom:'20px',
          overflowX:'auto',
        }}>
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-selected={activeTab === key}
              role="tab"
              className="qme-focus"
              style={{
                display:'flex', alignItems:'center', gap:'7px',
                padding:'10px 16px',
                border:'none',
                borderBottom: activeTab === key ? '2px solid var(--qme-primary)' : '2px solid transparent',
                marginBottom:'-2px',
                background:'transparent',
                color: activeTab === key ? 'var(--qme-primary-hover)' : 'var(--qme-gray-500)',
                fontWeight: activeTab === key ? 700 : 500,
                fontSize:'14px', cursor:'pointer', whiteSpace:'nowrap',
                fontFamily:'var(--qme-font)',
                transition:'color var(--qme-dur-fast) var(--qme-ease)',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab: Event Details ── */}
        {activeTab === 'details' && (
          <div className="qme-fade-in" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <Section title="Basic Information" icon={<CalendarDays size={16}/>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div style={{ gridColumn:'1/-1' }}>
                  <FormField label="Event Name" required>
                    <QmeInput
                      value={event.name}
                      onChange={e => setEvent(p => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. TechConf 2026"
                    />
                  </FormField>
                </div>
                <FormField label="Date" required>
                  <QmeInput
                    type="date"
                    value={event.date}
                    onChange={e => setEvent(p => ({ ...p, date: e.target.value }))}
                  />
                </FormField>
                <FormField label="Status" required>
                  <QmeSelect
                    value={event.status}
                    onChange={e => setEvent(p => ({ ...p, status: e.target.value as any }))}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </QmeSelect>
                </FormField>
                <div style={{ gridColumn:'1/-1' }}>
                  <FormField label="Venue" icon={<MapPin size={14}/>}>
                    <QmeInput
                      value={event.venue}
                      onChange={e => setEvent(p => ({ ...p, venue: e.target.value }))}
                      placeholder="Convention Center, Hall B"
                    />
                  </FormField>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <FormField label="Description" hint="Shown on guest ticket">
                    <QmeTextarea
                      value={event.description}
                      onChange={e => setEvent(p => ({ ...p, description: e.target.value }))}
                      rows={3}
                    />
                  </FormField>
                </div>
              </div>
            </Section>

            <Section title="Check-in Window" icon={<Clock size={16}/>}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <FormField label="Opens at" required>
                  <QmeInput
                    type="time"
                    value={event.checkInStart}
                    onChange={e => setEvent(p => ({ ...p, checkInStart: e.target.value }))}
                  />
                </FormField>
                <FormField label="Closes at" required>
                  <QmeInput
                    type="time"
                    value={event.checkInEnd}
                    onChange={e => setEvent(p => ({ ...p, checkInEnd: e.target.value }))}
                  />
                </FormField>
                <div style={{ gridColumn:'1/-1' }}>
                  <FormField label="Maximum Capacity" hint="Total guests across all queues">
                    <QmeInput
                      type="number"
                      value={event.maxCapacity}
                      onChange={e => setEvent(p => ({ ...p, maxCapacity: parseInt(e.target.value) || 0 }))}
                      min={0}
                    />
                  </FormField>
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ── Tab: Queue Settings ── */}
        {activeTab === 'queues' && (
          <div className="qme-fade-in" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <Section title="Queue Configuration" icon={<LayoutList size={16}/>}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <p style={{ margin:0, fontSize:'13px', color:'var(--qme-gray-500)' }}>
                  {event.queues.length} queues configured for this event.
                </p>
                <QmeButton variant="secondary" size="sm" icon={<Plus size={14}/>}
                  onClick={() => toast.info('Add queue flow coming soon…')}>
                  Add Queue
                </QmeButton>
              </div>
              {event.queues.map(queue => (
                <QueueRow
                  key={queue.id}
                  queue={queue}
                  onEdit={() => toast.info(`Editing queue: ${queue.name}`)}
                />
              ))}
            </Section>

            {/* Per-queue settings */}
            <Section title="SLA & Capacity Settings" icon={<Shield size={16}/>}>
              <div style={{
                background:'var(--qme-info-bg)', borderRadius:'var(--qme-r)', border:'1px solid var(--qme-info-border)',
                padding:'10px 14px', marginBottom:'16px', display:'flex', gap:'8px',
              }}>
                <Info size={15} color="var(--qme-info)" style={{ flexShrink:0 }} />
                <p style={{ margin:0, fontSize:'13px', color:'var(--qme-info)', lineHeight:1.5 }}>
                  SLA threshold triggers an alert when a guest waits longer than the set time.
                  Color-coded rows will highlight breached tickets in the dashboard.
                </p>
              </div>
              {event.queues.map((queue, i) => (
                <div key={queue.id} style={{
                  display:'grid', gridTemplateColumns:'1fr 1fr 1fr',
                  gap:'12px', padding:'12px 0',
                  borderBottom: i < event.queues.length - 1 ? '1px solid var(--qme-gray-100)' : 'none',
                }}>
                  <div>
                    <p style={{ margin:'0 0 6px', fontSize:'13px', fontWeight:700, color:'var(--qme-gray-700)' }}>{queue.name}</p>
                  </div>
                  <FormField label="Max capacity">
                    <QmeInput
                      type="number"
                      defaultValue={queue.capacity}
                      min={0}
                      onChange={() => {}}
                    />
                  </FormField>
                  <FormField label="SLA threshold (min)">
                    <QmeInput
                      type="number"
                      defaultValue={queue.slaThresholdMin}
                      min={1}
                      onChange={() => {}}
                    />
                  </FormField>
                </div>
              ))}
            </Section>
          </div>
        )}

        {/* ── Tab: Business Hours ── */}
        {activeTab === 'hours' && (
          <div className="qme-fade-in">
            <Section title="Operating Hours" icon={<Clock size={16}/>}>
              <div style={{
                display:'grid', gridTemplateColumns:'100px 80px 1fr 1fr',
                gap:'12px', padding:'8px 0 12px',
                borderBottom:'1px solid var(--qme-gray-200)',
                marginBottom:'4px',
              }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Day</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Open</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Opens at</span>
                <span style={{ fontSize:'11px', fontWeight:700, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Closes at</span>
              </div>
              {hours.map((hour, idx) => (
                <HoursRow
                  key={hour.day}
                  hour={hour}
                  onChange={(updated) => setHours(prev => prev.map((h, i) => i === idx ? updated : h))}
                />
              ))}
              <p style={{ fontSize:'12px', color:'var(--qme-gray-400)', marginTop:'12px', lineHeight:1.5 }}>
                These hours control when the check-in kiosks are active. Guests can still view their ticket outside these hours.
              </p>
            </Section>
          </div>
        )}

        {/* ── Tab: Notifications ── */}
        {activeTab === 'notifications' && (
          <div className="qme-fade-in" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
            <Section title="Guest Notifications" icon={<Bell size={16}/>}>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <QmeToggle
                  checked={event.notifyOnReady}
                  onChange={v => setEvent(p => ({ ...p, notifyOnReady: v }))}
                  label="Notify guests when their ticket is called"
                />
                <div style={{ height:'1px', background:'var(--qme-gray-100)' }} />

                <div>
                  <p style={{ margin:'0 0 12px', fontSize:'14px', fontWeight:700, color:'var(--qme-gray-700)' }}>
                    Delivery channels
                  </p>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    <QmeToggle
                      checked={event.notifySMS}
                      onChange={v => setEvent(p => ({ ...p, notifySMS: v }))}
                      label="SMS notifications (requires phone at check-in)"
                    />
                    <QmeToggle
                      checked={event.notifyEmail}
                      onChange={v => setEvent(p => ({ ...p, notifyEmail: v }))}
                      label="Email notifications"
                    />
                  </div>
                </div>

                <div style={{
                  background:'var(--qme-warning-bg)', border:'1px solid var(--qme-warning-border)',
                  borderRadius:'var(--qme-r)', padding:'12px 14px',
                  display:'flex', gap:'8px',
                }}>
                  <AlertTriangle size={15} color="var(--qme-warning)" style={{ flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontSize:'13px', color:'var(--qme-warning)', lineHeight:1.5 }}>
                    SMS costs apply. Current rate: $0.02/message. Estimated cost at full capacity: <strong>~$7.60</strong>.
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Staff Alerts" icon={<Shield size={16}/>}>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[
                  { label:'Alert on SLA breach',           hint:'Slack/email when a ticket exceeds the SLA time',    defaultChecked: true },
                  { label:'Alert on queue capacity reach',  hint:'Warn staff when queue is 90% full',                  defaultChecked: true },
                  { label:'Daily summary report',          hint:'End-of-day stats emailed to admins',                  defaultChecked: false },
                  { label:'Real-time counter alerts',      hint:'Notify counter staff when a new ticket is called',    defaultChecked: true },
                ].map(({ label, hint, defaultChecked }) => (
                  <StaffAlertRow key={label} label={label} hint={hint} defaultChecked={defaultChecked} />
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Sticky save bar */}
        <div style={{
          position:   'sticky',
          bottom:     '0',
          margin:     '24px -20px -48px',
          padding:    '12px 24px',
          background: '#fff',
          borderTop:  '1px solid var(--qme-gray-200)',
          display:    'flex',
          alignItems: 'center',
          justifyContent:'space-between',
          boxShadow:  '0 -4px 12px rgba(15,23,42,0.06)',
          gap:        '12px',
        }}>
          <p style={{ margin:0, fontSize:'13px', color:'var(--qme-gray-500)' }}>
            Changes are not published until you save.
          </p>
          <div style={{ display:'flex', gap:'8px' }}>
            <QmeButton variant="ghost" size="md" onClick={() => toast.info('Changes discarded.')}>
              Discard
            </QmeButton>
            <QmeButton
              variant={saved ? 'ghost' : 'primary'}
              size="md"
              icon={saved ? <CheckCircle2 size={15}/> : <Save size={15}/>}
              loading={saving}
              onClick={handleSave}
              style={saved ? { background:'var(--qme-success-bg)', color:'var(--qme-success)', borderColor:'var(--qme-success-border)' } : {}}
            >
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </QmeButton>
          </div>
        </div>
      </div>
    </div>
  );
}