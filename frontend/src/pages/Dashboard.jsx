import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, CheckCircle2, AlertTriangle, XCircle, Gauge, ArrowRight,
} from 'lucide-react';
import {
  Card, Button, StatusBadge, StatTile, SectionHeader,
} from '../components/ui';

export default function Dashboard({ history }) {
  const navigate = useNavigate();

  const total = history.length;
  const clear = history.filter((r) => r.status === 'CLEAR').length;
  const review = history.filter((r) => r.status === 'REVIEW').length;
  const highRisk = history.filter((r) => r.status === 'HIGH-RISK').length;

  const avgRisk = total
    ? Math.round(history.reduce((a, r) => a + r.risk_score, 0) / total)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* The old header carried an animated 3D particle field loaded from a
          CDN. It threw on every render, and a moving background behind a
          shift's figures competes with the numbers for attention. */}
      <SectionHeader
        title="Checkpoint overview"
        subtitle="Gate 7 — Terminal 2 · screenings recorded this shift"
        action={
          <Button
            onClick={() => navigate('/verify')}
            icon={<ScanLine size={15} aria-hidden="true" />}
          >
            New verification
          </Button>
        }
      />

      <div className="grid-stats">
        <StatTile
          label="Screened"
          value={total}
          icon={<ScanLine size={16} aria-hidden="true" />}
        />
        <StatTile
          label="Clear"
          value={clear}
          tone="clear"
          icon={<CheckCircle2 size={16} aria-hidden="true" />}
        />
        <StatTile
          label="Review"
          value={review}
          tone="review"
          icon={<AlertTriangle size={16} aria-hidden="true" />}
        />
        <StatTile
          label="High risk"
          value={highRisk}
          tone="risk"
          icon={<XCircle size={16} aria-hidden="true" />}
        />
      </div>

      <div className="grid-2">
        <Card>
          <div style={{ padding: 'var(--space-5)' }}>
            <div className="u-label" style={{ marginBottom: 'var(--space-2)' }}>
              Average risk this shift
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <span
                className="stat__value"
                style={{ fontSize: 'var(--text-3xl)' }}
              >
                {avgRisk}
              </span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                / 100
              </span>
            </div>

            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-5)',
              }}
            >
              {total === 0
                ? 'No documents screened yet this shift.'
                : `Across ${total} document${total === 1 ? '' : 's'}, ${clear} cleared without review.`}
            </p>

            <Button
              onClick={() => navigate('/verify')}
              style={{ width: '100%' }}
              icon={<ScanLine size={15} aria-hidden="true" />}
            >
              Start verification
            </Button>
          </div>
        </Card>

        <Card>
          <div
            style={{
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-3)',
            }}
          >
            <span className="u-label">Recent verifications</span>

            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
              >
                View all <ArrowRight size={13} aria-hidden="true" />
              </Button>
            )}
          </div>

          {history.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-10) var(--space-5)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <Gauge size={26} style={{ opacity: 0.4, marginBottom: 'var(--space-2)' }} aria-hidden="true" />
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                No verifications yet
              </div>
              <div style={{ fontSize: 'var(--text-xs)', marginTop: 2 }}>
                Completed screenings appear here.
              </div>
            </div>
          ) : (
            <div className="stagger">
              {history.slice(0, 5).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="checkrow"
                  onClick={() => navigate('/history')}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 0,
                    borderBottom: '1px solid var(--color-border)',
                    font: 'inherit',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <span className="checkrow__name" style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {r.document?.name || r.filename}
                    </span>
                    <span
                      className="u-mono"
                      style={{
                        display: 'block',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      {r.document?.passport_number || '—'} · {formatTime(r.timestamp)}
                    </span>
                  </span>

                  <StatusBadge status={r.status} />
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
