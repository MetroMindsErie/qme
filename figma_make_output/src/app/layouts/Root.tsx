import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Toaster } from 'sonner';
import { Users, LayoutDashboard, Layers, ChevronRight, Menu, X } from 'lucide-react';

type Section = 'guest' | 'admin' | 'system';

interface NavItem { label: string; path: string; }

const GUEST_ITEMS: NavItem[] = [
  { label: 'Queue Ticket',    path: '/guest/ticket' },
  { label: 'My Queue View',   path: '/guest/view'   },
];

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Queue Dashboard', path: '/admin/dashboard' },
  { label: 'Event Setup',     path: '/admin/event'     },
];

function getSection(pathname: string): Section {
  if (pathname.startsWith('/admin'))     return 'admin';
  if (pathname.startsWith('/components')) return 'system';
  return 'guest';
}

export function Root() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const section   = getSection(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const subItems = section === 'guest' ? GUEST_ITEMS
                 : section === 'admin' ? ADMIN_ITEMS
                 : [];

  return (
    <div style={{ minHeight:'100vh', background:'var(--qme-gray-50)', fontFamily:'var(--qme-font)' }}>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            fontFamily:   'var(--qme-font)',
            borderRadius: 'var(--qme-r-lg)',
            boxShadow:    'var(--qme-shadow-lg)',
          }
        }}
      />

      {/* ── Top navigation ───────────────────────────────────────────── */}
      <header
        role="banner"
        style={{
          background:  '#fff',
          borderBottom:'1px solid var(--qme-gray-200)',
          position:    'sticky',
          top:          0,
          zIndex:       200,
          boxShadow:   'var(--qme-shadow-xs)',
        }}
      >
        <div style={{
          maxWidth:       '1440px',
          margin:         '0 auto',
          padding:        '0 20px',
          height:         '56px',
          display:        'flex',
          alignItems:     'center',
          gap:            '0',
        }}>
          {/* Logo */}
          <button
            onClick={() => navigate('/guest/ticket')}
            aria-label="qMe home"
            className="qme-focus"
            style={{
              background:   'none',
              border:       'none',
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              marginRight:  '32px',
              padding:      '4px 0',
              flexShrink:   0,
            }}
          >
            <div style={{
              width:        '32px',
              height:       '32px',
              borderRadius: 'var(--qme-r)',
              background:   'var(--qme-primary)',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              color:        '#fff',
              fontSize:     '15px',
              fontWeight:   700,
            }}>
              q
            </div>
            <span style={{ fontSize:'17px', fontWeight:700, color:'var(--qme-gray-900)', letterSpacing:'-0.01em' }}>
              Me
            </span>
          </button>

          {/* Section tabs – desktop */}
          <nav
            role="navigation"
            aria-label="Main sections"
            style={{ display:'flex', alignItems:'center', gap:'4px', flex:1 }}
          >
            {[
              { key:'guest',  label:'1 · Guest',  icon:<Users size={15}/>,          path:'/guest/ticket' },
              { key:'admin',  label:'2 · Admin',  icon:<LayoutDashboard size={15}/>, path:'/admin/dashboard' },
              { key:'system', label:'3 · System', icon:<Layers size={15}/>,          path:'/components' },
            ].map(({ key, label, icon, path }) => {
              const active = section === key;
              return (
                <button
                  key={key}
                  onClick={() => navigate(path)}
                  aria-current={active ? 'page' : undefined}
                  className="qme-focus"
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '6px',
                    padding:      '6px 14px',
                    borderRadius: 'var(--qme-r)',
                    border:       'none',
                    background:   active ? 'var(--qme-primary-bg)' : 'transparent',
                    color:        active ? 'var(--qme-primary-hover)' : 'var(--qme-gray-600)',
                    fontWeight:   active ? 600 : 500,
                    fontSize:     '14px',
                    cursor:       'pointer',
                    transition:   `background var(--qme-dur-fast) var(--qme-ease),
                                   color    var(--qme-dur-fast) var(--qme-ease)`,
                    fontFamily:   'var(--qme-font)',
                  }}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sub-nav breadcrumb (desktop) */}
          {subItems.length > 0 && (
            <nav
              role="navigation"
              aria-label="Sub-section"
              style={{ display:'flex', alignItems:'center', gap:'2px', marginLeft:'auto' }}
            >
              <span style={{ color:'var(--qme-gray-300)', marginRight:'6px' }}>
                <ChevronRight size={14} />
              </span>
              {subItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    aria-current={active ? 'page' : undefined}
                    className="qme-focus"
                    style={{
                      padding:      '5px 12px',
                      borderRadius: 'var(--qme-r-sm)',
                      border:       active ? '1px solid var(--qme-primary-border)' : '1px solid transparent',
                      background:   active ? 'var(--qme-primary-bg)' : 'transparent',
                      color:        active ? 'var(--qme-primary-hover)' : 'var(--qme-gray-500)',
                      fontWeight:   active ? 600 : 500,
                      fontSize:     '13px',
                      cursor:       'pointer',
                      transition:   `all var(--qme-dur-fast) var(--qme-ease)`,
                      fontFamily:   'var(--qme-font)',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Prototype badge */}
          <span style={{
            marginLeft:   '16px',
            padding:      '3px 9px',
            background:   'var(--qme-warning-bg)',
            border:       '1px solid var(--qme-warning-border)',
            borderRadius: 'var(--qme-r-full)',
            color:        'var(--qme-warning)',
            fontSize:     '11px',
            fontWeight:   600,
            letterSpacing:'0.03em',
            flexShrink:   0,
          }}>
            PROTOTYPE
          </span>
        </div>
      </header>

      {/* ── Page content ─────────────────────────────────────────────── */}
      <main id="main-content" tabIndex={-1} style={{ outline:'none' }}>
        <Outlet />
      </main>
    </div>
  );
}
