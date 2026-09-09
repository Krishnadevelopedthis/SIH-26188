import React, { useState, useMemo } from 'react';
import { Search, ClipboardList, ChevronDown, X } from 'lucide-react';
import {
  Card, StatusBadge, CheckBadge, SectionHeader, statusMeta,
} from '../components/ui';

const STATUS_OPTS = ['ALL', 'CLEAR', 'REVIEW', 'HIGH-RISK'];

export default function History({ history }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expanded, setExpanded] = useState(null);

  const filtered = useMemo(() => (
    history.filter((r) => {
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const q = search.trim().toLowerCase();

      const matchSearch = !q
        || r.document?.name?.toLowerCase().includes(q)
        || r.document?.passport_number?.toLowerCase().includes(q)
        || r.document?.nationality?.toLowerCase().includes(q);

      return matchStatus && matchSearch;
    })
  ), [history, search, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <SectionHeader
        title="Verification history"
        subtitle={`${history.length} record${history.length === 1 ? '' : 's'} this session.`}
      />

      <Card>
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search
              size={15}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />

            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, passport number or nationality…"
              aria-label="Search records"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 0,
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  padding: 4,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter by status"
            style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}
          >
            {STATUS_OPTS.map((opt) => (
              <button
                key={opt}
                type="button"
                aria-pressed={statusFilter === opt}
                className={`chip${statusFilter === opt ? ' chip--on' : ''}`}
                onClick={() => setStatusFilter(opt)}
              >
                {opt === 'ALL' ? 'All' : statusMeta(opt).label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState hasHistory={history.length > 0} />
        ) : (
          /* The table keeps control-room column widths and scrolls inside
             its own container, so a kiosk never scrolls the page sideways. */
          <div className="scroll-x">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Passport no.</th>
                  <th>Passenger</th>
                  <th>Nat.</th>
                  <th className="num">Risk</th>
                  <th>Status</th>
                  <th><span className="sr-only">Detail</span></th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => {
                  const open = expanded === r.id;
                  const meta = statusMeta(r.status);

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className={`is-clickable${open ? ' is-open' : ''}`}
                        onClick={() => setExpanded(open ? null : r.id)}
                        tabIndex={0}
                        aria-expanded={open}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpanded(open ? null : r.id);
                          }
                        }}
                      >
                        <td className="u-mono" style={{ whiteSpace: 'nowrap' }}>
                          {formatTime(r.timestamp)}
                        </td>
                        <td className="u-mono">{r.document?.passport_number || '—'}</td>
                        <td style={{ fontWeight: 500 }}>{r.document?.name || r.filename}</td>
                        <td className="u-mono">{r.document?.nationality || '—'}</td>
                        <td className="num u-mono" style={{ fontWeight: 600, color: meta.color }}>
                          {meta.unscreened ? '—' : r.risk_score}
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>
                          <ChevronDown
                            size={15}
                            aria-hidden="true"
                            className={`disclosure__chevron${open ? ' disclosure__chevron--open' : ''}`}
                            style={{ color: 'var(--color-text-muted)', display: 'block' }}
                          />
                        </td>
                      </tr>

                      {open && (
                        <tr>
                          <td colSpan={7} style={{ background: 'var(--color-bg)', padding: 'var(--space-5)' }}>
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 'var(--space-6)',
                              }}
                            >
                              <div>
                                <div className="u-label" style={{ marginBottom: 'var(--space-3)' }}>
                                  Document
                                </div>
                                <InfoRow label="Full name" value={r.document?.name} />
                                <InfoRow label="Date of birth" value={r.document?.date_of_birth_fmt} mono />
                                <InfoRow label="Expiry" value={r.document?.date_of_expiry_fmt} mono />
                                <InfoRow label="Issuing country" value={r.document?.issuing_country} mono />
                              </div>

                              <div>
                                <div className="u-label" style={{ marginBottom: 'var(--space-3)' }}>
                                  Checks
                                </div>
                                {Object.entries(r.checks || {}).map(([key, val]) => (
                                  <div
                                    key={key}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 'var(--space-3)',
                                      marginBottom: 'var(--space-2)',
                                    }}
                                  >
                                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                                      {checkLabel(key)}
                                    </span>
                                    <CheckBadge result={val} />
                                  </div>
                                ))}
                              </div>

                              <div>
                                <div className="u-label" style={{ marginBottom: 'var(--space-3)' }}>
                                  Findings
                                </div>
                                {r.reasons?.length ? r.reasons.map((reason, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      gap: 'var(--space-2)',
                                      fontSize: 'var(--text-sm)',
                                      color: 'var(--color-text-secondary)',
                                      marginBottom: 'var(--space-2)',
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    <span style={{ color: meta.color, flexShrink: 0, display: 'flex', marginTop: 2 }}>
                                      <meta.Icon size={14} aria-hidden="true" />
                                    </span>
                                    <span>{reason}</span>
                                  </div>
                                )) : (
                                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                                    None recorded.
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {filtered.length > 0 && filtered.length !== history.length && (
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
          }}
        >
          Showing {filtered.length} of {history.length} records
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasHistory }) {
  return (
    <div
      style={{
        padding: 'var(--space-16) var(--space-5)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
      }}
    >
      <ClipboardList size={28} style={{ opacity: 0.35, marginBottom: 'var(--space-3)' }} aria-hidden="true" />
      <div
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 500,
          color: 'var(--color-text-secondary)',
          marginBottom: 2,
        }}
      >
        {hasHistory ? 'No records match your filters.' : 'No verification records yet.'}
      </div>
      <div style={{ fontSize: 'var(--text-sm)' }}>
        {hasHistory
          ? 'Try a different search or status filter.'
          : 'Completed screenings appear here.'}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{label}</span>
      <span
        className={mono ? 'u-mono' : undefined}
        style={{ fontSize: 'var(--text-sm)', fontWeight: 500, textAlign: 'right' }}
      >
        {value || '—'}
      </span>
    </div>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function checkLabel(key) {
  const map = {
    ocr: 'OCR',
    mrz: 'MRZ',
    expiry: 'Expiry',
    tampering: 'Tampering',
    face: 'Face',
    consistency: 'Consistency',
  };
  return map[key] || key;
}
