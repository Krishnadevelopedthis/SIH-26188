import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, ClipboardList, Settings,
  Shield, ChevronRight, Circle, Sun, Moon,
} from 'lucide-react';
import { USE_MOCK } from '../../api/verification';
import { useTheme } from '../../hooks/useTheme';

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/verify',   label: 'Verify',    icon: ScanLine },
  { to: '/history',  label: 'History',   icon: ClipboardList },
  { to: '/settings', label: 'Settings',  icon: Settings },
];

export default function AppShell({ children }) {
  const location = useLocation();
  const { theme, toggle } = useTheme();

  const pageTitle = NAV_ITEMS.find((n) =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )?.label || 'Dashboard';

  return (
    <div className="app">

      {/* ── Sidebar ──────────────────────────────────────────────────
          Width, hover and the collapse to an icon rail on a kiosk are
          all in index.css. Setting them inline here is what stopped
          the shell responding to the viewport at all.
          ─────────────────────────────────────────────────────────── */}
      <aside className="sidebar">

        <div
          style={{
            padding: '0 var(--space-4)',
            height: 'var(--topbar-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 30, height: 30,
              borderRadius: 'var(--radius-control)',
              background: 'var(--color-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={16} style={{ color: '#fff' }} aria-hidden="true" />
          </div>

          <div className="sidebar__brand-text" style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                color: '#F2F4F7',
                letterSpacing: '0.05em',
                lineHeight: 1.2,
              }}
            >
              DOCSCREEN
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.38)',
                letterSpacing: '0.04em',
              }}
            >
              SIH-26188
            </div>
          </div>
        </div>

        <nav
          style={{ padding: 'var(--space-4) var(--space-3)', flex: 1 }}
          aria-label="Main navigation"
        >
          <div
            className="sidebar__section-label u-label"
            style={{ color: 'rgba(255,255,255,0.32)', padding: '0 var(--space-2)', marginBottom: 'var(--space-2)' }}
          >
            Navigation
          </div>

          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={label}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              <Icon size={17} aria-hidden="true" style={{ flexShrink: 0 }} />
              <span className="sidebar__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-xs)',
              color: USE_MOCK ? 'rgba(239,199,126,0.85)' : 'rgba(120,220,170,0.85)',
            }}
            title={USE_MOCK ? 'Mock mode' : 'Live'}
          >
            <Circle size={6} style={{ fill: 'currentColor' }} aria-hidden="true" />
            <span className="sidebar__label">{USE_MOCK ? 'Mock mode' : 'Live'}</span>
          </div>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="main">

        <header className="topbar">
          <nav aria-label="Breadcrumb" className="topbar__crumb">
            <span className="topbar__crumb-prefix">Immigration Console</span>
            <ChevronRight
              size={14}
              className="topbar__crumb-sep"
              style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
              aria-hidden="true"
            />
            <span className="topbar__crumb-page">{pageTitle}</span>
          </nav>

          <div className="topbar__right">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            >
              {theme === 'dark'
                ? <Sun size={16} aria-hidden="true" />
                : <Moon size={16} aria-hidden="true" />}
            </button>

            <div className="topbar__officer">
              <div className="topbar__officer-name">Officer K. Sharma</div>
              <div className="topbar__officer-post">Gate 7 — Terminal 2</div>
            </div>

            <div className="topbar__avatar" aria-hidden="true">KS</div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
