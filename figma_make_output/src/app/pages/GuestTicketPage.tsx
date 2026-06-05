import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Share2, HelpCircle, CheckCircle2, ChevronRight,
  QrCode, Users, Clock, MapPin, ArrowRight, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { QmeButton } from '../components/qme/QmeButton';
import { StatusBadge } from '../components/qme/QmeBadge';
import type { TicketStatus } from '../data/mockData';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TicketState {
  status:      TicketStatus;
  position:    number;
  etaMin:      number;
  etaMax:      number;
  counter?:    string;
  waitedMin:   number;
  totalAhead:  number;
}

const INITIAL_STATE: TicketState = {
  status:     'waiting',
  position:   4,
  etaMin:     12,
  etaMax:     18,
  waitedMin:  11,
  totalAhead: 3,
};

// ─── QR code placeholder ──────────────────────────────────────────────────────

function QRCodePlaceholder() {
  return (
    <div
      aria-label="QR code for ticket T-042"
      style={{
        width:        '100px',
        height:       '100px',
        borderRadius: 'var(--qme-r-lg)',
        border:       '2px solid var(--qme-gray-200)',
        background:   'var(--qme-gray-50)',
        display:      'flex',
        alignItems:   'center',
        justifyContent:'center',
        flexShrink:   0,
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Simulated QR pattern */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
        {/* Top-left finder */}
        <rect x="5"  y="5"  width="24" height="24" rx="3" fill="var(--qme-gray-800)" />
        <rect x="9"  y="9"  width="16" height="16" rx="2" fill="white" />
        <rect x="13" y="13" width="8"  height="8"  rx="1" fill="var(--qme-gray-800)" />
        {/* Top-right finder */}
        <rect x="51" y="5"  width="24" height="24" rx="3" fill="var(--qme-gray-800)" />
        <rect x="55" y="9"  width="16" height="16" rx="2" fill="white" />
        <rect x="59" y="13" width="8"  height="8"  rx="1" fill="var(--qme-gray-800)" />
        {/* Bottom-left finder */}
        <rect x="5"  y="51" width="24" height="24" rx="3" fill="var(--qme-gray-800)" />
        <rect x="9"  y="55" width="16" height="16" rx="2" fill="white" />
        <rect x="13" y="59" width="8"  height="8"  rx="1" fill="var(--qme-gray-800)" />
        {/* Data modules */}
        {[35,40,45,50,55,35,50,55].map((x,i) => (
          <rect key={i} x={x} y={35 + (i % 4) * 5} width="4" height="4" fill="var(--qme-gray-700)" />
        ))}
        {[5,12,19,26].map((x,i) => (
          <rect key={`d${i}`} x={x} y={35} width="4" height="4" fill="var(--qme-gray-700)" />
        ))}
      </svg>
    </div>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({ status }: { status: TicketStatus }) {
  const steps = [
    { key: 'waiting',    label: 'In Queue'   },
    { key: 'ready',      label: 'Called'     },
    { key: 'checked_in', label: 'Checked In' },
  ];
  const activeIdx = status === 'waiting' ? 0 : status === 'ready' ? 1 : 2;

  return (
    <div role="progressbar" aria-label="Check-in progress" aria-valuenow={activeIdx + 1} aria-valuemax={3}
      style={{ display:'flex', alignItems:'center', gap:'0', justifyContent:'center', margin:'4px 0' }}>
      {steps.map((step, idx) => {
        const done    = idx < activeIdx;
        const current = idx === activeIdx;
        return (
          <React.Fragment key={step.key}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'5px' }}>
              <div style={{
                width:        current ? '32px' : '24px',
                height:       current ? '32px' : '24px',
                borderRadius: '50%',
                background:   done || current ? 'var(--qme-primary)' : 'var(--qme-gray-200)',
                border:       current ? '3px solid var(--qme-primary-border)' : '2px solid transparent',
                display:      'flex',
                alignItems:   'center',
                justifyContent:'center',
                transition:   `all var(--qme-dur-slow) var(--qme-ease)`,
                boxShadow:    current ? '0 0 0 4px var(--qme-primary-bg)' : 'none',
              }}>
                {done
                  ? <CheckCircle2 size={13} color="#fff" />
                  : <span style={{ color: current ? '#fff' : 'var(--qme-gray-400)', fontSize:'11px', fontWeight:700 }}>
                      {idx + 1}
                    </span>
                }
              </div>
              <span style={{
                fontSize:   '10px',
                fontWeight: current ? 700 : 500,
                color:      current ? 'var(--qme-primary-hover)' : done ? 'var(--qme-gray-500)' : 'var(--qme-gray-400)',
                whiteSpace: 'nowrap',
              }}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{
                height:     '2px',
                width:      '40px',
                background: done ? 'var(--qme-primary)' : 'var(--qme-gray-200)',
                margin:     '0 4px',
                marginBottom:'18px',
                borderRadius:'1px',
                transition: `background var(--qme-dur-slow) var(--qme-ease)`,
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function GuestTicketPage() {
  const [ticket, setTicket] = useState<TicketState>(INITIAL_STATE);
  const [animKey, setAnimKey] = useState(0);

  const advance = useCallback(() => {
    setTicket(prev => {
      if (prev.status === 'waiting') {
        toast.success('🔔 It\'s your turn! Head to Counter 3', {
          description: 'Your ticket T-042 has been called.',
          duration: 4000,
        });
        return { ...prev, status: 'ready', counter: 'Counter 3' };
      }
      if (prev.status === 'ready') {
        toast.success('✅ You\'re checked in! Welcome to TechConf 2026.', { duration: 4000 });
        return { ...prev, status: 'checked_in' };
      }
      return prev;
    });
    setAnimKey(k => k + 1);
  }, []);

  const reset = useCallback(() => {
    setTicket(INITIAL_STATE);
    setAnimKey(k => k + 1);
  }, []);

  const status   = ticket.status;
  const isReady  = status === 'ready';
  const isDone   = status === 'checked_in';

  return (
    <div style={{
      minHeight:      'calc(100vh - 57px)',
      background:     'linear-gradient(160deg, var(--qme-primary-bg) 0%, var(--qme-gray-50) 50%)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'flex-start',
      padding:        '24px 16px 40px',
      fontFamily:     'var(--qme-font)',
    }}>
      {/* Mobile device label */}
      <div style={{
        display:     'flex',
        alignItems:  'center',
        gap:         '6px',
        marginBottom:'12px',
        padding:     '4px 12px',
        background:  'rgba(255,255,255,0.7)',
        borderRadius:'var(--qme-r-full)',
        border:      '1px solid var(--qme-gray-200)',
        fontSize:    '11px',
        color:       'var(--qme-gray-500)',
        fontWeight:  600,
      }}>
        📱 Mobile · 375px · Guest Ticket
      </div>

      {/* Ticket card */}
      <div
        key={animKey}
        className="qme-fade-up"
        style={{
          width:        '100%',
          maxWidth:     '380px',
          background:   '#fff',
          borderRadius: 'var(--qme-r-2xl)',
          boxShadow:    'var(--qme-shadow-lg)',
          overflow:     'hidden',
          border:       isReady ? '2px solid var(--qme-success-border)' : '1px solid var(--qme-gray-200)',
          transition:   `border-color var(--qme-dur-slow) var(--qme-ease)`,
        }}
      >
        {/* Card header */}
        <div style={{
          background:    isReady ? 'var(--qme-success-bg)' : isDone ? 'var(--qme-primary-bg)' : 'var(--qme-primary)',
          padding:       '16px 20px',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          transition:    `background var(--qme-dur-slow) var(--qme-ease)`,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{
              width:        '28px', height:'28px',
              borderRadius: 'var(--qme-r-sm)',
              background:   isReady || isDone ? 'var(--qme-primary)' : 'rgba(255,255,255,0.2)',
              display:      'flex', alignItems:'center', justifyContent:'center',
              color:        '#fff', fontSize:'13px', fontWeight:700,
            }}>q</div>
            <span style={{ color: isReady || isDone ? 'var(--qme-gray-700)' : 'rgba(255,255,255,0.9)', fontSize:'14px', fontWeight:600 }}>
              TechConf 2026
            </span>
          </div>
          <StatusBadge status={status} pulse={isReady} />
        </div>

        {/* Ready pulse banner */}
        {isReady && (
          <div
            className="qme-pulse-ring qme-slide-down"
            style={{
              background:   'var(--qme-success)',
              color:        '#fff',
              padding:      '10px 20px',
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              fontSize:     '14px',
              fontWeight:   600,
            }}
          >
            <Bell size={16} />
            It's your turn! Head to Counter 3
          </div>
        )}

        {/* Card body */}
        <div style={{ padding:'28px 24px 24px' }}>

          {isDone ? (
            /* ── Checked-in state ── */
            <div className="qme-fade-up" style={{ textAlign:'center', padding:'8px 0' }}>
              <div
                className="qme-check-in"
                style={{
                  width:        '72px', height:'72px',
                  borderRadius: '50%',
                  background:   'var(--qme-primary-bg)',
                  border:       '3px solid var(--qme-primary-border)',
                  display:      'flex', alignItems:'center', justifyContent:'center',
                  margin:       '0 auto 16px',
                }}
              >
                <CheckCircle2 size={36} color="var(--qme-primary)" />
              </div>
              <p style={{ fontSize:'24px', fontWeight:700, color:'var(--qme-gray-900)', margin:'0 0 6px' }}>
                You're checked in!
              </p>
              <p style={{ fontSize:'15px', color:'var(--qme-gray-500)', margin:'0 0 24px', lineHeight:1.5 }}>
                Welcome to TechConf 2026. Your lanyard and badge are waiting for you.
              </p>
              <div style={{
                background:   'var(--qme-primary-bg)',
                borderRadius: 'var(--qme-r-lg)',
                padding:      '14px 16px',
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
                textAlign:    'left',
                marginBottom: '16px',
              }}>
                <MapPin size={18} color="var(--qme-primary)" />
                <div>
                  <p style={{ margin:0, fontSize:'13px', color:'var(--qme-gray-500)', fontWeight:500 }}>You were served at</p>
                  <p style={{ margin:0, fontSize:'15px', color:'var(--qme-gray-800)', fontWeight:700 }}>Counter 3 — Hall B Entrance</p>
                </div>
              </div>
            </div>
          ) : (
            /* ── Waiting / Ready states ── */
            <>
              {/* Ticket number */}
              <div style={{ textAlign:'center', marginBottom:'20px' }}>
                <p style={{ fontSize:'13px', fontWeight:600, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.08em', margin:'0 0 4px' }}>
                  Queue Number
                </p>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                  <span
                    style={{
                      fontSize:   '80px',
                      fontWeight: 800,
                      lineHeight: 1,
                      color:      isReady ? 'var(--qme-success)' : 'var(--qme-primary)',
                      transition: `color var(--qme-dur-slow) var(--qme-ease)`,
                      letterSpacing: '-0.03em',
                    }}
                    aria-label="Ticket number 42"
                  >
                    42
                  </span>
                </div>
                <p style={{ fontSize:'13px', color:'var(--qme-gray-500)', margin:'4px 0 0', fontWeight:500 }}>
                  Ticket ID: <strong style={{ color:'var(--qme-gray-700)' }}>T-042</strong>
                </p>
              </div>

              {/* ETA */}
              {!isReady && (
                <div className="qme-fade-in" style={{
                  background:   'var(--qme-gray-50)',
                  borderRadius: 'var(--qme-r-lg)',
                  padding:      '14px 16px',
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '12px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    width:'38px', height:'38px', borderRadius:'var(--qme-r)',
                    background:'var(--qme-info-bg)', display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink: 0,
                  }}>
                    <Clock size={18} color="var(--qme-info)" />
                  </div>
                  <div>
                    <p style={{ margin:0, fontSize:'22px', fontWeight:700, color:'var(--qme-gray-900)', lineHeight:1 }}>
                      ~{ticket.etaMin}–{ticket.etaMax} min
                    </p>
                    <p style={{ margin:'3px 0 0', fontSize:'13px', color:'var(--qme-gray-500)' }}>
                      Estimated wait · {ticket.totalAhead} people ahead
                    </p>
                  </div>
                </div>
              )}

              {/* Queue position info */}
              <div style={{
                display:      'flex',
                gap:          '10px',
                marginBottom: '20px',
              }}>
                <div style={{
                  flex:1, background:'var(--qme-gray-50)', borderRadius:'var(--qme-r-lg)',
                  padding:'12px', textAlign:'center',
                }}>
                  <p style={{ margin:0, fontSize:'11px', color:'var(--qme-gray-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Position</p>
                  <p style={{ margin:'4px 0 0', fontSize:'22px', fontWeight:700, color:'var(--qme-gray-800)' }}>
                    {isReady ? '—' : `#${ticket.position}`}
                  </p>
                </div>
                <div style={{
                  flex:1, background:'var(--qme-gray-50)', borderRadius:'var(--qme-r-lg)',
                  padding:'12px', textAlign:'center',
                }}>
                  <p style={{ margin:0, fontSize:'11px', color:'var(--qme-gray-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Joined</p>
                  <p style={{ margin:'4px 0 0', fontSize:'16px', fontWeight:700, color:'var(--qme-gray-800)' }}>10:32 AM</p>
                </div>
                <div style={{
                  flex:1, background:'var(--qme-gray-50)', borderRadius:'var(--qme-r-lg)',
                  padding:'12px', textAlign:'center',
                }}>
                  <p style={{ margin:0, fontSize:'11px', color:'var(--qme-gray-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Waited</p>
                  <p style={{ margin:'4px 0 0', fontSize:'16px', fontWeight:700, color:'var(--qme-gray-800)' }}>{ticket.waitedMin}m</p>
                </div>
              </div>

              {/* QR code + counter */}
              <div style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '14px',
                marginBottom: '20px',
                padding:      '14px',
                background:   'var(--qme-gray-50)',
                borderRadius: 'var(--qme-r-lg)',
                border:       '1px solid var(--qme-gray-200)',
              }}>
                <QRCodePlaceholder />
                <div>
                  <p style={{ margin:'0 0 3px', fontSize:'12px', color:'var(--qme-gray-400)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                    {isReady ? 'Report to' : 'Scan at counter'}
                  </p>
                  <p style={{ margin:0, fontSize:'16px', fontWeight:700, color:'var(--qme-gray-800)' }}>
                    {isReady ? 'Counter 3' : 'General Check-in'}
                  </p>
                  <p style={{ margin:'3px 0 0', fontSize:'13px', color:'var(--qme-gray-500)' }}>Hall B Entrance</p>
                  {isReady && (
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--qme-success)' }} className="qme-pulse-dot" />
                      <span style={{ fontSize:'12px', color:'var(--qme-success)', fontWeight:600 }}>Staff is ready for you</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress */}
              <ProgressDots status={status} />
            </>
          )}

          {/* Microcopy */}
          {!isDone && (
            <p style={{
              fontSize:'12px', color:'var(--qme-gray-400)', textAlign:'center',
              margin:'16px 0', lineHeight:1.5,
            }}>
              {isReady
                ? 'Please arrive within 3 minutes or your spot may be reassigned.'
                : 'Keep this page open. We\'ll notify you when it\'s your turn.'}
            </p>
          )}

          {/* CTA buttons */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {status === 'waiting' && (
              <>
                <QmeButton
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<QrCode size={17} />}
                  onClick={() => toast.info('Show your QR code to the staff at the counter.')}
                >
                  View My Ticket
                </QmeButton>
                <div style={{ display:'flex', gap:'8px' }}>
                  <QmeButton
                    variant="ghost"
                    size="md"
                    fullWidth
                    icon={<Share2 size={15} />}
                    onClick={() => toast.success('Ticket link copied to clipboard!')}
                  >
                    Share
                  </QmeButton>
                  <QmeButton
                    variant="ghost"
                    size="md"
                    fullWidth
                    icon={<HelpCircle size={15} />}
                    onClick={() => toast.info('Need help? Call the help desk at ext. 100.')}
                  >
                    Help
                  </QmeButton>
                </div>
              </>
            )}

            {status === 'ready' && (
              <>
                <QmeButton
                  variant="primary"
                  size="xl"
                  fullWidth
                  icon={<CheckCircle2 size={18} />}
                  style={{ background:'var(--qme-success)', border:'1.5px solid var(--qme-success)' }}
                  onClick={advance}
                >
                  Check In Now
                </QmeButton>
                <QmeButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  icon={<HelpCircle size={15} />}
                  onClick={() => toast.info('Need help? Ask any staff member wearing a blue lanyard.')}
                >
                  I need help
                </QmeButton>
              </>
            )}

            {isDone && (
              <>
                <QmeButton
                  variant="secondary"
                  size="lg"
                  fullWidth
                  iconRight={<ArrowRight size={16} />}
                  onClick={() => toast.info('Opening event schedule…')}
                >
                  View Event Schedule
                </QmeButton>
                <button
                  onClick={reset}
                  style={{
                    background:'none', border:'none', cursor:'pointer',
                    color:'var(--qme-gray-400)', fontSize:'13px', padding:'8px',
                    fontFamily:'var(--qme-font)',
                  }}
                >
                  ↺ Reset prototype
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card footer */}
        <div style={{
          borderTop:      '1px solid var(--qme-gray-100)',
          padding:        '12px 20px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          background:     'var(--qme-gray-50)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Users size={13} color="var(--qme-gray-400)" />
            <span style={{ fontSize:'12px', color:'var(--qme-gray-500)' }}>General Check-in</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--qme-success)' }} />
            <span style={{ fontSize:'12px', color:'var(--qme-gray-500)' }}>Live updates on</span>
          </div>
        </div>
      </div>

      {/* Prototype controls */}
      <div style={{
        marginTop:    '28px',
        padding:      '16px 20px',
        background:   '#fff',
        borderRadius: 'var(--qme-r-xl)',
        border:       '1px solid var(--qme-gray-200)',
        width:        '100%',
        maxWidth:     '380px',
        boxShadow:    'var(--qme-shadow-sm)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'12px' }}>
          <Info size={14} color="var(--qme-warning)" />
          <span style={{ fontSize:'12px', fontWeight:700, color:'var(--qme-gray-700)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
            Prototype Controls
          </span>
        </div>
        <p style={{ fontSize:'12px', color:'var(--qme-gray-500)', margin:'0 0 12px', lineHeight:1.5 }}>
          Simulate the guest ticket lifecycle: <strong>In Queue → Ready → Checked In</strong>
        </p>
        <div style={{ display:'flex', gap:'8px' }}>
          <QmeButton
            variant="secondary"
            size="sm"
            fullWidth
            onClick={advance}
            disabled={isDone}
            icon={<ChevronRight size={14} />}
          >
            {status === 'waiting' ? 'Simulate: "Ready"'
             : status === 'ready' ? 'Simulate: Check In'
             : 'Completed'}
          </QmeButton>
          <QmeButton variant="ghost" size="sm" onClick={reset}>Reset</QmeButton>
        </div>
      </div>

      {/* Info hint */}
      <p style={{ fontSize:'12px', color:'var(--qme-gray-400)', marginTop:'16px', textAlign:'center' }}>
        Navigate using the top bar · Breakpoints: 375 → 768 → 1440
      </p>
    </div>
  );
}
