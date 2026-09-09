import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileImage,
  X,
  ScanLine,
  XCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

import { STATES } from '../hooks/useVerification';
import {
  Card,
  Button,
  StatusBadge,
  CheckRow,
  Disclosure,
  RiskGauge,
  ScanProgress,
  Spinner,
  SectionHeader,
  statusMeta,
} from '../components/ui';

export default function Verify({ hook, onResult }) {
  const {
    state,
    file,
    previewUrl,
    result,
    error,
    selectFile,
    startVerification,
    reset,
  } = hook;

  function handleFileSelect(f) {
    if (!f) return;

    const allowed = ['image/jpeg', 'image/png'];

    if (!allowed.includes(f.type)) {
      alert('Please upload a JPEG or PNG passport image.');
      return;
    }

    if (f.size > 20 * 1024 * 1024) {
      alert('File size must be under 20 MB.');
      return;
    }

    selectFile(f);
  }

  async function handleVerify() {
    if (!file) return;

    const data = await startVerification();

    if (data) {
      onResult(data, file);
    }
  }

  return (
    <div style={{ maxWidth: 1080 }}>
      <SectionHeader
        title="Document Verification"
        subtitle="Upload a passport image to run AI-assisted forensic screening."
        action={
          state !== STATES.IDLE && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              icon={<RotateCcw size={13} />}
            >
              New verification
            </Button>
          )
        }
      />

      {state === STATES.IDLE && (
        <DropZone onFile={handleFileSelect} />
      )}

      {state === STATES.UPLOADING && (
        <PreviewStep
          previewUrl={previewUrl}
          file={file}
          onVerify={handleVerify}
          onReset={reset}
        />
      )}

      {state === STATES.LOADING && (
        <LoadingState file={file} />
      )}

      {state === STATES.RESULT && result && (
        <ResultView
          result={result}
          previewUrl={previewUrl}
          onReset={reset}
        />
      )}

      {state === STATES.ERROR && (
        <ErrorState
          message={error}
          onReset={reset}
        />
      )}
    </div>
  );
}

/* ── Drop Zone ───────────────────────────────────────────────────── */

function DropZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);

    const f = e.dataTransfer.files[0];

    if (f) {
      onFile(f);
    }
  }

  return (
    <Card
      style={{
        border: `2px dashed ${
          dragging
            ? 'var(--color-brand-mid)'
            : 'var(--color-border-strong)'
        }`,
        background: dragging
          ? 'var(--color-info-bg)'
          : 'var(--color-surface)',
        padding: '64px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        transition:
          'border-color var(--transition-fast), background var(--transition-fast)',
        boxShadow: 'none',
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        style={{ display: 'none' }}
        onChange={(e) => onFile(e.target.files[0])}
        aria-label="Upload passport image"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-xl)',
            background: dragging
              ? 'var(--color-info-bg)'
              : 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <UploadCloud
            size={28}
            style={{
              color: dragging
                ? 'var(--color-brand-mid)'
                : 'var(--color-text-muted)',
            }}
          />
        </div>

        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}
        >
          {dragging
            ? 'Release to upload'
            : 'Upload passport image'}
        </div>

        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-text-muted)',
            marginBottom: 20,
          }}
        >
          Drag and drop, or click to browse
        </div>

        <Button
          size="sm"
          variant="secondary"
          style={{ pointerEvents: 'none' }}
          icon={<FileImage size={13} />}
        >
          Browse files
        </Button>

        <div
          style={{
            fontSize: '11px',
            color: 'var(--color-text-muted)',
            marginTop: 16,
          }}
        >
          JPEG or PNG · Max 20 MB
        </div>
      </div>
    </Card>
  );
}

/* ── Preview step ────────────────────────────────────────────────── */

