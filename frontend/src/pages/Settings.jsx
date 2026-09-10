import React from 'react';
import { Card, SectionHeader, Badge } from '../components/ui';
import { USE_MOCK } from '../api/verification';

export default function Settings() {
  return (
    <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <SectionHeader
        title="Settings"
        subtitle="System configuration and officer details."
      />

      <SettingsGroup title="API configuration">
        <SettingRow
          label="API mode"
          value={USE_MOCK ? 'Mock (development)' : 'Live backend'}
          badge={USE_MOCK ? 'review' : 'clear'}
          note={
            USE_MOCK
              ? 'Set USE_MOCK to false in src/api/verification.js to use the real backend.'
              : 'Requests go to VITE_API_URL.'
          }
        />
        <SettingRow
          label="Endpoint"
          value={USE_MOCK ? '—' : (import.meta.env.VITE_API_URL || 'not configured')}
          mono
        />
        <SettingRow label="Route" value="POST /verify" mono last />
      </SettingsGroup>

      <SettingsGroup title="Officer">
        <SettingRow label="Name" value="Officer K. Sharma" />
        <SettingRow label="Post" value="Gate 7 — Terminal 2" />
        <SettingRow label="Access level" value="Standard officer" last />
      </SettingsGroup>

      <SettingsGroup title="About">
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: 'var(--color-text-primary)' }}>SIH-26188</strong>
          {' '}— AI-based identity and document screening.
          <br />
          Smart India Hackathon 2026.
          <br />
          <span className="u-mono" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            feature/frontend
          </span>
        </div>
      </SettingsGroup>
    </div>
  );
}

function SettingsGroup({ title, children }) {
  return (
    <Card>
      <div style={{ padding: 'var(--space-5)' }}>
        <div className="u-label" style={{ marginBottom: 'var(--space-4)' }}>{title}</div>
        {children}
      </div>
    </Card>
  );
}

function SettingRow({ label, value, note, badge, mono, last }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 'var(--space-4)',
        padding: 'var(--space-3) 0',
        borderBottom: last ? 'none' : '1px solid var(--color-border)',
      }}
    >
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
        {label}
      </div>

      <div style={{ textAlign: 'right', minWidth: 0 }}>
        {badge ? (
          <Badge variant={badge}>{value}</Badge>
        ) : (
          <div
            className={mono ? 'u-mono' : undefined}
            style={{ fontSize: 'var(--text-sm)', fontWeight: 500, wordBreak: 'break-all' }}
          >
            {value}
          </div>
        )}

        {note && (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              marginTop: 4,
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  );
}
