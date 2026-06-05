import React, { useState, useCallback } from 'react';
import {
  Search, Filter, LayoutGrid, LayoutList, Bell, ChevronDown,
  Phone, CheckCircle2, AlertTriangle, Clock, Users, Hash,
  ArrowRight, MoreHorizontal, RefreshCw, Download, SlidersHorizontal,
  CalendarDays, TrendingDown, Wifi, XCircle, LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import { QmeButton, QmeIconButton } from '../components/qme/QmeButton';
import { StatusBadge, SLABadge, QueueStatusBadge } from '../components/qme/QmeBadge';
import { MetricCard } from '../components/qme/DisplayField';
import { ConfirmModal } from '../components/qme/QmeModal';
import { MOCK_QUEUES, MOCK_EVENT, type Ticket, type Queue, type TicketStatus } from '../data/mockData';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const navItems = [
    { icon: <LayoutGrid size={17}/>,   label: 'Dashboard',  active: true  },
    { icon: <CalendarDays size={17}/>, label: 'Events',     active: false },
    { icon: <Users size={17}/>,        label: 'Guests',     active: false },
    { icon: <Bell size={17}/>,         label: 'Alerts',     badge: '3', active: false },
  ];

  return (
    <aside
      className="qme-admin-sidebar"
      style={{
        width:          collapsed ? '56px' : '210px',
        minHeight:      '100%',
        background:     'var(--qme-admin)',
        display:        'flex',
        flexDirection:  'column',
        transition:     'width var(--qme-dur) var(--qme-ease)',
        flexShrink:     0,
        zIndex:         100,
        borderRight:    '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Logo */}
      <div style={{
        padding:        collapsed ? '16px 12px' : '16px 18px',
        borderBottom:   '1px solid rgba(255,255,255,0.08)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight:      '56px',
      }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <div style={{
              width:'28px', height:'28px', borderRadius:'var(--qme-r-sm)',
              background:'var(--qme-primary)', display:'flex', alignItems:'center', justifyContent:'center',
              color:'#fff', fontSize:'13px', fontWeight:700,
            }}>q</div>
            <span style={{ color:'#fff', fontSize:'15px', fontWeight:700, letterSpacing:'-0.01em' }}>qMe Admin</span>
          </div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="qme-focus"
          style={{
            background:'none', border:'none', cursor:'pointer', padding:'4px',
            color:'rgba(255,255,255,0.5)', borderRadius:'var(--qme-r-xs)',
            transition:'color var(--qme-dur-fast) var(--qme-ease)',
          }}
        >
          {collapsed ? <ArrowRight size={16}/> : <LayoutList size={16}/>}
        </button>
      </div>

      {/* Nav */}
      <nav role="navigation" aria-label="Admin navigation" style={{ padding:'10px 8px', flex:1 }}>
        {navItems.map(({ icon, label, active, badge }) => (
          <button
            key={label}
            aria-current={active ? 'page' : undefined}
            className={`qme-focus ${active ? 'active' : ''}`}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         '10px',
              width:       '100%',
              padding:     collapsed ? '9px' : '9px 12px',
              borderRadius:'var(--qme-r)',
              border:      'none',
              cursor:      'pointer',
              marginBottom:'2px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              position:    'relative',
              fontFamily:  'var(--qme-font)',
            }}
          >
            <span style={{ flexShrink:0, position:'relative' }}>
              {icon}
              {badge && (
                <span style={{
                  position:'absolute', top:'-5px', right:'-6px',
                  width:'14px', height:'14px', borderRadius:'50%',
                  background:'var(--qme-danger)', color:'#fff',
                  fontSize:'9px', fontWeight:700,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  {badge}
                </span>
              )}
            </span>
            {!collapsed && (
              <span style={{ fontSize:'14px', fontWeight:500 }}>{label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* User */}
      {!collapsed && (
        <div style={{
          padding:'12px 16px', borderTop:'1px solid rgba(255,255,255,0.08)',
          display:'flex', alignItems:'center', gap:'10px',
        }}>
          <div style={{
            width:'30px', height:'30px', borderRadius:'50%',
            background:'var(--qme-admin-muted)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontSize:'12px', fontWeight:700, flexShrink:0,
          }}>
            SR
          </div>
          <div>
            <p style={{ margin:0, fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.9)' }}>Staff Room</p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.45)' }}>admin@qme.io</p>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Ticket row ───────────────────────────────────────────────────────────────

interface TicketRowProps {
  ticket:    Ticket;
  slaMin:    number;
  density:   'compact' | 'comfy';
  onCall:    (id: string) => void;
  onArrive:  (id: string) => void;
  onCancel:  (id: string) => void;
}

function TicketRow({ ticket, slaMin, density, onCall, onArrive, onCancel }: TicketRowProps) {
  const rowBg = ticket.slaBreached && ticket.status === 'waiting'
    ? 'rgba(255,251,235,0.7)'
    : ticket.status === 'ready'
    ? 'rgba(240,253,244,0.5)'
    : ticket.status === 'checked_in'
    ? 'transparent'
    : 'transparent';

  const py = density === 'compact' ? '8px 16px' : '13px 16px';

  return (
    <tr style={{ background: rowBg, transition:'background 0.3s ease' }}>
      <td style={{ padding: py, whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <Hash size={11} color="var(--qme-gray-400)" />
          <span style={{ fontSize:'13px', fontWeight:700, color:'var(--qme-gray-800)', fontFamily:'monospace' }}>
            {ticket.id}
          </span>
          {ticket.notes && (
            <span title={ticket.notes} style={{
              width:'16px', height:'16px', borderRadius:'50%',
              background:'var(--qme-warning-bg)', border:'1px solid var(--qme-warning-border)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
            }}>
              <AlertTriangle size={9} color="var(--qme-warning)" />
            </span>
          )}
        </div>
      </td>
      <td style={{ padding: py }}>
        <div>
          <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'var(--qme-gray-800)' }}>
            {ticket.guestName}
          </p>
          {density !== 'compact' && (
            <p style={{ margin:'1px 0 0', fontSize:'12px', color:'var(--qme-gray-400)' }}>{ticket.phone}</p>
          )}
        </div>
      </td>
      <td style={{ padding: py, textAlign:'center' }}>
        {ticket.status === 'waiting'
          ? <span style={{ fontSize:'14px', fontWeight:700, color:'var(--qme-gray-700)' }}>
              #{ticket.position}
            </span>
          : <span style={{ fontSize:'13px', color:'var(--qme-gray-400)' }}>—</span>
        }
      </td>
      <td style={{ padding: py, whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <Clock size={12} color={ticket.slaBreached ? 'var(--qme-warning)' : 'var(--qme-gray-400)'} />
          <span style={{
            fontSize:'13px', fontWeight:600,
            color: ticket.slaBreached ? 'var(--qme-warning)' : 'var(--qme-gray-700)',
          }}>
            {ticket.waitMinutes}m
          </span>
          <SLABadge breached={ticket.slaBreached} waitMinutes={ticket.waitMinutes} threshold={slaMin} />
        </div>
      </td>
      <td style={{ padding: py }}>
        <StatusBadge status={ticket.status} size="sm" />
      </td>
      <td style={{ padding: py, textAlign:'right', whiteSpace:'nowrap' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:'6px' }}>
          {ticket.status === 'waiting' && (
            <QmeButton
              variant="primary"
              size="sm"
              icon={<Bell size={12}/>}
              onClick={() => onCall(ticket.id)}
            >
              Call
            </QmeButton>
          )}
          {ticket.status === 'ready' && (
            <QmeButton
              variant="secondary"
              size="sm"
              icon={<CheckCircle2 size={12}/>}
              onClick={() => onArrive(ticket.id)}
            >
              Mark Arrived
            </QmeButton>
          )}
          {(ticket.status === 'waiting' || ticket.status === 'ready') && (
            <QmeIconButton
              icon={<XCircle size={14}/>}
              label="Cancel ticket"
              variant="ghost"
              size="sm"
              style={{ color:'var(--qme-gray-400)' }}
              onClick={() => onCancel(ticket.id)}
            />
          )}
          <QmeIconButton icon={<MoreHorizontal size={14}/>} label="More actions" variant="ghost" size="sm" />
        </div>
      </td>
    </tr>
  );
}

// ─── Queue panel ──────────────────────────────────────────────────────────────

interface QueuePanelProps {
  queue:    Queue;
  density:  'compact' | 'comfy';
  search:   string;
  onUpdate: (queueId: string, ticketId: string, newStatus: TicketStatus) => void;
}

function QueuePanel({ queue, density, search, onUpdate }: QueuePanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const filtered = queue.tickets.filter(t => {
    const matchSearch = !search ||
      t.guestName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCallNext = () => {
    const nextWaiting = queue.tickets.find(t => t.status === 'waiting');
    if (!nextWaiting) { toast.error('No waiting tickets in this queue.'); return; }
    onUpdate(queue.id, nextWaiting.id, 'ready');
    const freeCounter = queue.counters.find(c => c.status === 'open');
    toast.success(`${nextWaiting.guestName} called to ${freeCounter?.name ?? 'next available counter'}`, {
      description: `Ticket ${nextWaiting.id} is now ready.`,
    });
  };

  return (
    <div style={{
      background:   '#fff',
      borderRadius: 'var(--qme-r-xl)',
      border:       '1px solid var(--qme-gray-200)',
      boxShadow:    'var(--qme-shadow-xs)',
      overflow:     'hidden',
      marginBottom: '16px',
    }}>
      {/* Queue header */}
      <div style={{
        padding:       '14px 20px',
        display:       'flex',
        alignItems:    'center',
        gap:           '12px',
        flexWrap:      'wrap',
        borderBottom:  expanded ? '1px solid var(--qme-gray-100)' : 'none',
        background:    'var(--qme-gray-50)',
      }}>
        <button
          onClick={() => setExpanded(p => !p)}
          aria-expanded={expanded}
          className="qme-focus"
          style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:'8px', fontFamily:'var(--qme-font)' }}
        >
          <ChevronDown size={16} color="var(--qme-gray-500)" style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform var(--qme-dur) var(--qme-ease)' }} />
          <span style={{ fontSize:'15px', fontWeight:700, color:'var(--qme-gray-800)' }}>{queue.name}</span>
        </button>
        <QueueStatusBadge status={queue.status} />

        {/* Metrics chips */}
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {[
            { n: queue.metrics.waiting,    label:'waiting', color:'var(--qme-info)' },
            { n: queue.metrics.ready,      label:'ready',   color:'var(--qme-success)' },
            { n: queue.metrics.completed,  label:'done',    color:'var(--qme-gray-500)' },
          ].map(({ n, label, color }) => (
            <span key={label} style={{
              padding:'2px 9px', borderRadius:'var(--qme-r-full)',
              background:'rgba(0,0,0,0.04)', fontSize:'12px', fontWeight:600,
            }}>
              <span style={{ color }}>{n}</span>
              <span style={{ color:'var(--qme-gray-500)', marginLeft:'3px' }}>{label}</span>
            </span>
          ))}
          {queue.metrics.slaBreachCount > 0 && (
            <span style={{
              padding:'2px 9px', borderRadius:'var(--qme-r-full)',
              background:'var(--qme-warning-bg)', border:'1px solid var(--qme-warning-border)',
              fontSize:'12px', fontWeight:600, color:'var(--qme-warning)',
            }}>
              ⚠ {queue.metrics.slaBreachCount} SLA
            </span>
          )}
        </div>

        {/* Avg wait */}
        <span style={{ fontSize:'13px', color:'var(--qme-gray-500)', marginLeft:'4px' }}>
          Avg wait: <strong style={{ color:'var(--qme-gray-700)' }}>{queue.metrics.avgWaitMin}m</strong>
        </span>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px' }}>
          <QmeButton
            variant="primary"
            size="sm"
            icon={<Bell size={13}/>}
            onClick={handleCallNext}
          >
            Call Next
          </QmeButton>
        </div>
      </div>

      {expanded && (
        <>
          {/* Filter bar */}
          <div style={{
            padding:'10px 16px',
            borderBottom:'1px solid var(--qme-gray-100)',
            display:'flex', gap:'6px', flexWrap:'wrap', alignItems:'center',
          }}>
            {(['all','waiting','ready','checked_in'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className="qme-focus"
                style={{
                  padding:'4px 12px',
                  borderRadius:'var(--qme-r-full)',
                  border:'1px solid',
                  borderColor: statusFilter === f ? 'var(--qme-primary-border)' : 'var(--qme-gray-200)',
                  background:  statusFilter === f ? 'var(--qme-primary-bg)' : '#fff',
                  color:       statusFilter === f ? 'var(--qme-primary-hover)' : 'var(--qme-gray-500)',
                  fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'var(--qme-font)',
                  transition:'all var(--qme-dur-fast) var(--qme-ease)',
                }}
              >
                {f === 'all' ? 'All' : f.replace('_',' ')}
              </button>
            ))}
            <span style={{ marginLeft:'auto', fontSize:'12px', color:'var(--qme-gray-400)' }}>
              {filtered.length} of {queue.tickets.length} tickets
            </span>
          </div>

          {/* Table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }} role="table" aria-label={`${queue.name} tickets`}>
              <thead>
                <tr style={{ background:'var(--qme-gray-50)', borderBottom:'1px solid var(--qme-gray-200)' }}>
                  {['Ticket', 'Guest', 'Position', 'Wait', 'Status', 'Actions'].map(col => (
                    <th key={col} style={{
                      padding: density === 'compact' ? '7px 16px' : '10px 16px',
                      fontSize:'11px', fontWeight:700, color:'var(--qme-gray-500)',
                      textAlign: col === 'Actions' ? 'right' : 'left',
                      textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap',
                    }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding:'32px', textAlign:'center', color:'var(--qme-gray-400)' }}>
                      No tickets match the current filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map(ticket => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      slaMin={queue.slaThresholdMin}
                      density={density}
                      onCall={(id)  => { onUpdate(queue.id, id, 'ready');      toast.success(`Ticket ${id} called!`); }}
                      onArrive={(id)=> { onUpdate(queue.id, id, 'checked_in'); toast.success(`${ticket.guestName} checked in ✓`); }}
                      onCancel={(id)=> setCancelId(id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Counters row */}
          <div style={{
            padding:'10px 16px',
            borderTop:'1px solid var(--qme-gray-100)',
            display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center',
          }}>
            <span style={{ fontSize:'12px', color:'var(--qme-gray-500)', fontWeight:600 }}>Counters:</span>
            {queue.counters.map(c => (
              <span key={c.id} style={{
                padding:'3px 10px',
                borderRadius:'var(--qme-r-full)',
                background: c.status === 'busy' ? 'var(--qme-warning-bg)' : c.status === 'open' ? 'var(--qme-success-bg)' : 'var(--qme-gray-100)',
                border:'1px solid ' + (c.status === 'busy' ? 'var(--qme-warning-border)' : c.status === 'open' ? 'var(--qme-success-border)' : 'var(--qme-gray-200)'),
                color: c.status === 'busy' ? 'var(--qme-warning)' : c.status === 'open' ? 'var(--qme-success)' : 'var(--qme-gray-500)',
                fontSize:'12px', fontWeight:600,
              }}>
                {c.name} {c.status === 'busy' && c.currentTicket ? `· ${c.currentTicket}` : c.status === 'open' ? '· Ready' : '· Closed'}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Cancel confirm */}
      <ConfirmModal
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => { if (cancelId) { onUpdate(queue.id, cancelId, 'cancelled'); toast.error(`Ticket ${cancelId} cancelled.`); } }}
        title="Cancel this ticket?"
        message={`Are you sure you want to cancel ticket ${cancelId}? This cannot be undone.`}
        confirmLabel="Cancel Ticket"
        cancelLabel="Keep"
        danger
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const [queues,    setQueues]    = useState(MOCK_QUEUES);
  const [density,   setDensity]   = useState<'compact' | 'comfy'>('comfy');
  const [search,    setSearch]    = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminDark, setAdminDark] = useState(false);

  const totalWaiting   = queues.reduce((s, q) => s + q.metrics.waiting, 0);
  const totalCompleted = queues.reduce((s, q) => s + q.metrics.completed, 0);
  const totalBreaches  = queues.reduce((s, q) => s + q.metrics.slaBreachCount, 0);
  const avgWait = Math.round(queues.reduce((s, q) => s + q.metrics.avgWaitMin, 0) / queues.length);

  const handleUpdate = useCallback((queueId: string, ticketId: string, newStatus: TicketStatus) => {
    setQueues(prev => prev.map(q => {
      if (q.id !== queueId) return q;
      const tickets = q.tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t);
      const waiting   = tickets.filter(t => t.status === 'waiting').length;
      const ready     = tickets.filter(t => t.status === 'ready').length;
      const completed = tickets.filter(t => t.status === 'checked_in').length;
      return { ...q, tickets, metrics: { ...q.metrics, waiting, ready, completed } };
    }));
  }, []);

  return (
    <div style={{
      display:   'flex',
      minHeight: 'calc(100vh - 57px)',
      background: adminDark ? 'var(--qme-gray-900)' : 'var(--qme-gray-50)',
      fontFamily:'var(--qme-font)',
    }}>
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />

      {/* Main content */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>

        {/* Top bar */}
        <div style={{
          padding:       '12px 24px',
          background:    '#fff',
          borderBottom:  '1px solid var(--qme-gray-200)',
          display:       'flex',
          alignItems:    'center',
          gap:           '12px',
          flexWrap:      'wrap',
          boxShadow:     'var(--qme-shadow-xs)',
        }}>
          <div>
            <h1 style={{ margin:0, fontSize:'18px', fontWeight:700, color:'var(--qme-gray-900)', lineHeight:1 }}>
              Queue Dashboard
            </h1>
            <p style={{ margin:'2px 0 0', fontSize:'12px', color:'var(--qme-gray-500)' }}>
              TechConf 2026 · Live since 08:00
            </p>
          </div>

          {/* Search */}
          <div style={{ position:'relative', flex:'1 1 200px', maxWidth:'320px', marginLeft:'16px' }}>
            <Search size={15} style={{
              position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)',
              color:'var(--qme-gray-400)', pointerEvents:'none',
            }} />
            <input
              type="search"
              placeholder="Search guest or ticket…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search tickets"
              className="qme-focus"
              style={{
                width:'100%', padding:'8px 12px 8px 34px',
                border:'1.5px solid var(--qme-gray-300)',
                borderRadius:'var(--qme-r)', background:'#fff',
                fontSize:'13px', color:'var(--qme-gray-800)',
                outline:'none', boxSizing:'border-box', fontFamily:'var(--qme-font)',
              }}
            />
          </div>

          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            {/* Density toggle */}
            <div style={{
              display:'flex', borderRadius:'var(--qme-r)', overflow:'hidden',
              border:'1px solid var(--qme-gray-300)',
            }}>
              {(['compact','comfy'] as const).map(d => (
                <button key={d} onClick={() => setDensity(d)} className="qme-focus"
                  aria-pressed={density === d}
                  style={{
                    padding:'6px 12px', border:'none', cursor:'pointer',
                    background: density === d ? 'var(--qme-primary)' : '#fff',
                    color:      density === d ? '#fff' : 'var(--qme-gray-500)',
                    fontSize:'12px', fontWeight:600, fontFamily:'var(--qme-font)',
                    transition:'all var(--qme-dur-fast) var(--qme-ease)',
                  }}
                >
                  {d === 'compact' ? 'Compact' : 'Comfy'}
                </button>
              ))}
            </div>

            {/* Admin dark toggle */}
            <button onClick={() => setAdminDark(p => !p)} className="qme-focus"
              aria-label="Toggle admin dark mode"
              style={{
                padding:'7px 12px', borderRadius:'var(--qme-r)',
                border:'1px solid var(--qme-gray-300)',
                background:adminDark ? 'var(--qme-gray-800)' : '#fff',
                color:adminDark ? '#fff' : 'var(--qme-gray-600)',
                fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'var(--qme-font)',
              }}
            >
              {adminDark ? '☀ Light' : '☾ Dark'}
            </button>

            <QmeIconButton icon={<Download size={15}/>} label="Export" variant="ghost" />
            <QmeIconButton icon={<RefreshCw size={15}/>} label="Refresh" variant="ghost" />
          </div>
        </div>

        {/* Content area */}
        <div style={{ flex:1, padding:'20px 24px', overflowY:'auto' }}>

          {/* Metrics row */}
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',
            gap:'12px',
            marginBottom:'20px',
          }}>
            <MetricCard label="Waiting"       value={totalWaiting}   sub="guests"     icon={<Clock size={16}/>}    color="primary"  trend="up" />
            <MetricCard label="Checked In"    value={totalCompleted} sub="today"      icon={<LogIn size={16}/>}    color="success"  trend="down" />
            <MetricCard label="SLA Breaches"  value={totalBreaches}  sub="queues"     icon={<AlertTriangle size={16}/>} color={totalBreaches > 0 ? 'warning' : 'neutral'} />
            <MetricCard label="Avg Wait"      value={`${avgWait}m`}  sub="all queues" icon={<TrendingDown size={16}/>} color="neutral"  trend="down" />
            <MetricCard label="Live Updates"  value="ON"             sub="WebSocket"  icon={<Wifi size={16}/>}     color="success" />
          </div>

          {/* SLA alert banner */}
          {totalBreaches > 0 && (
            <div className="qme-slide-down" style={{
              background:   'var(--qme-warning-bg)',
              border:       '1px solid var(--qme-warning-border)',
              borderRadius: 'var(--qme-r-lg)',
              padding:      '12px 16px',
              marginBottom: '16px',
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
            }}>
              <AlertTriangle size={16} color="var(--qme-warning)" />
              <p style={{ margin:0, fontSize:'13px', color:'var(--qme-warning)', fontWeight:600 }}>
                {totalBreaches} ticket{totalBreaches > 1 ? 's' : ''} have exceeded the SLA threshold. Highlighted rows below need immediate attention.
              </p>
              <QmeButton variant="ghost" size="sm" style={{ marginLeft:'auto', color:'var(--qme-warning)', borderColor:'var(--qme-warning-border)' }}
                onClick={() => {
                  const first = queues.flatMap(q => q.tickets).find(t => t.slaBreached);
                  if (first) toast.warning(`Priority: ${first.guestName} (${first.id}) waited ${first.waitMinutes}m`);
                }}>
                View First
              </QmeButton>
            </div>
          )}

          {/* Queue panels */}
          {queues.map(queue => (
            <QueuePanel
              key={queue.id}
              queue={queue}
              density={density}
              search={search}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