function PreviewStep({
  previewUrl,
  file,
  onVerify,
  onReset,
}) {
  const [zoom, setZoom] = useState(1);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 360px',
        gap: 24,
      }}
    >
      <Card
        style={{
          padding: 24,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Document Preview
          </span>

          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setZoom((z) => Math.min(2, z + 0.25))
              }
              icon={<ZoomIn size={13} />}
              aria-label="Zoom in"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setZoom((z) => Math.max(0.5, z - 0.25))
              }
              icon={<ZoomOut size={13} />}
              aria-label="Zoom out"
            />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(1)}
            >
              Reset
            </Button>
          </div>
        </div>

        <div
          style={{
            background: 'var(--color-bg-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 260,
            padding: 8,
          }}
        >
          <img
            src={previewUrl}
            alt="Passport preview"
            style={{
              maxWidth: '100%',
              maxHeight: 400,
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform var(--transition-base)',
            }}
          />
        </div>
      </Card>

      <Card
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: 12,
              color: 'var(--color-text-primary)',
            }}
          >
            Document Ready
          </div>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <FileImage
              size={16}
              style={{
                color: 'var(--color-text-muted)',
                flexShrink: 0,
                marginTop: 2,
              }}
            />

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {file?.name}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--color-text-muted)',
                  marginTop: 2,
                }}
              >
                {formatFileSize(file?.size)}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '12px 14px',
            background: 'var(--color-info-bg)',
            border: '1px solid #BFCFE8',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--color-info)',
            lineHeight: 1.5,
          }}
        >
          Verification will run OCR, MRZ decoding, expiry validation,
          and forensic tampering analysis.
        </div>

        <Button
          size="lg"
          onClick={onVerify}
          style={{ width: '100%' }}
          icon={<ScanLine size={16} />}
        >
          Start Verification
        </Button>

        <Button
          size="md"
          variant="secondary"
          onClick={onReset}
          style={{ width: '100%' }}
          icon={<X size={14} />}
        >
          Remove and start over
        </Button>
      </Card>
    </div>
  );
}

/* ── Loading state ───────────────────────────────────────────────── */

