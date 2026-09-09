import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, AlertTriangle, XCircle, ArrowRight,
  ShieldCheck, Fingerprint, FileCheck2, Activity, Sparkles, LockKeyhole,
} from 'lucide-react';
import { Card, Button, StatusBadge } from '../components/ui';

export default function Dashboard({ history }) {
  const navigate = useNavigate();
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  useEffect(() => {
    let mounted = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    async function loadVanta() {
      try {
        if (!window.THREE) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js');
        if (!mounted || !vantaRef.current || vantaEffect.current) return;
        vantaEffect.current = window.VANTA.NET({
          el: vantaRef.current, THREE: window.THREE, mouseControls: true, touchControls: true,
          gyroControls: false, minHeight: 240, minWidth: 200, scale: 1, scaleMobile: 1,
          color: 0x49b9e8, backgroundColor: 0x0b172a, points: 10, maxDistance: 24, spacing: 17, showDots: true,
        });
      } catch { /* optional visual enhancement */ }
    }
    loadVanta();
    return () => { mounted = false; if (vantaEffect.current) { vantaEffect.current.destroy(); vantaEffect.current = null; } };
  }, []);

  const total = history.length;
  const clear = history.filter(r => r.status === 'CLEAR').length;
  const review = history.filter(r => r.status === 'REVIEW').length;
  const highRisk = history.filter(r => r.status === 'HIGH-RISK').length;
  const avgRisk = total ? Math.round(history.reduce((a, r) => a + r.risk_score, 0) / total) : 0;
  const clearRate = total ? Math.round((clear / total) * 100) : 0;

  return (
    <div className="dashboard-page">
      <section ref={vantaRef} className="screening-hero">
        <div className="hero-grid" />
        <div className="hero-copy fade-in">
          <div className="eyebrow"><span className="pulse-dot" /> Identity intelligence platform</div>
          <h1>Screen every document<br /><em>with confidence.</em></h1>
          <p>AI-assisted passport screening that turns document signals into clear, defensible decisions for officers at the border.</p>
          <div className="hero-actions">
            <Button size="lg" onClick={() => navigate('/verify')} icon={<ScanLine size={17} />}>Start a screening</Button>
            <span className="hero-note"><LockKeyhole size={13} /> Secure officer workspace</span>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true"><div className="orbit-ring ring-one" /><div className="orbit-ring ring-two" /><div className="orbit-core"><Fingerprint size={30} /></div></div>
        <div className="hero-footer"><span>DOCSCREEN / CONTROL ROOM</span><span>MODEL STATUS <strong>OPERATIONAL</strong></span></div>
      </section>

      <main className="dashboard-content modern-dashboard">
        <div className="section-intro fade-in"><div><div className="section-kicker">Today at a glance</div><h2>Screening overview</h2></div><div className="live-chip"><Activity size={13} /> Live session</div></div>

        <div className="metric-grid">
          <MetricCard icon={<ScanLine />} label="Screenings" value={total} helper="This officer session" accent="cyan" />
          <MetricCard icon={<ShieldCheck />} label="Cleared" value={clear} helper={`${clearRate}% clearance rate`} accent="mint" />
          <MetricCard icon={<AlertTriangle />} label="Needs review" value={review} helper="Manual attention" accent="amber" />
          <MetricCard icon={<XCircle />} label="High risk" value={highRisk} helper="Escalate immediately" accent="coral" />
        </div>

        <div className="dashboard-panels">
          <Card className="activity-panel card-interactive">
            <div className="panel-heading"><div><div className="section-kicker">Signal monitor</div><h3>Risk distribution</h3></div><span className="panel-badge"><Activity size={12} /> Live</span></div>
            <div className="risk-visual"><div className="donut" style={{ '--progress': `${Math.max(clearRate, 4)}%` }}><div><strong>{avgRisk}</strong><span>avg risk</span></div></div><div className="legend"><Legend color="mint" label="Clear" value={clear} /><Legend color="amber" label="Review" value={review} /><Legend color="coral" label="High risk" value={highRisk} /></div></div>
            <div className="signal-line"><span>Session confidence</span><strong>{total ? `${Math.max(92 - avgRisk, 58)}%` : '—'}</strong></div>
          </Card>

          <Card className="workflow-panel card-interactive">
            <div className="panel-heading"><div><div className="section-kicker">Operator workflow</div><h3>Make your next decision</h3></div><Sparkles size={19} className="sparkle" /></div>
            <div className="workflow-list">
              <WorkflowStep number="01" icon={<FileCheck2 />} title="Upload a passport" text="Capture or select a document image." onClick={() => navigate('/verify')} />
              <WorkflowStep number="02" icon={<Fingerprint />} title="Run identity checks" text="Read OCR, MRZ, face and tamper signals." onClick={() => navigate('/verify')} />
              <WorkflowStep number="03" icon={<ShieldCheck />} title="Review the evidence" text="Get an explainable risk recommendation." onClick={() => navigate('/history')} />
            </div>
          </Card>
        </div>

        <Card className="recent-panel card-interactive">
          <div className="panel-heading recent-heading"><div><div className="section-kicker">Audit trail</div><h3>Recent screenings</h3></div>{history.length > 0 && <button className="text-action" onClick={() => navigate('/history')}>View all <ArrowRight size={14} /></button>}</div>
          {history.length === 0 ? <div className="empty-dashboard"><div className="empty-icon"><ScanLine size={25} /></div><h4>Your screening queue is clear</h4><p>Start a new passport screening and completed decisions will appear here.</p><Button size="sm" onClick={() => navigate('/verify')} icon={<ScanLine size={13} />}>New screening</Button></div> : <div className="recent-list">{history.slice(0, 5).map(r => <div className="recent-row" key={r.id} onClick={() => navigate('/history')}><div className="record-icon"><FileCheck2 size={15} /></div><div className="record-main"><strong>{r.document?.name || r.filename}</strong><span>{r.document?.passport_number || 'No passport number'} · {formatTime(r.timestamp)}</span></div><StatusBadge status={r.status} /><RiskPill score={r.risk_score} /><ArrowRight className="row-arrow" size={15} /></div>)}</div>}
        </Card>
      </main>
    </div>
  );
}

function MetricCard({ icon, label, value, helper, accent }) { return <Card className={`metric-card metric-${accent} card-interactive`}><div className="metric-icon">{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{helper}</small></div><div className="metric-spark"><i /><i /><i /><i /><i /></div></Card>; }
function Legend({ color, label, value }) { return <div className="legend-row"><span className={`legend-dot ${color}`} /><span>{label}</span><strong>{value}</strong></div>; }
function WorkflowStep({ number, icon, title, text, onClick }) { return <button className="workflow-step" onClick={onClick}><span className="step-number">{number}</span><span className="step-icon">{icon}</span><span className="step-copy"><strong>{title}</strong><small>{text}</small></span><ArrowRight size={15} /></button>; }
function RiskPill({ score }) { const color = score >= 75 ? 'var(--color-risk)' : score >= 40 ? 'var(--color-review)' : 'var(--color-clear)'; return <span className="risk-pill" style={{ color }}>{score}<small>/100</small></span>; }
function formatTime(date) { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
async function loadScript(src) { return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) { res(); return; } const s = document.createElement('script'); s.src = src; s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
