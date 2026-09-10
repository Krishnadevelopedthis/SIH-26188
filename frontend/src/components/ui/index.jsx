import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  MinusCircle,
  ChevronDown,
} from 'lucide-react';

/* ── Badge ───────────────────────────────────────────────────────────
   Appearance lives in index.css so hover, focus and reduced-motion can
   reach it. Inline styles can express none of those, which is why the
   old primitives simulated hover with mouse handlers.
   ─────────────────────────────────────────────────────────────────── */
export function Badge({ children, variant = 'default', size = 'sm', icon }) {
  return (
    <span className={`badge badge--${variant}${size === 'lg' ? ' badge--lg' : ''}`}>
      {icon}
      {children}
    </span>
  );
}

/* ── status vocabulary ───────────────────────────────────────────────
   One table, so a verdict looks and reads identically on every screen.
   Every entry carries an icon: colour alone never states an outcome.
   ─────────────────────────────────────────────────────────────────── */
export const STATUS = {
  CLEAR: {
    variant: 'clear',
    label: 'CLEAR',
    tone: 'clear',
    color: 'var(--color-clear)',
    Icon: CheckCircle2,
    headline: 'Document cleared for entry.',
  },
  REVIEW: {
    variant: 'review',
    label: 'REVIEW',
    tone: 'review',
    color: 'var(--color-review)',
    Icon: AlertTriangle,
    headline: 'Manual review required before clearance.',
  },
  'HIGH-RISK': {
    variant: 'risk',
    label: 'HIGH RISK',
    tone: 'risk',
    color: 'var(--color-risk)',
    Icon: XCircle,
    headline: 'Document flagged. Do not clear without supervisor.',
  },
  UNREADABLE: {
    variant: 'info',
    label: 'UNREADABLE',
    tone: 'info',
    color: 'var(--color-info)',
    Icon: HelpCircle,
    headline: 'Image could not be read. Rescan the document.',
    unscreened: true,
  },
  NOT_A_DOCUMENT: {
    variant: 'info',
    label: 'NOT A DOCUMENT',
    tone: 'info',
    color: 'var(--color-info)',
    Icon: HelpCircle,
    headline: 'No travel document found in this image.',
    unscreened: true,
  },
};

export function statusMeta(status) {
  return STATUS[status] || STATUS.REVIEW;
}

export function StatusBadge({ status, size = 'sm', withIcon = false }) {
  const meta = statusMeta(status);
  const Icon = meta.Icon;

  return (
    <Badge
      variant={meta.variant}
      size={size}
      icon={withIcon ? <Icon size={size === 'lg' ? 15 : 13} aria-hidden="true" /> : null}
    >
      {meta.label}
    </Badge>
  );
}

/* ── CheckBadge ──────────────────────────────────────────────────── */
const CHECK_META = {
  PASS: { variant: 'pass', Icon: CheckCircle2 },
  FAIL: { variant: 'fail', Icon: XCircle },
  SUSPICIOUS: { variant: 'suspicious', Icon: AlertTriangle },
  NOT_RUN: { variant: 'default', Icon: MinusCircle },
};

export function CheckBadge({ result }) {
  const meta = CHECK_META[result] || CHECK_META.NOT_RUN;
  const Icon = meta.Icon;

  return (
    <Badge variant={meta.variant} icon={<Icon size={13} aria-hidden="true" />}>
      {result === 'NOT_RUN' ? 'NOT RUN' : result}
    </Badge>
  );
}