function LoadingState({ file }) {
  return (
    <Card
      style={{
        padding: 'var(--space-8) var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Spinner size={22} />

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>
            Verifying document…
          </div>
          <div
            className="u-mono"
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file?.name}
          </div>
        </div>
      </div>

      {/* Reading the document is most of the wait, so the stages are
          named rather than hidden behind a spinner that never moves. */}
      <ScanProgress />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        <div className="skeleton" style={{ height: 12, width: '60%' }} />
        <div className="skeleton" style={{ height: 12, width: '85%' }} />
        <div className="skeleton" style={{ height: 12, width: '45%' }} />
      </div>
    </Card>
  );
}


const CHECK_LABELS = {
  ocr: 'OCR extraction',
  mrz: 'MRZ validation',
  expiry: 'Expiry check',
  tampering: 'Tampering detection',
  face: 'Face verification',
  consistency: 'Field consistency',
};

function ResultView({ result, previewUrl, onReset }) {
  const { status, risk_score, document: doc, checks, reasons } = result;

  const meta = statusMeta(status);
  const Icon = meta.Icon;

  const entries = Object.entries(checks || {});

  const flagged = entries.filter(
    ([, value]) => value === 'FAIL' || value === 'SUSPICIOUS'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

      {/* ── Verdict ──────────────────────────────────────────────────
          The only thing that has to be legible in the first second.
          ─────────────────────────────────────────────────────────── */}
      <div className={`verdict verdict--${meta.tone}`}>
        <span style={{ color: meta.color, display: 'flex', flexShrink: 0 }}>
          <Icon size={26} aria-hidden="true" />
        </span>

        <div className="verdict__body">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flexWrap: 'wrap',
              marginBottom: 2,
            }}
          >
            <StatusBadge status={status} size="lg" />
            <span className="verdict__headline">{meta.headline}</span>
          </div>

          <div className="verdict__meta">
            {meta.unscreened ? (
              'Not screened — no risk score applies.'
            ) : (
              <>
                Risk score{' '}
                <strong className="u-mono" style={{ color: meta.color }}>
                  {risk_score}
                </strong>
                {' '}of 100
                {flagged > 0 && (
                  <> · {flagged} check{flagged > 1 ? 's' : ''} flagged</>
                )}
              </>
            )}
          </div>
        </div>

        {!meta.unscreened && <RiskGauge score={risk_score} status={status} />}
      </div>

      <div className="grid-2">

        {/* ── Document ─────────────────────────────────────────────── */}
        <Card style={{ padding: 'var(--space-4)' }}>
          <div className="u-label" style={{ marginBottom: 'var(--space-3)' }}>
            Document
          </div>

          <div
            className="doc-preview"
            style={{
              background: 'var(--color-bg-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'center',
              padding: 'var(--space-2)',
            }}
          >
            <img
              src={previewUrl}
              alt="Submitted document"
              style={{
                maxWidth: '100%',
                maxHeight: 240,
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>

          <InfoGrid
            data={[
              { label: 'Passport No.', value: doc?.passport_number, mono: true },
              { label: 'Full name', value: doc?.name },
              { label: 'Nationality', value: doc?.nationality, mono: true },
              { label: 'Date of birth', value: formatDate(doc?.date_of_birth), mono: true },
              { label: 'Date of expiry', value: formatDate(doc?.date_of_expiry), mono: true },
              { label: 'Issued by', value: doc?.issuing_country, mono: true },
            ]}
          />
        </Card>

        {/* ── Detail, on request ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          <Disclosure
            id="checks"
            title="Verification checks"
            count={flagged > 0 ? `${flagged} flagged` : entries.length}
          >
            <div className="stagger" style={{ borderTop: '1px solid var(--color-border)' }}>
              {entries.map(([key, value]) => (
                <CheckRow key={key} name={CHECK_LABELS[key] || key} result={value} />
              ))}
            </div>
          </Disclosure>

          {/* Open by default when there is something to act on. */}
          <Disclosure
            id="reasons"
            title={status === 'CLEAR' ? 'Verification notes' : 'Risk factors'}
            count={reasons?.length || 0}
            defaultOpen={status !== 'CLEAR' && Boolean(reasons?.length)}
          >
            <div
              className="stagger"
              style={{
                borderTop: '1px solid var(--color-border)',
                padding: 'var(--space-4)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              {reasons?.length ? (
                reasons.map((reason, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: 'var(--space-3)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    <span style={{ color: meta.color, flexShrink: 0, display: 'flex', marginTop: 2 }}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span>{reason}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  No additional verification notes.
                </div>
              )}
            </div>
          </Disclosure>

          <Button
            variant="secondary"
            onClick={onReset}
            style={{ width: '100%' }}
            icon={<RotateCcw size={15} aria-hidden="true" />}
          >
            Verify another document
          </Button>
        </div>
      </div>
    </div>
  );
}


/* ── Info grid ───────────────────────────────────────────────────── */

function InfoGrid({ data }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-3) var(--space-4)',
      }}
    >
      {data.map(({ label, value, mono }) => (
        <div key={label}>
          <div className="u-label" style={{ marginBottom: 2 }}>{label}</div>

          <div
            className={mono ? 'u-mono' : undefined}
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: value ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            }}
          >
            {value || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Error state ─────────────────────────────────────────────────── */

function ErrorState({ message, onReset }) {
  return (
    <Card
      style={{
        padding: '48px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-risk-bg)',
          border: '1px solid var(--color-risk-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <XCircle
          size={24}
          style={{
            color: 'var(--color-risk)',
          }}
        />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: 6,
          }}
        >
          Verification failed
        </div>

        <div
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            maxWidth: 400,
          }}
        >
          {message}
        </div>

        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginTop: 6,
          }}
        >
          Retry or perform manual inspection.
        </div>
      </div>

      <Button
        size="md"
        onClick={onReset}
        icon={<RotateCcw size={14} />}
      >
        Try again
      </Button>
    </Card>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function formatDate(dateString) {
  if (!dateString) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '';

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}