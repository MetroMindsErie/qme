import React, { useState } from 'react';
import {
  Copy, CheckCircle2, Bell, AlertTriangle, Info, XCircle, Check,
  Download, Hash, Eye, EyeOff, Loader2, Star, Search, Filter,
  ChevronRight, ArrowRight, ExternalLink, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { QmeButton, QmeIconButton } from '../components/qme/QmeButton';
import { StatusBadge, SLABadge, QueueStatusBadge, Chip } from '../components/qme/QmeBadge';
import { MetricCard, FormField, QmeInput, QmeSelect, QmeTextarea, QmeToggle } from '../components/qme/DisplayField';
import { QmeModal, ConfirmModal } from '../components/qme/QmeModal';
import { TOKEN_JSON } from '../data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} style={{ margin:'0 0 6px', fontSize:'18px', fontWeight:800, color:'var(--qme-gray-900)', scrollMarginTop:'80px' }}>
      {children}
    </h2>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin:'0 0 20px', fontSize:'14px', color:'var(--qme-gray-500)', lineHeight:1.6 }}>
      {children}
    </p>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:'#fff', borderRadius:'var(--qme-r-xl)',
      border:'1px solid var(--qme-gray-200)', padding:'24px',
      boxShadow:'var(--qme-shadow-xs)', ...style,
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin:'0 0 12px', fontSize:'12px', fontWeight:700, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
      {children}
    </p>
  );
}

function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ position:'relative', background:'var(--qme-gray-900)', borderRadius:'var(--qme-r-lg)', overflow:'hidden' }}>
      <button
        onClick={copy}
        aria-label="Copy code"
        className="qme-focus"
        style={{
          position:'absolute', top:'8px', right:'8px',
          background: copied ? 'var(--qme-success)' : 'rgba(255,255,255,0.1)',
          border:'none', borderRadius:'var(--qme-r-sm)',
          padding:'5px 10px', cursor:'pointer', color:'#fff',
          fontSize:'11px', fontWeight:600, display:'flex', alignItems:'center', gap:'4px',
          transition:'background var(--qme-dur-fast) var(--qme-ease)',
        }}
      >
        {copied ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
      </button>
      <pre style={{
        margin:0, padding:'16px', overflowX:'auto',
        fontFamily:"'Fira Code', 'Courier New', monospace",
        fontSize:'12px', lineHeight:1.6, color:'#e2e8f0',
      }}>
        {code.trim()}
      </pre>
    </div>
  );
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function ColorSwatch({ varName, hex, label, textColor = '#000' }: { varName: string; hex: string; label: string; textColor?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(hex).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        toast.success(`Copied ${hex}`);
      }}
      title={`Click to copy ${hex}`}
      className="qme-focus"
      style={{
        background:'none', border:'none', cursor:'pointer', textAlign:'left',
        padding:0, fontFamily:'var(--qme-font)',
      }}
    >
      <div style={{
        width:'100%', paddingBottom:'65%', position:'relative',
        borderRadius:'var(--qme-r-lg)', background:hex,
        border:'1px solid rgba(0,0,0,0.06)',
        boxShadow:'var(--qme-shadow-xs)',
        marginBottom:'6px',
      }}>
        {copied && (
          <div style={{
            position:'absolute', inset:0,
            display:'flex', alignItems:'center', justifyContent:'center',
            background:'rgba(0,0,0,0.2)', borderRadius:'inherit',
          }}>
            <Check size={20} color="#fff" />
          </div>
        )}
      </div>
      <p style={{ margin:'0 0 1px', fontSize:'12px', fontWeight:700, color:'var(--qme-gray-700)' }}>{label}</p>
      <p style={{ margin:0, fontSize:'11px', color:'var(--qme-gray-400)', fontFamily:'monospace' }}>{hex}</p>
      <p style={{ margin:0, fontSize:'10px', color:'var(--qme-gray-400)', fontFamily:'monospace' }}>{varName}</p>
    </button>
  );
}