/* ── CheckRow ────────────────────────────────────────────────────── */
export function CheckRow({ name, result }) {
  return (
    <div className="checkrow">
      <span className="checkrow__name">{name}</span>
      <CheckBadge result={result} />
    </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────── */
export function Card({ children, style = {}, className = '', onClick, interactive }) {
  const isInteractive = interactive ?? Boolean(onClick);

  return (
    <div
      className={`card${isInteractive ? ' card--interactive' : ''}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

/* ── Button ──────────────────────────────────────────────────────── */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  type = 'button',
  style = {},
  icon,
  className = '',
  ...rest
}) {
  const sizeClass = size === 'lg' ? ' btn--lg' : size === 'sm' ? ' btn--sm' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn--${variant}${sizeClass}${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/* ── Divider ─────────────────────────────────────────────────────── */
export function Divider({ style = {} }) {
  return (
    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', ...style }} />
  );
}

/* ── Spinner ─────────────────────────────────────────────────────── */
export function Spinner({ size = 20, color = 'var(--color-accent)' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ── SectionHeader ───────────────────────────────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="section-header">
      <div className="section-header__text">
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: subtitle ? 2 : 0 }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  );
}

/* ── RiskGauge ───────────────────────────────────────────────────────
   The arc sweeps and the numeral counts up from zero, so the score
   registers as a magnitude rather than a figure. Both settle on the
   true value immediately when reduced motion is requested.
   ─────────────────────────────────────────────────────────────────── */
export function RiskGauge({ score = 0, status, size = 108 }) {
  const meta = statusMeta(status);
  const [shown, setShown] = useState(0);
  const frame = useRef();

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setShown(score);
      return undefined;
    }

    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / 600);
      // The same ease-out the arc uses, so numeral and sweep stay together.
      setShown(Math.round(score * (1 - Math.pow(1 - t, 3))));

      if (t < 1) frame.current = requestAnimationFrame(tick);
    };

    frame.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame.current);
  }, [score]);

  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // Three-quarter arc, opening at the bottom.
  const arcLength = circumference * 0.75;
  const clamped = Math.min(100, Math.max(0, score));
  const offset = arcLength * (1 - clamped / 100);

  return (
    <div
      className="gauge"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Risk score ${score} out of 100`}
    >
      <svg width={size} height={size} style={{ display: 'block' }} aria-hidden="true">
        <g transform={`rotate(135 ${size / 2} ${size / 2})`}>
          <circle
            className="gauge__track"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke="currentColor"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          <circle
            className="gauge__arc"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke={meta.color}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
          />
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: Math.round(size * 0.06),
        }}
      >
        <span className="gauge__value" style={{ color: meta.color }}>{shown}</span>
        <span className="gauge__caption">Risk</span>
      </div>
    </div>
  );
}

/* ── Disclosure ──────────────────────────────────────────────────────
   Detail an officer asks for, rather than detail competing with the
   verdict for the first second of attention.
   ─────────────────────────────────────────────────────────────────── */
export function Disclosure({ title, count, children, defaultOpen = false, id = 'disclosure' }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `${id}-panel`;

  return (
    <div className="card">
      <button
        type="button"
        className="disclosure__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="u-label" style={{ color: 'var(--color-text-secondary)' }}>{title}</span>
          {count != null && <Badge variant="default">{count}</Badge>}
        </span>

        <ChevronDown
          size={17}
          className={`disclosure__chevron${open ? ' disclosure__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className="disclosure__panel">
          {children}
        </div>
      )}
    </div>
  );
}

/* ── StatTile ────────────────────────────────────────────────────── */
export function StatTile({ label, value, tone = 'default', icon }) {
  const color =
    tone === 'clear' ? 'var(--color-clear)'
      : tone === 'review' ? 'var(--color-review)'
        : tone === 'risk' ? 'var(--color-risk)'
          : 'var(--color-text-primary)';

  return (
    <Card>
      <div className="stat">
        <div className="stat__row">
          {icon && <span style={{ color, display: 'flex' }}>{icon}</span>}
          <span className="u-label">{label}</span>
        </div>
        <span className="stat__value" style={{ color }}>{value}</span>
      </div>
    </Card>
  );
}

/* ── ScanProgress ────────────────────────────────────────────────────
   OCR is about 3.4s of a ~4.5s verification, so one spinner would sit
   still for almost the whole wait. Naming the stages shows the officer
   that work is moving and where the time goes.
   ─────────────────────────────────────────────────────────────────── */
export const SCAN_STAGES = [
  { key: 'ocr', label: 'Reading document', ms: 3400 },
  { key: 'mrz', label: 'Validating MRZ', ms: 400 },
  { key: 'forensics', label: 'Forensic analysis', ms: 500 },
  { key: 'risk', label: 'Scoring risk', ms: 300 },
];

export function ScanProgress() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [];
    let elapsed = 0;

    SCAN_STAGES.forEach((s, index) => {
      elapsed += s.ms;

      if (index < SCAN_STAGES.length - 1) {
        timers.push(setTimeout(() => setStage(index + 1), elapsed));
      }
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="scan">
      <div
        className="scan__stages"
        role="status"
        aria-live="polite"
        aria-label={`Verification in progress: ${SCAN_STAGES[stage].label}`}
      >
        {SCAN_STAGES.map((s, index) => (
          <div
            key={s.key}
            className={
              'scan__stage'
              + (index === stage ? ' scan__stage--active' : '')
              + (index < stage ? ' scan__stage--done' : '')
            }
          >
            <div className="scan__bar" />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
