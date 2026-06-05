import React, { useState, useEffect } from 'react';
import {
  Clock, BellRing, X, Phone, Mail, MessageSquare,
  ChevronRight, RefreshCw, Users, MapPin, Info, Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import { QmeButton } from '../components/qme/QmeButton';
import { StatusBadge } from '../components/qme/QmeBadge';
import { ConfirmModal } from '../components/qme/QmeModal';
import type { TicketStatus } from '../data/mockData';

// ─── Queue position visualizer ────────────────────────────────────────────────

function QueueViz({ myPosition, total }: { myPosition: number; total: number }) {
  return (
    <div role="img" aria-label={`Your position: ${myPosition} of ${total} in queue`}
      style={{ display:'flex', flexWrap:'wrap', gap:'5px', padding:'4px 0' }}>
      {Array.from({ length: Math.min(total + 2, 18) }, (_, i) => {
        const pos = i + 1;
        const isMine    = pos === myPosition;
        const isServing = pos < myPosition;
        const isAfter   = pos > myPosition;
        const isExtra   = pos > total;
        if (isExtra) return null;
        return (
          <div key={i}
            title={isMine ? 'You' : isServing ? `Ticket #${37 + pos} (served)` : `Position ${pos}`}
            style={{
              width:        isMine ? '34px' : '26px',
              height:       isMine ? '34px' : '26px',
              borderRadius: '50%',
              background:   isServing
                ? 'var(--qme-success)'
                : isMine
                ? 'var(--qme-primary)'
                : 'var(--qme-gray-200)',
              border:       isMine ? '3px solid var(--qme-primary-border)' : '2px solid transparent',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              color:        isServing || isMine ? '#fff' : 'var(--qme-gray-400)',
              fontSize:     isMine ? '12px' : '10px',
              fontWeight:   700,
              flexShrink:   0,
              transition:   'all 0.4s ease',
              boxShadow:    isMine ? '0 0 0 4px var(--qme-primary-bg)' : 'none',
            }}
          >
            {isMine ? 'You' : isServing ? '✓' : pos}
          </div>
        );
      })}
    </div>
  );
}

// ─── Wait time bar ────────────────────────────────────────────────────────────

function WaitBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div style={{ background:'var(--qme-gray-200)', borderRadius:'var(--qme-r-full)', height:'6px', overflow:'hidden' }}>
      <div style={{
        width:      `${pct}%`,
        height:     '100%',
        background: color,
        borderRadius:'var(--qme-r-full)',
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

// ─── Update indicator ─────────────────────────────────────────────────────────

function LiveIndicator({ lastUpdate }: { lastUpdate: string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
      <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'var(--qme-success)' }} className="qme-pulse-dot" />
      <span style={{ fontSize:'12px', color:'var(--qme-gray-500)' }}>Live · Updated {lastUpdate}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function GuestViewPage() {
  const [status,        setStatus]        = useState<TicketStatus>('waiting');
  const [position,      setPosition]      = useState(4);
  const [waitMin,       setWaitMin]       = useState(14);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [cancelOpen,    setCancelOpen]    = useState(false);
  const [lastUpdate,    setLastUpdate]    = useState('just now');
  const [animKey,       setAnimKey]       = useState(0);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate('just now');
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNotify = () => {
    setNotifyEnabled(true);
    toast.success('Notifications enabled! We\'ll alert you when you\'re next.', {
      description: 'You\'ll receive an SMS to +1 555-0142',
      duration: 4000,
    });
  };

  const handleCancel = () => {
    setStatus('cancelled');
    setAnimKey(k => k + 1);
    toast.error('Your spot has been cancelled.', {
      description: 'Ticket T-042 removed from the queue.',
    });
  };

  const handleRefresh = () => {
    setWaitMin(prev => Math.max(prev - 1, 0));
    setPosition(prev => Math.max(prev - 1, 1));
    toast.info('Queue updated', { duration: 2000 });
    setLastUpdate('just now');
  };

  const isCancelled = status === 'cancelled';

  return (
    <div style={{
      minHeight: 'calc(100vh - 57px)',
      background:'var(--qme-gray-50)',
      fontFamily:'var(--qme-font)',
    }}>
      {/* ── Responsive container ── */}
      <div style={{
        maxWidth:'900px',
        margin:'0 auto',
        padding:'24px 16px 48px',
      }}>

        {/* Breakpoint label */}
        <div style={{
          display:'flex', alignItems:'center', gap:'8px',
          marginBottom:'16px', flexWrap:'wrap',
        }}>
          {['Mobile 375', 'Tablet 768', 'Desktop 900+'].map((bp, i) => (
            <span key={bp} style={{
              padding:     '3px 10px',
              borderRadius:'var(--qme-r-full)',
              background:  i === 2 ? 'var(--qme-primary-bg)' : 'rgba(255,255,255,0.7)',
              border:      `1px solid ${i === 2 ? 'var(--qme-primary-border)' : 'var(--qme-gray-200)'}`,
              color:       i === 2 ? 'var(--qme-primary-hover)' : 'var(--qme-gray-500)',
              fontSize:    '11px',
              fontWeight:  i === 2 ? 700 : 500,
            }}>{bp}</span>
          ))}
          <div style={{ marginLeft:'auto' }}>
            <LiveIndicator lastUpdate={lastUpdate} />
          </div>
        </div>

        {/* ── 2-col on desktop, stack on mobile ── */}
        <div
          style={{ display:'grid', gap:'16px' }}
          className="grid-cols-1 lg:grid-cols-[1fr_320px]"
        >

          {/* ── Left / Main column ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Status card */}
            <div
              key={animKey}
              className="qme-fade-up"
              style={{
                background:   '#fff',
                borderRadius: 'var(--qme-r-xl)',
                border:       `1px solid ${isCancelled ? 'var(--qme-danger-border)' : 'var(--qme-gray-200)'}`,
                boxShadow:    'var(--qme-shadow-sm)',
                overflow:     'hidden',
              }}
            >
              <div style={{
                padding:       '20px 24px 16px',
                borderBottom:  '1px solid var(--qme-gray-100)',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'space-between',
                flexWrap:      'wrap',
                gap:           '10px',
              }}>
                <div>
                  <p style={{ margin:0, fontSize:'13px', color:'var(--qme-gray-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    Your Ticket
                  </p>
                  <h1 style={{ margin:'4px 0 0', fontSize:'24px', fontWeight:700, color:'var(--qme-gray-900)', lineHeight:1 }}>
                    T-042 <span style={{ fontSize:'16px', color:'var(--qme-gray-400)', fontWeight:500 }}>#42</span>
                  </h1>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <StatusBadge status={status} size="lg" />
                  <button
                    onClick={handleRefresh}
                    aria-label="Refresh queue status"
                    className="qme-focus"
                    style={{
                      background:'var(--qme-gray-100)', border:'none', cursor:'pointer',
                      borderRadius:'var(--qme-r)', padding:'7px',
                      color:'var(--qme-gray-500)', display:'flex', alignItems:'center',
                    }}
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              {isCancelled ? (
                <div className="qme-fade-in" style={{ padding:'32px 24px', textAlign:'center' }}>
                  <X size={40} color="var(--qme-danger)" style={{ margin:'0 auto 12px' }} />
                  <p style={{ fontSize:'18px', fontWeight:700, color:'var(--qme-gray-800)', margin:'0 0 8px' }}>
                    Ticket Cancelled
                  </p>
                  <p style={{ fontSize:'14px', color:'var(--qme-gray-500)', margin:'0 0 20px', lineHeight:1.6 }}>
                    You've left the queue for TechConf 2026. You can re-join at the check-in desk.
                  </p>
                  <QmeButton variant="primary" size="md" onClick={() => { setStatus('waiting'); setPosition(8); setAnimKey(k=>k+1); }}>
                    Re-join Queue
                  </QmeButton>
                </div>
              ) : (
                <div style={{ padding:'20px 24px' }}>
                  {/* Position + ETA */}
                  <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
                    {[
                      { label:'Queue Position', value:`#${position}`, sub:'in General Check-in', color:'var(--qme-primary)' },
                      { label:'Estimated Wait', value:`~${waitMin}–${waitMin + 6} min`, sub:'based on current pace', color:'var(--qme-info)' },
                      { label:'People Ahead',   value:position - 1,  sub:'including 1 at counter', color:'var(--qme-gray-700)' },
                    ].map(({ label, value, sub, color }) => (
                      <div key={label} style={{
                        flex:'1 1 140px',
                        background:'var(--qme-gray-50)',
                        borderRadius:'var(--qme-r-lg)',
                        padding:'14px',
                        border:'1px solid var(--qme-gray-100)',
                      }}>
                        <p style={{ margin:0, fontSize:'11px', color:'var(--qme-gray-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
                        <p style={{ margin:'5px 0 2px', fontSize:'22px', fontWeight:700, color, lineHeight:1 }}>{value}</p>
                        <p style={{ margin:0, fontSize:'11px', color:'var(--qme-gray-400)' }}>{sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visual queue */}
                  <div style={{ marginBottom:'20px' }}>
                    <p style={{ margin:'0 0 10px', fontSize:'13px', fontWeight:600, color:'var(--qme-gray-600)' }}>
                      Queue at a glance
                    </p>
                    <QueueViz myPosition={position} total={position + 5} />
                    <p style={{ margin:'8px 0 0', fontSize:'12px', color:'var(--qme-gray-400)' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', marginRight:'12px' }}>
                        <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--qme-success)', display:'inline-block' }} /> Served
                      </span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', marginRight:'12px' }}>
                        <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--qme-primary)', display:'inline-block' }} /> You
                      </span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px' }}>
                        <span style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--qme-gray-200)', display:'inline-block' }} /> Waiting
                      </span>
                    </p>
                  </div>

                  {/* Wait time bar */}
                  <div style={{ marginBottom:'20px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'var(--qme-gray-600)' }}>Wait progress</span>
                      <span style={{ fontSize:'13px', color:'var(--qme-gray-500)' }}>{waitMin} min waited / ~{waitMin + 14} min total</span>
                    </div>
                    <WaitBar current={waitMin} max={waitMin + 14} color="var(--qme-primary)" />
                  </div>

                  {/* Microcopy note */}
                  <div style={{
                    background:  'var(--qme-info-bg)',
                    borderRadius:'var(--qme-r-lg)',
                    border:      '1px solid var(--qme-info-border)',
                    padding:     '12px 14px',
                    display:     'flex',
                    gap:         '10px',
                    marginBottom:'20px',
                  }}>
                    <Info size={16} color="var(--qme-info)" style={{ flexShrink:0, marginTop:'1px' }} />
                    <p style={{ margin:0, fontSize:'13px', color:'var(--qme-info)', lineHeight:1.5 }}>
                      <strong>Keep this page open.</strong> We'll show a notification and play a sound when your number is called.
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                    <QmeButton
                      variant={notifyEnabled ? 'ghost' : 'secondary'}
                      size="md"
                      icon={<BellRing size={15} />}
                      disabled={notifyEnabled}
                      onClick={handleNotify}
                    >
                      {notifyEnabled ? 'SMS Alerts On ✓' : 'Notify Me via SMS'}
                    </QmeButton>
                    <QmeButton
                      variant="ghost"
                      size="md"
                      icon={<X size={15} />}
                      style={{ color:'var(--qme-danger)', borderColor:'var(--qme-danger-border)' }}
                      onClick={() => setCancelOpen(true)}
                    >
                      Leave Queue
                    </QmeButton>
                  </div>
                </div>
              )}
            </div>

            {/* Event info card */}
            <div style={{
              background:'#fff',
              borderRadius:'var(--qme-r-xl)',
              border:'1px solid var(--qme-gray-200)',
              padding:'18px 22px',
              boxShadow:'var(--qme-shadow-xs)',
            }}>
              <h2 style={{ margin:'0 0 14px', fontSize:'16px', fontWeight:700, color:'var(--qme-gray-800)' }}>
                Event Details
              </h2>
              <div style={{ display:'grid', gap:'12px' }}>
                {[
                  { icon:<MapPin size={15}/>,  label:'Venue',    value:'Convention Center · Hall B' },
                  { icon:<Clock size={15}/>,   label:'Check-in', value:'08:00 – 17:00' },
                  { icon:<Users size={15}/>,   label:'Queue',    value:'General Check-in (3 counters open)' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ color:'var(--qme-gray-400)', flexShrink:0 }} aria-hidden="true">{icon}</span>
                    <span style={{ fontSize:'13px', color:'var(--qme-gray-500)', minWidth:'60px', fontWeight:600 }}>{label}</span>
                    <span style={{ fontSize:'14px', color:'var(--qme-gray-700)', fontWeight:500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right / Sidebar column ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Help / Contact */}
            <div style={{
              background:'#fff',
              borderRadius:'var(--qme-r-xl)',
              border:'1px solid var(--qme-gray-200)',
              boxShadow:'var(--qme-shadow-xs)',
              overflow:'hidden',
            }}>
              <div style={{
                padding:'14px 18px',
                background:'var(--qme-admin)',
                color:'#fff',
              }}>
                <p style={{ margin:0, fontSize:'14px', fontWeight:700 }}>Need help?</p>
                <p style={{ margin:'2px 0 0', fontSize:'12px', opacity:0.75 }}>We're here for you</p>
              </div>
              <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'10px' }}>
                {[
                  { icon:<Phone size={15}/>,        label:'Call help desk',  sub:'Ext. 100',              action:() => toast.info('Calling help desk…') },
                  { icon:<MessageSquare size={15}/>, label:'Live chat',       sub:'Avg. reply: 2 min',     action:() => toast.info('Opening live chat…') },
                  { icon:<Mail size={15}/>,          label:'Email support',   sub:'help@techconf.com',     action:() => toast.info('Opening email form…') },
                ].map(({ icon, label, sub, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="qme-focus"
                    style={{
                      display:'flex', alignItems:'center', gap:'12px',
                      padding:'10px 12px', borderRadius:'var(--qme-r)',
                      border:'1px solid var(--qme-gray-200)',
                      background:'var(--qme-gray-50)',
                      cursor:'pointer', textAlign:'left', width:'100%',
                      transition:'background var(--qme-dur-fast) var(--qme-ease)',
                      fontFamily:'var(--qme-font)',
                    }}
                  >
                    <span style={{ color:'var(--qme-primary)', flexShrink:0 }}>{icon}</span>
                    <div>
                      <p style={{ margin:0, fontSize:'13px', fontWeight:600, color:'var(--qme-gray-700)' }}>{label}</p>
                      <p style={{ margin:'1px 0 0', fontSize:'11px', color:'var(--qme-gray-400)' }}>{sub}</p>
                    </div>
                    <ChevronRight size={13} color="var(--qme-gray-400)" style={{ marginLeft:'auto' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Live queue metrics */}
            <div style={{
              background:'#fff',
              borderRadius:'var(--qme-r-xl)',
              border:'1px solid var(--qme-gray-200)',
              padding:'16px 18px',
              boxShadow:'var(--qme-shadow-xs)',
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <p style={{ margin:0, fontSize:'14px', fontWeight:700, color:'var(--qme-gray-800)' }}>Queue Metrics</p>
                <Wifi size={13} color="var(--qme-success)" />
              </div>
              {[
                { label:'Avg wait', value:'~14 min', bar:70, color:'var(--qme-info)' },
                { label:'Counters', value:'3 / 3 open', bar:100, color:'var(--qme-success)' },
                { label:'Served today', value:'52', bar:52, color:'var(--qme-primary)' },
              ].map(({ label, value, bar, color }) => (
                <div key={label} style={{ marginBottom:'10px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                    <span style={{ fontSize:'12px', color:'var(--qme-gray-500)', fontWeight:500 }}>{label}</span>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'var(--qme-gray-700)' }}>{value}</span>
                  </div>
                  <WaitBar current={bar} max={100} color={color} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel confirmation modal */}
      <ConfirmModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        title="Leave the queue?"
        message="If you cancel your spot (T-042), you'll lose your current position. You can re-join at the front desk, but you'll be placed at the back of the queue."
        confirmLabel="Yes, leave queue"
        cancelLabel="Stay in queue"
        danger
      />
    </div>
  );
}