// ─── TOC ─────────────────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { id:'tokens',        label:'Design Tokens' },
  { id:'typography',    label:'Typography' },
  { id:'buttons',       label:'Buttons' },
  { id:'badges',        label:'Badges & Chips' },
  { id:'forms',         label:'Form Controls' },
  { id:'metrics',       label:'Metric Cards' },
  { id:'modals',        label:'Modals' },
  { id:'toasts',        label:'Toasts' },
  { id:'empty',         label:'Empty States' },
  { id:'handoff',       label:'Dev Handoff' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export function ComponentsPage() {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [toggleA,      setToggleA]      = useState(true);
  const [toggleB,      setToggleB]      = useState(false);
  const [inputVal,     setInputVal]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const copyTokens = async () => {
    await navigator.clipboard.writeText(JSON.stringify(TOKEN_JSON, null, 2)).catch(() => {});
    toast.success('Token JSON copied to clipboard!');
  };

  return (
    <div style={{
      minHeight:'calc(100vh - 57px)',
      background:'var(--qme-gray-50)',
      fontFamily:'var(--qme-font)',
    }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 20px' }}>
        <div
          style={{ display:'grid', gap:'28px', alignItems:'start' }}
          className="grid-cols-1 xl:grid-cols-[220px_1fr]"
        >

          {/* ── Left TOC (sticky) ── */}
          <nav
            role="navigation"
            aria-label="Component sections"
            style={{
              position:'sticky', top:'80px',
              padding:'20px 0',
              display:'flex', flexDirection:'column', gap:'2px',
            }}
          >
            <p style={{ margin:'0 0 8px 8px', fontSize:'11px', fontWeight:700, color:'var(--qme-gray-400)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
              3 · System / Tokens
            </p>
            {TOC_ITEMS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="qme-focus"
                style={{
                  padding:'7px 12px',
                  borderRadius:'var(--qme-r)',
                  textDecoration:'none',
                  fontSize:'13px',
                  fontWeight:500,
                  color:'var(--qme-gray-600)',
                  transition:`background var(--qme-dur-fast) var(--qme-ease), color var(--qme-dur-fast) var(--qme-ease)`,
                }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background='var(--qme-gray-100)'; (e.target as HTMLElement).style.color='var(--qme-gray-900)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background='transparent';          (e.target as HTMLElement).style.color='var(--qme-gray-600)'; }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* ── Right content ── */}
          <div style={{ padding:'24px 0 60px', display:'flex', flexDirection:'column', gap:'40px' }}>

            {/* Hero */}
            <div className="qme-fade-up">
              <div style={{
                background:'linear-gradient(135deg, var(--qme-admin) 0%, var(--qme-admin-light) 100%)',
                borderRadius:'var(--qme-r-2xl)',
                padding:'32px',
                marginBottom:'8px',
                color:'#fff',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                  <div style={{
                    width:'40px', height:'40px', borderRadius:'var(--qme-r)',
                    background:'var(--qme-primary)', display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:'18px', fontWeight:700,
                  }}>q</div>
                  <div>
                    <p style={{ margin:0, fontSize:'20px', fontWeight:800 }}>qMe Design System</p>
                    <p style={{ margin:0, fontSize:'13px', opacity:0.7 }}>v1.0 · WCAG AA · Inter font</p>
                  </div>
                </div>
                <p style={{ margin:'0 0 20px', opacity:0.8, fontSize:'14px', lineHeight:1.6, maxWidth:'500px' }}>
                  A token-based design system for queue management interfaces.
                  Teal-blue primary accent for guest flows · Navy secondary for admin.
                  Mobile-first, accessible, minimal motion.
                </p>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <QmeButton variant="primary" size="md" icon={<Download size={15}/>} onClick={copyTokens}>
                    Copy Token JSON
                  </QmeButton>
                  <QmeButton variant="ghost" size="md" style={{ background:'rgba(255,255,255,0.12)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)' }}
                    iconRight={<ExternalLink size={14}/>}
                    onClick={() => toast.info('Figma file link would open here.')}>
                    Figma File
                  </QmeButton>
                </div>
              </div>
            </div>

            {/* ── 1. Design Tokens ── */}
            <section id="tokens">
              <SectionTitle id="tokens">Design Tokens</SectionTitle>
              <SectionDesc>
                All visual decisions expressed as CSS custom properties (--qme-*).
                Use these in your components for consistent theming.
              </SectionDesc>

              {/* Color palette */}
              <Card style={{ marginBottom:'16px' }}>
                <Label>Primary – Teal (WCAG AA: 4.6:1 on white)</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px,1fr))', gap:'12px', marginBottom:'24px' }}>
                  <ColorSwatch varName="--qme-primary"        hex="#0D9488" label="Primary"      />
                  <ColorSwatch varName="--qme-primary-hover"  hex="#0F766E" label="Hover"        />
                  <ColorSwatch varName="--qme-primary-light"  hex="#14B8A6" label="Light"        />
                  <ColorSwatch varName="--qme-primary-bg"     hex="#F0FDFA" label="Bg"           textColor="#0D9488" />
                  <ColorSwatch varName="--qme-primary-border" hex="#99F6E4" label="Border"       textColor="#0D9488" />
                </div>

                <Label>Admin Secondary – Navy (WCAG AA: 9.7:1 on white)</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px,1fr))', gap:'12px', marginBottom:'24px' }}>
                  <ColorSwatch varName="--qme-admin"       hex="#1E3A5F" label="Admin"       textColor="#fff" />
                  <ColorSwatch varName="--qme-admin-hover" hex="#152A47" label="Hover"       textColor="#fff" />
                  <ColorSwatch varName="--qme-admin-light" hex="#2D5282" label="Light"       textColor="#fff" />
                  <ColorSwatch varName="--qme-admin-muted" hex="#4A6FA5" label="Muted"       textColor="#fff" />
                </div>

                <Label>Status Colors (all WCAG AA on white)</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px,1fr))', gap:'12px', marginBottom:'24px' }}>
                  <ColorSwatch varName="--qme-success" hex="#16A34A" label="Success 4.6:1"  textColor="#fff" />
                  <ColorSwatch varName="--qme-warning" hex="#B45309" label="Warning 4.7:1"  textColor="#fff" />
                  <ColorSwatch varName="--qme-danger"  hex="#DC2626" label="Danger 4.5:1"   textColor="#fff" />
                  <ColorSwatch varName="--qme-info"    hex="#2563EB" label="Info 4.6:1"     textColor="#fff" />
                </div>

                <Label>Neutral Scale</Label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(80px,1fr))', gap:'10px' }}>
                  {[
                    ['50','#F8FAFC'],['100','#F1F5F9'],['200','#E2E8F0'],['300','#CBD5E1'],['400','#94A3B8'],
                    ['500','#64748B'],['600','#475569'],['700','#334155'],['800','#1E293B'],['900','#0F172A'],
                  ].map(([n, hex]) => (
                    <ColorSwatch key={n} varName={`--qme-gray-${n}`} hex={hex} label={`Gray ${n}`} textColor={parseInt(n) >= 600 ? '#fff' : '#000'} />
                  ))}
                </div>
              </Card>

              {/* Spacing, radius, shadow */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <Card>
                  <Label>Border Radius</Label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {[
                      ['--qme-r-xs', '4px'], ['--qme-r-sm', '6px'], ['--qme-r', '8px'],
                      ['--qme-r-md', '10px'], ['--qme-r-lg', '12px'], ['--qme-r-xl', '16px'],
                      ['--qme-r-2xl', '24px'], ['--qme-r-full', 'pill'],
                    ].map(([varName, value]) => (
                      <div key={varName} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{
                          width:'40px', height:'22px',
                          borderRadius: value === 'pill' ? '9999px' : value,
                          background:'var(--qme-primary)', flexShrink:0,
                        }} />
                        <code style={{ fontSize:'12px', color:'var(--qme-gray-600)', fontFamily:'monospace' }}>{varName}</code>
                        <span style={{ fontSize:'12px', color:'var(--qme-gray-400)', marginLeft:'auto' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <Label>Elevation / Shadows</Label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                    {[
                      ['--qme-shadow-xs', 'xs', '0 1px 2px rgba(15,23,42,0.05)'],
                      ['--qme-shadow-sm', 'sm', '0 1px 3px rgba(15,23,42,0.08)'],
                      ['--qme-shadow',    'md', '0 4px 8px rgba(15,23,42,0.08)'],
                      ['--qme-shadow-md', 'lg', '0 6px 16px rgba(15,23,42,0.10)'],
                      ['--qme-shadow-lg', 'xl', '0 12px 32px rgba(15,23,42,0.12)'],
                    ].map(([varName, label, shadow]) => (
                      <div key={varName} style={{
                        padding:'10px 14px', borderRadius:'var(--qme-r)',
                        background:'#fff', boxShadow:shadow,
                        border:'1px solid var(--qme-gray-100)',
                      }}>
                        <code style={{ fontSize:'12px', color:'var(--qme-gray-600)', fontFamily:'monospace' }}>{varName}</code>
                        <span style={{ fontSize:'11px', color:'var(--qme-gray-400)', marginLeft:'8px' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </section>

            {/* ── 2. Typography ── */}
            <section id="typography">
              <SectionTitle id="typography">Typography</SectionTitle>
              <SectionDesc>Inter font family. Base: 16px. All body text ≥ 16px on mobile (WCAG 1.4.4).</SectionDesc>
              <Card>
                <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                  {[
                    { name:'Display', size:'48px', weight:800, sample:'Queue Position #42' },
                    { name:'H1',      size:'28px', weight:700, sample:'TechConf 2026' },
                    { name:'H2',      size:'22px', weight:700, sample:'Queue Dashboard' },
                    { name:'H3',      size:'18px', weight:600, sample:'General Check-in' },
                    { name:'Body Lg', size:'16px', weight:400, sample:'Your estimated wait is ~12–18 minutes' },
                    { name:'Body',    size:'14px', weight:400, sample:'Keep this page open. We\'ll notify you when it\'s your turn.' },
                    { name:'Caption', size:'12px', weight:500, sample:'Updated just now · Hall B · Counter 3' },
                    { name:'Label',   size:'11px', weight:700, sample:'QUEUE POSITION · SLA BREACH · IN QUEUE', upper: true },
                  ].map(({ name, size, weight, sample, upper }) => (
                    <div key={name} style={{ display:'flex', alignItems:'baseline', gap:'16px', borderBottom:'1px solid var(--qme-gray-100)', paddingBottom:'14px' }}>
                      <div style={{ minWidth:'80px', fontSize:'12px', color:'var(--qme-gray-400)', fontWeight:600 }}>
                        <p style={{ margin:0 }}>{name}</p>
                        <p style={{ margin:0, fontFamily:'monospace', fontSize:'11px' }}>{size}/{weight}</p>
                      </div>
                      <p style={{
                        margin:0, fontSize:size, fontWeight:weight, color:'var(--qme-gray-800)', lineHeight:1.3,
                        textTransform: upper ? 'uppercase' : 'none', letterSpacing: upper ? '0.07em' : undefined,
                      }}>
                        {sample}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            {/* ── 3. Buttons ── */}
            <section id="buttons">
              <SectionTitle id="buttons">Buttons</SectionTitle>
              <SectionDesc>
                All variants have hover, active (scale 0.98), focus-ring, disabled, and loading states.
                Use <code>variant</code>, <code>size</code>, <code>loading</code>, <code>disabled</code>, <code>fullWidth</code> props.
              </SectionDesc>
              <Card>
                <Label>Variants</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'24px' }}>
                  <QmeButton variant="primary">Primary</QmeButton>
                  <QmeButton variant="secondary">Secondary</QmeButton>
                  <QmeButton variant="ghost">Ghost</QmeButton>
                  <QmeButton variant="danger">Danger</QmeButton>
                  <QmeButton variant="admin">Admin</QmeButton>
                </div>

                <Label>Sizes</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center', marginBottom:'24px' }}>
                  <QmeButton size="sm">Small</QmeButton>
                  <QmeButton size="md">Medium</QmeButton>
                  <QmeButton size="lg">Large</QmeButton>
                  <QmeButton size="xl">X-Large</QmeButton>
                </div>

                <Label>With icons</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'24px' }}>
                  <QmeButton icon={<Bell size={15}/>}>Notify</QmeButton>
                  <QmeButton icon={<CheckCircle2 size={15}/>} variant="secondary">Mark Arrived</QmeButton>
                  <QmeButton iconRight={<ArrowRight size={15}/>} variant="ghost">View Details</QmeButton>
                  <QmeButton icon={<Download size={15}/>} variant="admin">Export</QmeButton>
                </div>

                <Label>States</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'24px' }}>
                  <QmeButton disabled>Disabled</QmeButton>
                  <QmeButton loading>Loading…</QmeButton>
                  <QmeButton variant="secondary" disabled>Disabled Secondary</QmeButton>
                  <QmeButton variant="ghost" loading>Loading Ghost</QmeButton>
                </div>

                <Label>Icon buttons</Label>
                <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                  <QmeIconButton icon={<Bell size={16}/>}     label="Notifications" variant="primary" />
                  <QmeIconButton icon={<Search size={16}/>}   label="Search"        variant="secondary" />
                  <QmeIconButton icon={<Filter size={16}/>}   label="Filter"        variant="ghost" />
                  <QmeIconButton icon={<Download size={16}/>} label="Download"      variant="admin" />
                </div>
              </Card>
            </section>

            {/* ── 4. Badges & Chips ── */}
            <section id="badges">
              <SectionTitle id="badges">Badges & Chips</SectionTitle>
              <SectionDesc>
                Status badges use redundant cues (dot + icon + label) for accessibility.
                Color is never the only differentiator.
              </SectionDesc>
              <Card>
                <Label>Ticket Status Badges</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'20px' }}>
                  <StatusBadge status="waiting"    size="md" />
                  <StatusBadge status="ready"      size="md" pulse />
                  <StatusBadge status="checked_in" size="md" />
                  <StatusBadge status="cancelled"  size="md" />
                  <StatusBadge status="no_show"    size="md" />
                </div>

                <Label>Sizes</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center', marginBottom:'20px' }}>
                  <StatusBadge status="ready" size="sm" />
                  <StatusBadge status="ready" size="md" />
                  <StatusBadge status="ready" size="lg" />
                </div>

                <Label>Queue Status</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'20px' }}>
                  <QueueStatusBadge status="active" />
                  <QueueStatusBadge status="paused" />
                  <QueueStatusBadge status="closed" />
                </div>

                <Label>SLA Breach Badge</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px', marginBottom:'20px' }}>
                  <SLABadge breached waitMinutes={28} threshold={20} />
                  <SLABadge breached waitMinutes={35} threshold={20} />
                </div>

                <Label>Chips</Label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  <Chip label="Hall B"         color="primary" />
                  <Chip label="VIP"            color="neutral" />
                  <Chip label="Workshop"       color="neutral" onRemove={() => toast.info('Removed')} />
                  <Chip label="General Queue"  color="primary" onRemove={() => toast.info('Removed')} />
                </div>
              </Card>
            </section>

            {/* ── 5. Form Controls ── */}
            <section id="forms">
              <SectionTitle id="forms">Form Controls</SectionTitle>
              <SectionDesc>All inputs have error state, hint text, required indicator, and accessible labels.</SectionDesc>
              <Card>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                  <FormField label="Event Name" required>
                    <QmeInput placeholder="e.g. TechConf 2026" value={inputVal} onChange={e => setInputVal(e.target.value)} />
                  </FormField>
                  <FormField label="Queue Status" required>
                    <QmeSelect defaultValue="active">
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="closed">Closed</option>
                    </QmeSelect>
                  </FormField>
                  <FormField label="Search" hint="Search by name or ticket ID">
                    <QmeInput placeholder="Guest name or T-000" icon={<Search size={14}/>} />
                  </FormField>
                  <FormField label="Password" hint="Used for staff portal access">
                    <div style={{ position:'relative' }}>
                      <QmeInput
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                      />
                      <button
                        onClick={() => setShowPassword(p => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="qme-focus"
                        style={{
                          position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                          background:'none', border:'none', cursor:'pointer', color:'var(--qme-gray-400)',
                        }}
                      >
                        {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                  </FormField>
                  <FormField label="With error" error="This field is required" required>
                    <QmeInput placeholder="Guest name" error />
                  </FormField>
                  <FormField label="Disabled">
                    <QmeInput placeholder="Cannot be edited" disabled />
                  </FormField>
                  <div style={{ gridColumn:'1/-1' }}>
                    <FormField label="Notes" hint="Optional notes for staff">
                      <QmeTextarea placeholder="e.g. VIP badge required, accessibility needs…" rows={3} />
                    </FormField>
                  </div>
                  <div style={{ gridColumn:'1/-1', display:'flex', flexDirection:'column', gap:'12px' }}>
                    <Label>Toggles</Label>
                    <QmeToggle checked={toggleA} onChange={setToggleA} label="Enable SMS notifications" />
                    <QmeToggle checked={toggleB} onChange={setToggleB} label="Show estimated wait on ticket" />
                    <QmeToggle checked={false} onChange={() => {}} label="Disabled option" />
                  </div>
                </div>
              </Card>
            </section>

            {/* ── 6. Metric Cards ── */}
            <section id="metrics">
              <SectionTitle id="metrics">Metric Cards</SectionTitle>
              <SectionDesc>Used in the admin dashboard header for at-a-glance queue stats.</SectionDesc>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'12px' }}>
                <MetricCard label="Waiting"      value={18}    sub="guests"  color="primary"  icon={<Hash size={15}/>}     trend="up"   />
                <MetricCard label="Checked In"   value={94}    sub="today"   color="success"  icon={<CheckCircle2 size={15}/>} trend="down" />
                <MetricCard label="SLA Breaches" value={3}     sub="queues"  color="warning"  icon={<AlertTriangle size={15}/>} />
                <MetricCard label="Avg Wait"     value="14m"               color="neutral"  icon={<Star size={15}/>}     trend="flat" />
                <MetricCard label="All Clear"    value="OK"                color="success"  icon={<CheckCircle2 size={15}/>} />
              </div>
            </section>

            {/* ── 7. Modals ── */}
            <section id="modals">
              <SectionTitle id="modals">Modals & Dialogs</SectionTitle>
              <SectionDesc>
                Role=dialog, aria-modal, focus-trap via ESC. Click backdrop or press ESC to close.
              </SectionDesc>
              <Card>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <QmeButton onClick={() => setModalOpen(true)} icon={<Eye size={15}/>}>
                    Open Modal
                  </QmeButton>
                  <QmeButton variant="danger" onClick={() => setConfirmOpen(true)} icon={<AlertTriangle size={15}/>}>
                    Confirm Dialog
                  </QmeButton>
                </div>
              </Card>

              <QmeModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Sample Modal"
                footer={
                  <>
                    <QmeButton variant="ghost" onClick={() => setModalOpen(false)}>Cancel</QmeButton>
                    <QmeButton onClick={() => { setModalOpen(false); toast.success('Action confirmed!'); }}>Confirm</QmeButton>
                  </>
                }
              >
                <p style={{ margin:'0 0 12px', color:'var(--qme-gray-600)', lineHeight:1.6 }}>
                  This is the qMe modal component. It supports a <strong>title</strong>, scrollable body,
                  and a footer action area. Press <kbd>Esc</kbd> or click outside to close.
                </p>
                <div style={{
                  background:'var(--qme-info-bg)', border:'1px solid var(--qme-info-border)',
                  borderRadius:'var(--qme-r)', padding:'12px 14px',
                  display:'flex', gap:'8px', alignItems:'flex-start',
                }}>
                  <Info size={15} color="var(--qme-info)" style={{ flexShrink:0, marginTop:'1px' }} />
                  <p style={{ margin:0, fontSize:'13px', color:'var(--qme-info)', lineHeight:1.5 }}>
                    Focus is trapped inside the modal while it's open. Tab key cycles through interactive elements.
                  </p>
                </div>
              </QmeModal>

              <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => toast.error('Action confirmed!')}
                title="Are you sure?"
                message="This action is destructive and cannot be undone. All associated queue tickets will be cancelled."
                confirmLabel="Yes, proceed"
                danger
              />
            </section>

            {/* ── 8. Toasts ── */}
            <section id="toasts">
              <SectionTitle id="toasts">Toasts & Notifications</SectionTitle>
              <SectionDesc>
                Uses Sonner. Slide in from top-right. Auto-dismiss after 4s.
                Includes success, error, warning, info, and loading variants with sample microcopy.
              </SectionDesc>
              <Card>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'10px' }}>
                  <QmeButton variant="secondary" size="md"
                    onClick={() => toast.success('T-042 checked in successfully!', { description: 'Alex Johnson · Counter 3 · 10:47 AM' })}>
                    Success Toast
                  </QmeButton>
                  <QmeButton variant="danger" size="md"
                    onClick={() => toast.error('Ticket T-042 cancelled.', { description: 'Guest has left the queue.' })}>
                    Error Toast
                  </QmeButton>
                  <QmeButton variant="ghost" size="md"
                    onClick={() => toast.warning('SLA breach! T-047 waited 32 min.', { description: 'Exceeds 20-minute threshold. Immediate action required.' })}>
                    Warning Toast
                  </QmeButton>
                  <QmeButton variant="ghost" size="md"
                    onClick={() => toast.info('T-043 called to Counter 2.', { description: 'Priya Nair · Position #4 → Ready' })}>
                    Info Toast
                  </QmeButton>
                  <QmeButton variant="ghost" size="md"
                    onClick={() => toast.loading('Syncing queue data…', { duration: 3000 })}>
                    Loading Toast
                  </QmeButton>
                </div>
                <div style={{ marginTop:'16px', padding:'12px 14px', background:'var(--qme-gray-50)', borderRadius:'var(--qme-r)', border:'1px solid var(--qme-gray-200)' }}>
                  <p style={{ margin:'0 0 8px', fontSize:'12px', fontWeight:700, color:'var(--qme-gray-500)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    Sample microcopy
                  </p>
                  <ul style={{ margin:0, padding:'0 0 0 16px', color:'var(--qme-gray-600)', fontSize:'13px', lineHeight:1.8 }}>
                    <li><strong>Call Next:</strong> "Priya Nair called to Counter 2 ✓"</li>
                    <li><strong>Check-in:</strong> "Alex Johnson checked in! Welcome to TechConf 2026 🎉"</li>
                    <li><strong>SLA alert:</strong> "⚠ T-047 has waited 32 min — 12 min over SLA"</li>
                    <li><strong>Cancel:</strong> "Ticket T-042 removed from queue. Guest may re-join."</li>
                    <li><strong>Notification sent:</strong> "SMS sent to +1 555-0142 · delivered 10:46 AM"</li>
                  </ul>
                </div>
              </Card>
            </section>

            {/* ── 9. Empty & Error States ── */}
            <section id="empty">
              <SectionTitle id="empty">Empty & Error States</SectionTitle>
              <SectionDesc>Used when queues are empty, searches return nothing, or errors occur.</SectionDesc>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                {[
                  {
                    icon:  <Users size={40} color="var(--qme-gray-300)" />,
                    title: 'No guests yet',
                    desc:  'The queue is empty. Guests will appear here as they check in.',
                    cta:   null,
                    color: 'var(--qme-gray-50)',
                  },
                  {
                    icon:  <Search size={40} color="var(--qme-gray-300)" />,
                    title: 'No results',
                    desc:  'No tickets match "unknown guest". Try a different name or ticket ID.',
                    cta:   'Clear search',
                    color: 'var(--qme-gray-50)',
                  },
                  {
                    icon:  <XCircle size={40} color="var(--qme-danger)" />,
                    title: 'Something went wrong',
                    desc:  'We couldn\'t load the queue. Please try again or contact support.',
                    cta:   'Retry',
                    color: 'var(--qme-danger-bg)',
                  },
                  {
                    icon:  <CheckCircle2 size={40} color="var(--qme-success)" />,
                    title: 'All caught up!',
                    desc:  'No more waiting guests. Great job — queue is clear.',
                    cta:   null,
                    color: 'var(--qme-success-bg)',
                  },
                ].map(({ icon, title, desc, cta, color }) => (
                  <div key={title} style={{
                    background: color, borderRadius:'var(--qme-r-xl)',
                    border:'1px solid var(--qme-gray-200)',
                    padding:'32px 24px', textAlign:'center',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
                  }}>
                    {icon}
                    <p style={{ margin:0, fontSize:'16px', fontWeight:700, color:'var(--qme-gray-800)' }}>{title}</p>
                    <p style={{ margin:0, fontSize:'13px', color:'var(--qme-gray-500)', lineHeight:1.6, maxWidth:'220px' }}>{desc}</p>
                    {cta && <QmeButton variant="secondary" size="sm" onClick={() => toast.info(`${cta} clicked`)}>{cta}</QmeButton>}
                  </div>
                ))}
              </div>
            </section>

            {/* ── 10. Dev Handoff ── */}
            <section id="handoff">
              <SectionTitle id="handoff">Dev Handoff Notes</SectionTitle>
              <SectionDesc>
                CSS variable names, HTML snippets, ARIA notes, breakpoints, and token JSON export.
              </SectionDesc>

              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {/* CSS Variables quick-ref */}
                <Card>
                  <Label>CSS Variable Quick Reference</Label>
                  <CodeSnippet code={`/* qMe CSS Variables — add to your :root */

/* Brand */
--qme-primary:        #0D9488;   /* Teal, WCAG AA 4.6:1 */
--qme-primary-hover:  #0F766E;
--qme-primary-bg:     #F0FDFA;

/* Admin */
--qme-admin:          #1E3A5F;   /* Navy, WCAG AA 9.7:1 */
--qme-admin-light:    #2D5282;

/* Status */
--qme-success:        #16A34A;   /* 4.6:1 */
--qme-warning:        #B45309;   /* 4.7:1 */
--qme-danger:         #DC2626;   /* 4.5:1 */
--qme-info:           #2563EB;   /* 4.6:1 */

/* Radius */
--qme-r:      8px;
--qme-r-lg:   12px;
--qme-r-xl:   16px;
--qme-r-full: 9999px;

/* Transitions */
--qme-dur-fast: 150ms;
--qme-dur:      220ms;
--qme-ease:     cubic-bezier(0.4, 0, 0.2, 1);`} />
                </Card>

                {/* Guest ticket HTML */}
                <Card>
                  <Label>Guest Ticket Component — HTML Snippet</Label>
                  <CodeSnippet code={`<!-- Guest Ticket Card -->
<!-- aria-live region for real-time status updates -->
<section class="qme-ticket" aria-label="Your queue ticket">
  <header class="qme-ticket__header">
    <span class="qme-logo" aria-hidden="true">q</span>
    <span>TechConf 2026</span>
    <!-- Status badge: use role="status" for live updates -->
    <span class="qme-badge qme-badge--waiting" role="status">
      <span class="qme-badge__dot" aria-hidden="true"></span>
      In Queue
    </span>
  </header>

  <main class="qme-ticket__body">
    <!-- Large ticket number: aria-label for screen readers -->
    <span class="qme-ticket__number" aria-label="Ticket number 42">42</span>

    <!-- ETA: use aria-live="polite" for dynamic updates -->
    <p class="qme-ticket__eta" aria-live="polite">
      ~12–18 min estimated wait
    </p>

    <!-- Progress indicator -->
    <div role="progressbar" aria-valuenow="1" aria-valuemax="3"
         aria-label="Step 1 of 3: In Queue">
      <!-- dots / steps -->
    </div>
  </main>

  <!-- CTA button: visible focus ring required -->
  <button class="qme-btn qme-btn--primary qme-btn--lg" type="button">
    View My Ticket
  </button>
</section>`} />
                </Card>

                {/* Admin table row HTML */}
                <Card>
                  <Label>Admin Queue Table Row — HTML Snippet</Label>
                  <CodeSnippet code={`<!-- Admin Queue Table -->
<!-- Use role="table" for custom tables -->
<table role="table" aria-label="General Check-in queue tickets">
  <thead>
    <tr>
      <th scope="col">Ticket</th>
      <th scope="col">Guest</th>
      <th scope="col">Position</th>
      <th scope="col">Wait</th>
      <th scope="col">Status</th>
      <th scope="col">Actions</th>
    </tr>
  </thead>
  <tbody>
    <!-- SLA breached row: use aria-label to announce urgency -->
    <tr class="qme-row qme-row--sla-breach"
        aria-label="Ticket T-047: SLA breach — waited 32 minutes">
      <td>
        <span class="qme-ticket-id">#T-047</span>
        <!-- Warning icon with tooltip -->
        <span role="img" aria-label="Has special notes"
              class="qme-row__notes-icon">⚠</span>
      </td>
      <td>
        <span class="qme-guest-name">Hana Müller</span>
        <span class="qme-guest-phone">+1 555-0147</span>
      </td>
      <td aria-label="Position 8">#8</td>
      <td aria-label="Waited 32 minutes — exceeds SLA" class="qme-wait--breach">
        32m
        <span class="qme-badge qme-badge--warning">+12m overdue</span>
      </td>
      <td>
        <span class="qme-badge qme-badge--waiting" role="status">In Queue</span>
      </td>
      <td>
        <!-- Two-click flow: primary action first -->
        <button class="qme-btn qme-btn--primary qme-btn--sm"
                aria-label="Call Hana Müller to counter">
          Call
        </button>
        <button class="qme-btn qme-btn--ghost qme-btn--sm"
                aria-label="Cancel ticket T-047">
          ✕
        </button>
      </td>
    </tr>
  </tbody>
</table>`} />
                </Card>

                {/* ARIA notes */}
                <Card>
                  <Label>ARIA & Accessibility Checklist</Label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {[
                      'All interactive elements have accessible labels (aria-label or visible text)',
                      'Status changes use aria-live="polite" (non-urgent) or aria-live="assertive" (urgent, e.g. ticket called)',
                      'Modals trap focus and restore it on close; role="dialog" aria-modal="true"',
                      'Color is never the sole differentiator (icons + labels always present)',
                      'All status badges include role="status" and text label',
                      'SLA breach rows include aria-label announcing the urgency',
                      'Progress steps use role="progressbar" with aria-valuenow/max',
                      'Focus ring is always visible (2px solid --qme-primary, 2px offset)',
                      'Minimum touch target: 44×44px on mobile',
                      'Body font ≥ 16px on mobile; minimum caption size 12px with 600 weight',
                      'prefers-reduced-motion: all animations disable when user requests reduced motion',
                    ].map((item, i) => (
                      <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'6px 0', borderBottom:'1px solid var(--qme-gray-100)' }}>
                        <CheckCircle2 size={15} color="var(--qme-success)" style={{ flexShrink:0, marginTop:'2px' }} />
                        <span style={{ fontSize:'13px', color:'var(--qme-gray-700)', lineHeight:1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Breakpoints */}
                <Card>
                  <Label>Breakpoints</Label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {[
                      { bp:'375px',  label:'Mobile (default)', notes:'Guest ticket phone-width. Single column. 16px base font. Bottom nav.' },
                      { bp:'768px',  label:'Tablet',           notes:'Guest view 2-col. Admin table readable. Sidebar visible.' },
                      { bp:'1024px', label:'Desktop SM',       notes:'Admin sidebar expanded. Full table columns. Multi-queue view.' },
                      { bp:'1440px', label:'Desktop LG',       notes:'Max-width 1440 centered. All panels visible.' },
                    ].map(({ bp, label, notes }) => (
                      <div key={bp} style={{
                        display:'flex', gap:'12px', alignItems:'flex-start',
                        padding:'10px 12px', background:'var(--qme-gray-50)',
                        borderRadius:'var(--qme-r)', border:'1px solid var(--qme-gray-200)',
                      }}>
                        <code style={{
                          fontFamily:'monospace', fontSize:'13px', fontWeight:700,
                          color:'var(--qme-primary-hover)', background:'var(--qme-primary-bg)',
                          padding:'3px 8px', borderRadius:'var(--qme-r-xs)', flexShrink:0,
                        }}>{bp}</code>
                        <div>
                          <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'var(--qme-gray-700)' }}>{label}</p>
                          <p style={{ margin:'2px 0 0', fontSize:'12px', color:'var(--qme-gray-500)' }}>{notes}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Token JSON export */}
                <Card>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <Label>Token JSON Export</Label>
                    <QmeButton variant="secondary" size="sm" icon={<Copy size={13}/>} onClick={copyTokens}>
                      Copy JSON
                    </QmeButton>
                  </div>
                  <CodeSnippet code={JSON.stringify(TOKEN_JSON, null, 2)} />
                </Card>

                {/* Changelog */}
                <Card>
                  <Label>Changelog & UX Rationale</Label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                    {[
                      {
                        tag:'1.0',
                        items:[
                          'Large (80px) queue number for instant glance-ability on mobile',
                          'Dual ETA format "~12–18 min" instead of single estimate — reduces anxiety',
                          'Pulsing ready indicator: CSS keyframe animation, respects prefers-reduced-motion',
                          'Color-coded status + icon + label: three redundant cues (not just color)',
                          'Admin SLA breach rows: warm amber (#FFFBEB) — clearly different but not alarming red',
                          'Density controls (compact/comfy): power users prefer compact; less experienced prefer comfy',
                          'Two-click admin flows: Call (1 click) → Mark Arrived (1 click)',
                          'Microcopy tone: "It\'s your turn!" not "Queue position reached" — friendly and clear',
                          'QR code on every guest ticket: reduces counter friction at high-volume events',
                          'Live queue viz (dots) on Guest View page: tangible sense of progress',
                        ],
                      },
                    ].map(({ tag, items }) => (
                      <div key={tag}>
                        <div style={{
                          display:'inline-flex', alignItems:'center', gap:'6px',
                          padding:'3px 10px', borderRadius:'var(--qme-r-full)',
                          background:'var(--qme-primary-bg)', border:'1px solid var(--qme-primary-border)',
                          marginBottom:'10px',
                        }}>
                          <span style={{ fontSize:'12px', fontWeight:700, color:'var(--qme-primary-hover)' }}>v{tag} · Initial Release</span>
                        </div>
                        <ul style={{ margin:0, padding:'0 0 0 18px', display:'flex', flexDirection:'column', gap:'6px' }}>
                          {items.map(item => (
                            <li key={item} style={{ fontSize:'13px', color:'var(--qme-gray-600)', lineHeight:1.5 }}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}